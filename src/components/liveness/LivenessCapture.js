import { CameraView } from 'expo-camera';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, Vibration, View } from 'react-native';

import BocaAbierta from '../../assets/svg/gesto_boca_abierta.svg';
import BocaCerrada from '../../assets/svg/gesto_boca_cerrada.svg';
import OjosAbiertos from '../../assets/svg/gesto_ojos_abiertos.svg';
import OjosCerrados from '../../assets/svg/gesto_ojos_cerrados.svg';
import { isTablet } from '../../common/constants';

import { styles as appStyles } from '../../themes';
import CText from '../common/CText';

import { enviarEvidencia, LivenessError } from '../../api/liveness';

// Captura de la evidencia de la prueba de vida. La app solo toma las fotos y
// las manda: el servidor mide el movimiento y decide. Nada de lo que "vea"
// esta pantalla cambia el resultado. Tiempos medidos en teléfono real.
const PAUSA_ANTES_DE_REFERENCIA_MS = 1500;
const PAUSA_ANTES_DE_CADA_RETO_MS = 2000;
// Con los ojos cerrados no se ve la pantalla: más tiempo y aviso por vibración.
const PAUSA_ANTES_DE_RETO_OJOS_MS = 3000;
// Dos pulsos que suman más de 1 s: Android trata las vibraciones de 1 s o
// menos sin categoría como "vibración al tocar" y las descarta si el usuario
// la tiene apagada. [espera, vibra, pausa, vibra] en ms.
const VIBRACION_FIN = [0, 500, 250, 500];
const FOTOS_POR_RETO = 3;
// La referencia (de frente) es también la selfie que se compara con el carnet.
const REFERENCIA = { ancho: 1080, calidad: 0.85 };
const FOTO_RETO = { ancho: 640, calidad: 0.6 };
// El servidor espera la selfie "como en un espejo" (así se calibraron los
// ángulos). Con false, izquierda y derecha llegan invertidas.
const ESPEJAR_FOTO = true;

const TEXTO_MOVIMIENTO = {
  left: 'Gira a tu izquierda',
  right: 'Gira a tu derecha',
  up: 'Mira hacia arriba',
  mouth: 'Abre la boca',
  eyes: 'Cierra los ojos hasta sentir la vibración',
};
// [reposo, gesto]: el gesto se funde sobre el reposo y vuelve, en bucle.
const ESTADOS_GESTO = {
  mouth: { reposo: BocaCerrada, gesto: BocaAbierta, mantener: 900 },
  eyes: { reposo: OjosAbiertos, gesto: OjosCerrados, mantener: 1200 },
};
const ANCHO_GESTO = 150;
const ALTO_GESTO = 157;
const VIEWBOX_GESTO = '0 0 526 550';
const GIRO_FLECHA = { up: '0deg', right: '90deg', left: '-90deg' };
const VAIVEN = {
  left: { eje: 'x', px: -16 },
  right: { eje: 'x', px: 16 },
  up: { eje: 'y', px: -16 },
};
const POSICION_FLECHA = {
  left: { alignItems: 'flex-start', justifyContent: 'center' },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  up: { alignItems: 'center', justifyContent: 'flex-start' },
};

const esDireccion = m => m === 'left' || m === 'right' || m === 'up';
const pausa = ms => new Promise(resolver => setTimeout(resolver, ms));

function useLatido(clave, duracion = 450) {
  const [valor] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: duracion, useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: duracion, useNativeDriver: true }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [valor, clave, duracion]);
  return valor;
}

function IconoGesto({ gesto }) {
  const [progreso] = useState(() => new Animated.Value(0));
  const { reposo: Reposo, gesto: Gesto, mantener } = ESTADOS_GESTO[gesto];
  useEffect(() => {
    progreso.setValue(0);
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(progreso, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(mantener),
        Animated.timing(progreso, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [progreso, mantener]);
  const medidas = { width: ANCHO_GESTO, height: ALTO_GESTO, viewBox: VIEWBOX_GESTO };
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.capaFlecha, { alignItems: 'center', justifyContent: 'flex-end' }]}>
      <View style={styles.tarjetaGesto}>
        <View style={{ width: ANCHO_GESTO, height: ALTO_GESTO }}>
          <Reposo {...medidas} />
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: progreso }]}>
            <Gesto {...medidas} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function FlechaMovimiento({ movimiento, color }) {
  const avance = useLatido(movimiento);
  const { eje, px } = VAIVEN[movimiento];
  const desplazamiento = avance.interpolate({ inputRange: [0, 1], outputRange: [0, px] });
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.capaFlecha, POSICION_FLECHA[movimiento]]}>
      <Animated.View
        style={[
          styles.flecha,
          { backgroundColor: color },
          { transform: [eje === 'x' ? { translateX: desplazamiento } : { translateY: desplazamiento }] },
        ]}>
        <Text style={[styles.simboloFlecha, { transform: [{ rotate: GIRO_FLECHA[movimiento] }] }]}>
          ↑
        </Text>
      </Animated.View>
    </View>
  );
}

function borrar(...uris) {
  for (const uri of uris) {
    if (!uri) continue;
    try {
      const archivo = new File(uri);
      if (archivo.exists) archivo.delete();
    } catch {
      // Mejor esfuerzo; la ruta no debe ir a ningún registro.
    }
  }
}

/**
 * @param {{
 *  sesion: object,
 *  onResultado: (r: object) => void,
 *  onError: (e: LivenessError) => void,
 *  textColor?: string,
 *  secondaryColor?: string,
 *  primaryColor?: string,
 *  surfaceColor?: string,
 *  testID?: string,
 * }} props
 */
export default function LivenessCapture({
  sesion,
  onResultado,
  onError,
  textColor = '#111827',
  secondaryColor = '#6B7280',
  primaryColor = '#1D4ED8',
  surfaceColor = '#F3F4F6',
  testID,
}) {
  const camara = useRef(null);
  const iniciado = useRef(false);
  const activo = useRef(true);
  const [instruccion, setInstruccion] = useState('Mira de frente');
  const [detalle, setDetalle] = useState('Preparando cámara…');
  const [movimiento, setMovimiento] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [ovaloTam, setOvaloTam] = useState(null);

  function alMedir({ nativeEvent: { layout } }) {
    const alto = Math.min(layout.height * 0.8, (layout.width * 0.7) / 0.78);
    setOvaloTam({ width: alto * 0.78, height: alto });
  }

  useEffect(() => {
    activo.current = true;
    return () => {
      activo.current = false;
    };
  }, []);

  // Toma una foto, la reduce y devuelve su base64 (sin prefijo). Las copias
  // temporales se borran siempre.
  async function capturar(tamano) {
    if (Date.parse(sesion.expiresAt) <= Date.now()) throw new LivenessError('vencida');
    let original;
    let reducida;
    try {
      const foto = await camara.current?.takePictureAsync({ quality: 0.7, shutterSound: false });
      if (!foto) throw new LivenessError('servidor');
      original = foto.uri;
      const imagen = await ImageManipulator.manipulate(foto.uri)
        .resize({ width: tamano.ancho })
        .renderAsync();
      const resultado = await imagen.saveAsync({
        format: SaveFormat.JPEG,
        compress: tamano.calidad,
        base64: true,
      });
      reducida = resultado.uri;
      if (!resultado.base64) throw new LivenessError('servidor');
      return resultado.base64;
    } finally {
      borrar(original, reducida);
    }
  }

  async function ejecutar() {
    try {
      await pausa(PAUSA_ANTES_DE_REFERENCIA_MS);
      if (!activo.current) return;
      setDetalle('Quieto, sin moverte');
      const referencia = await capturar(REFERENCIA);

      const fotos = [];
      for (let posicion = 0; posicion < sesion.challenges.length; posicion++) {
        if (!activo.current) return;
        const reto = sesion.challenges[posicion];
        setMovimiento(reto);
        setInstruccion(TEXTO_MOVIMIENTO[reto]);
        const esOjos = reto === 'eyes';
        setDetalle(
          `Movimiento ${posicion + 1} de ${sesion.challenges.length}` +
            (esOjos ? ' · 3 segundos' : ''),
        );
        await pausa(esOjos ? PAUSA_ANTES_DE_RETO_OJOS_MS : PAUSA_ANTES_DE_CADA_RETO_MS);
        for (let n = 0; n < FOTOS_POR_RETO; n++) {
          if (!activo.current) return;
          fotos.push({ challengePosition: posicion, image: await capturar(FOTO_RETO) });
        }
        if (esOjos) Vibration.vibrate(VIBRACION_FIN);
      }

      if (!activo.current) return;
      setEnviando(true);
      setMovimiento(null);
      setInstruccion('Enviando…');
      setDetalle('Ya puedes mirar de frente');
      const resultado = await enviarEvidencia(sesion, referencia, fotos, () => {
        if (!activo.current) return;
        setInstruccion('Conexión lenta…');
        setDetalle('Reintentando, no cierres la app');
      });
      if (activo.current) onResultado(resultado);
    } catch (error) {
      if (activo.current) {
        onError(error instanceof LivenessError ? error : new LivenessError('servidor'));
      }
    }
  }

  function alEstarLista() {
    if (iniciado.current) return;
    iniciado.current = true;
    void ejecutar();
  }

  return (
    <View style={styles.raiz} testID={testID}>
      <CText type="R14" align="center" color={secondaryColor}>
        {detalle}
      </CText>
      <CText
        type="B24"
        align="center"
        color={textColor}
        style={appStyles.boldText}
        accessibilityRole="header"
        accessibilityLiveRegion="polite">
        {instruccion}
      </CText>
      <View
        onLayout={alMedir}
        style={[styles.contenedorCamara, { borderColor: primaryColor, backgroundColor: surfaceColor }]}>
        <CameraView
          ref={camara}
          style={styles.camara}
          facing="front"
          mirror={ESPEJAR_FOTO}
          onCameraReady={alEstarLista}
        />
        <View
          pointerEvents="none"
          style={[styles.ovalo, ovaloTam, { borderColor: primaryColor }, enviando && styles.oculto]}
        />
        {movimiento &&
          (esDireccion(movimiento) ? (
            <FlechaMovimiento movimiento={movimiento} color={primaryColor} />
          ) : (
            <IconoGesto gesto={movimiento} />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    gap: 8,
    width: '100%',
    maxWidth: isTablet ? 640 : undefined,
    alignSelf: 'center',
  },
  contenedorCamara: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camara: { ...StyleSheet.absoluteFillObject },
  ovalo: {
    width: '70%',
    aspectRatio: 0.78,
    borderWidth: 4,
    borderRadius: 999,
  },
  capaFlecha: { ...StyleSheet.absoluteFillObject, padding: 16 },
  flecha: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simboloFlecha: {
    color: '#FFFFFF',
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  tarjetaGesto: {
    padding: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(214, 207, 237, 0.94)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  oculto: { opacity: 0 },
});

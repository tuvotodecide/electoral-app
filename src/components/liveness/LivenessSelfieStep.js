import { useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import {
  crearSesion,
  LivenessError,
  mensajeErrorLiveness,
  mensajeRechazoLiveness,
} from '../../api/liveness';
import { isTablet, moderateScale } from '../../common/constants';
import images from '../../assets/images';
import { styles as appStyles } from '../../themes';
import { getSecondaryTextColor } from '../../utils/ThemeUtils';
import CButton from '../common/CButton';
import CText from '../common/CText';
import LivenessCapture from './LivenessCapture';

/**
 * Paso de selfie con prueba de vida. Sustituye a la foto simple: al aceptar el
 * servidor devuelve la selfie verificada y un resultado firmado que luego se
 * envía junto con el carnet.
 *
 * @param {{
 *  onVerified: (r: { selfie: { base64: string }, livenessResult: string }) => void,
 *  testID?: string,
 * }} props
 */
export default function LivenessSelfieStep({ onVerified, testID = 'livenessSelfieStep' }) {
  const colors = useSelector(state => state.theme.theme);
  const [permission, requestPermission] = useCameraPermissions();
  // preparando | captura | aviso. La intro (consejos y botón) ya la muestra
  // RegisterUser3, así que al montar se arranca directo la verificación.
  const [estado, setEstado] = useState({ tipo: 'preparando' });

  // La sesión dura poco (la fija el servidor): se pide al entrar al paso.
  async function empezar() {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        setEstado({ tipo: 'aviso', mensaje: 'Necesitamos la cámara para verificar tu rostro.' });
        return;
      }
    }
    setEstado({ tipo: 'preparando' });
    try {
      setEstado({ tipo: 'captura', sesion: await crearSesion() });
    } catch (error) {
      setEstado({ tipo: 'aviso', mensaje: mensajeErrorLiveness(error) });
    }
  }

  useEffect(() => {
    empezar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alResultado(resultado) {
    if (resultado.result === 'accepted') {
      onVerified({ selfie: { base64: resultado.selfie }, livenessResult: resultado.livenessResult });
      return;
    }
    setEstado({ tipo: 'aviso', mensaje: mensajeRechazoLiveness(resultado.reason) });
  }

  function alError(error) {
    setEstado({
      tipo: 'aviso',
      mensaje: mensajeErrorLiveness(error instanceof LivenessError ? error : undefined),
    });
  }

  if (estado.tipo === 'captura') {
    return (
      <View style={[local.contenedor, local.contenedorCaptura]} testID={`${testID}_captura`}>
        <LivenessCapture
          sesion={estado.sesion}
          onResultado={alResultado}
          onError={alError}
          textColor={colors.textColor}
          secondaryColor={getSecondaryTextColor(colors)}
          primaryColor={colors.primary}
          surfaceColor={colors.inputBackground}
        />
      </View>
    );
  }

  if (estado.tipo === 'preparando') {
    return (
      <View style={[local.contenedor, local.centrado]} testID={`${testID}_preparando`}>
        <ActivityIndicator size="large" color={colors.primary} />
        <CText align="center" color={getSecondaryTextColor(colors)} style={local.parrafo}>
          Preparando…
        </CText>
      </View>
    );
  }

  // Solo se llega aquí ante un error o un rechazo.
  return (
    <View style={local.contenedor} testID={testID}>
      <View style={local.contenido}>
        <Image
          source={images.FaceVerifyFailedImage}
          style={local.imagen}
        />
        <CText type="B24" align="center" style={appStyles.boldText}>
          No pudimos verificarte
        </CText>
        <CText align="center" color={getSecondaryTextColor(colors)} style={local.parrafo}>
          {estado.mensaje}
        </CText>
      </View>
      <CButton
        testID={`${testID}_start`}
        title="Intentar de nuevo"
        type="B16"
        onPress={empezar}
        containerStyle={appStyles.selfCenter}
      />
    </View>
  );
}

const local = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'space-between', ...appStyles.ph20, paddingVertical: moderateScale(10) },
  contenedorCaptura: { paddingTop: 0, paddingBottom: moderateScale(6) },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    gap: isTablet ? 16 : moderateScale(8),
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  imagen: {
    ...appStyles.selfCenter,
    height: isTablet ? 220 : moderateScale(180),
    width: isTablet ? 220 : moderateScale(180),
    resizeMode: 'contain',
    marginBottom: moderateScale(8),
  },
  parrafo: { lineHeight: isTablet ? 26 : moderateScale(22), paddingHorizontal: moderateScale(8) },
  centrado: { justifyContent: 'center', alignItems: 'center', gap: moderateScale(12) },
});

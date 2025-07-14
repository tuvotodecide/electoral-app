import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Platform,
  Alert,
  PermissionsAndroid,
  ToastAndroid,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';

import ViewShot, {captureRef} from 'react-native-view-shot';
import QRCodeSVG from 'react-native-qrcode-svg';
import RNFS from 'react-native-fs';
import {check, request, RESULTS, openSettings} from 'react-native-permissions';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import pako from 'pako';
import {Buffer} from 'buffer';

import {getSecrets} from '../../../utils/Cifrate';
import {getBioFlag} from '../../../utils/BioFlag';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../components/common/CText';
import CAlert from '../../../components/common/CAlert';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import String from '../../../i18n/String';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';

/* ───────── helpers de compresión ───────── */
const compress = obj =>
  Buffer.from(pako.deflate(JSON.stringify(obj))).toString('base64');

/* ────── FUNCIÓN DE PERMISOS PARA GALERÍA ────── */
const requestGalleryPermission = async () => {
  if (Platform.OS !== 'android') return true;

  let permission;

  if (Platform.Version >= 33) {
    // Android 13+ - Permisos específicos de media
    permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
  } else {
    // Android < 13 - Permiso tradicional
    permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  }

  const status = await check(permission);
  if (status === RESULTS.GRANTED) return true;

  const granted = await request(permission, {
    title: 'Permiso para galería',
    message: 'Necesitamos acceso para guardar el QR en tu galería.',
  });

  if (granted === RESULTS.GRANTED) return true;

  if (granted === RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Permiso denegado',
      'Para guardar en la galería, habilita el permiso en Configuración > Permisos',
      [
        {text: 'Abrir configuración', onPress: () => openSettings()},
        {text: 'OK'},
      ],
    );
  }
  return false;
};

/* ────── FUNCIÓN PARA GUARDAR EN GALERÍA ────── */

/* ────── FUNCIÓN SIMPLE PARA GUARDAR EN GALERÍA ────── */
const saveToGallery = async (base64Data, fileName) => {
  const picturesDir = `${RNFS.ExternalStorageDirectoryPath}/Pictures`;
  const path = `${picturesDir}/${fileName}`;

  if (!(await RNFS.exists(picturesDir))) {
    await RNFS.mkdir(picturesDir);
  }

  await RNFS.writeFile(path, base64Data, 'base64');

  // Fuerza a que aparezca en la galería
  await CameraRoll.save(`file://${path}`, {type: 'photo'});

  return path; // devuelve la ruta por si la necesitas
};

/* ────────────────────────────────────────── */

export default function RecuperationQR() {
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef(null);

  /* cargar secrets y preparar QR ----------------------- */
  useEffect(() => {
    (async () => {
      try {
        const {payloadQr} = await getSecrets();
        if (!payloadQr) throw new Error('No se encontró la identidad');

        const bioEnabled = await getBioFlag();
        setQrData(compress({...payloadQr, bioEnabled}));
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* FUNCIÓN PRINCIPAL PARA GUARDAR QR */
  const saveQr = async () => {
    if (!viewShotRef.current) {
      return Alert.alert('QR', 'El código aún no está listo');
    }

    if (saving) return;
    setSaving(true);

    try {
      // 1. Verificar permisos
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        setSaving(false);
        return;
      }

      // 2. Capturar el QR
      const b64 = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        result: 'base64',
      });

      const fileName = `QR_Recovery_${Date.now()}.png`;

      // 3. Intentar guardar en galería primero
      try {
        await saveToGallery(b64, fileName);

        ToastAndroid.show('QR guardado en la galería', ToastAndroid.LONG);

        Alert.alert('QR guardado', 'El código QR se guardó exitosamente ', [
          {text: 'OK', style: 'default'},
        ]);
      } catch (galleryError) {
        console.log('Error saving to gallery:', galleryError);

        // Fallback: guardar en directorio de descargas
        try {
          const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          await RNFS.writeFile(downloadPath, b64, 'base64');

          ToastAndroid.show('QR guardado en Descargas', ToastAndroid.LONG);

          Alert.alert(
            'QR guardado',
            `No se pudo guardar en la galería, pero se guardó en Descargas.\n\nArchivo: ${fileName}`,
            [
              {text: 'OK', style: 'default'},
              {
                text: 'Abrir descargas',
                onPress: () => {
                  Linking.openURL(
                    'content://com.android.externalstorage.documents/root/primary:Download',
                  ).catch(() => openSettings());
                },
              },
            ],
          );
        } catch (downloadError) {
          // Último recurso: directorio interno
          const internalPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
          await RNFS.writeFile(internalPath, b64, 'base64');

          Alert.alert(
            'QR guardado',
            `Se guardó en el directorio de la app:\n${internalPath}`,
            [{text: 'OK'}],
          );
        }
      }
    } catch (err) {
      console.error('Error saving QR:', err);

      let errorMessage = 'No se pudo guardar la imagen';
      if (err.message.includes('EACCES')) {
        errorMessage =
          'Sin permisos para escribir. Verifica los permisos de la app.';
      } else if (err.message.includes('ENOENT')) {
        errorMessage =
          'Error de directorio. Verifica los permisos de almacenamiento.';
      }

      Alert.alert('Error', errorMessage, [
        {text: 'OK', style: 'default'},
        {text: 'Abrir configuración', onPress: () => openSettings()},
      ]);
    } finally {
      setSaving(false);
    }
  };

  /* --------------- UI ------------------ */
  if (loading) {
    return (
      <CSafeAreaView>
        <CHeader title={String.qrRecoveryTitle} />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView>
      <CHeader title={String.qrRecoveryTitle} />

      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <ViewShot
          ref={viewShotRef}
          style={local.qrBox}
          options={{format: 'png', quality: 1}}>
          <QRCodeSVG
            value={qrData}
            size={moderateScale(250)}
            backgroundColor="#fff"
            color="#000"
          />
        </ViewShot>

        <CText type="B16" align="center" marginTop={20}>
          {String.qrRecoveryDescription}
        </CText>
      </KeyBoardAvoidWrapper>

      <View style={styles.ph20}>
        <CAlert status="warning" message={String.qrRecoveryWarning} />
        <CButton
          title={saving ? 'Guardando...' : String.qrRecoveryButton}
          onPress={saveQr}
          disabled={saving}
          frontIcon={
            saving ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <Icono name="download-outline" size={20} color="#fff" />
            )
          }
          containerStyle={{marginVertical: 20}}
        />
      </View>
    </CSafeAreaView>
  );
}

/* estilos */
const local = StyleSheet.create({
  qrBox: {
    ...styles.center,
    marginTop: 50,
    marginBottom: 10,
    height: getHeight(300),
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
});

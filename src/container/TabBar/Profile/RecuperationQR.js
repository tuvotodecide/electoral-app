// src/container/TabBar/Recovery/RecuperationQR.js
import React, { useEffect, useRef, useState } from 'react';
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

import ViewShot, { captureRef } from 'react-native-view-shot';
import QRCodeSVG                    from 'react-native-qrcode-svg';
import RNFS                         from 'react-native-fs';
import { check, request, RESULTS, openSettings } from 'react-native-permissions';
import { CameraRoll }               from '@react-native-camera-roll/camera-roll';
import pako                         from 'pako';
import { Buffer }                   from 'buffer';

import { getSecrets }               from '../../../utils/Cifrate';
import { getBioFlag }               from '../../../utils/BioFlag';

import CSafeAreaView                from '../../../components/common/CSafeAreaView';
import CHeader                      from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper         from '../../../components/common/KeyBoardAvoidWrapper';
import CText                        from '../../../components/common/CText';
import CAlert                       from '../../../components/common/CAlert';
import CButton                      from '../../../components/common/CButton';
import Icono                        from '../../../components/common/Icono';
import String                       from '../../../i18n/String';
import { styles }                   from '../../../themes';
import { getHeight, moderateScale } from '../../../common/constants';

/* ───────────────── helpers ────────────────── */
const compress = obj =>
  Buffer.from(pako.deflate(JSON.stringify(obj))).toString('base64');

/* permisos: sólo lectura */
const requestGalleryPermission = async () => {
  if (Platform.OS !== 'android') return true;

  const perm =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const status = await check(perm);
  if (status === RESULTS.GRANTED) return true;

  const res = await request(perm);
  if (res === RESULTS.GRANTED) return true;

  if (res === RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Permiso denegado',
      'Actívalo manualmente en Ajustes > Permisos',
      [{ text: 'Abrir ajustes', onPress: openSettings }, { text: 'OK' }],
    );
  }
  return false;
};

/* guarda en caché + MediaStore (funciona en todos los Android) */
const saveToGallery = async (base64Data, fileName = `QR_${Date.now()}.png`) => {
  const tmpPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

  // ① escribimos el PNG en una carpeta de la app (sin permisos especiales)
  await RNFS.writeFile(tmpPath, base64Data, 'base64');

  // ② lo publicamos en la Galería (CameraRoll → MediaStore)
  await CameraRoll.save(`file://${tmpPath}`, { type: 'photo' });

  // ③ opcional: limpiar el archivo temporal
  try { await RNFS.unlink(tmpPath); } catch (_) {}

  return true;
};
/* ──────────────────────────────────────────── */

export default function RecuperationQR() {
  const [qrData,  setQrData]  = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const viewShotRef           = useRef(null);

  /* cargar secrets y generar payload comprimido */
  useEffect(() => {
    (async () => {
      try {
        const { payloadQr } = await getSecrets();
        if (!payloadQr) throw new Error('No se encontró la identidad');

        const bioEnabled = await getBioFlag();
        setQrData(compress({ ...payloadQr, bioEnabled }));
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* guardar PNG */
  const saveQr = async () => {
    if (!viewShotRef.current) return Alert.alert('QR', 'El código aún no está listo');
    if (saving) return;

    setSaving(true);
    try {
      if (!(await requestGalleryPermission())) return setSaving(false);

      const b64 = await captureRef(viewShotRef, {
        format : 'png',
        quality: 1,
        result : 'base64',
      });

      await saveToGallery(b64);
      ToastAndroid.show('QR guardado en la galería', ToastAndroid.LONG);
      Alert.alert('¡Listo!', 'El QR se guardó correctamente.');
    } catch (err) {
      Alert.alert(
        'Error',
        'No se pudo guardar el QR. Comprueba los permisos de almacenamiento.',
        [{ text: 'OK' }, { text: 'Ajustes', onPress: openSettings }],
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI --------------- */
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
          options={{ format: 'png', quality: 1 }}>
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
          title={saving ? 'Guardando…' : String.qrRecoveryButton}
          onPress={saveQr}
          disabled={saving}
          frontIcon={
            saving
              ? <ActivityIndicator size={20} color="#fff" />
              : <Icono name="download-outline" size={20} color="#fff" />
          }
          containerStyle={{ marginVertical: 20 }}
        />
      </View>
    </CSafeAreaView>
  );
}

/* estilos */
const local = StyleSheet.create({
  qrBox:{
    ...styles.center,
    marginTop:50,
    marginBottom:10,
    height:getHeight(300),
    width:'100%',
    backgroundColor:'#fff',
    borderRadius:8,
  },
});

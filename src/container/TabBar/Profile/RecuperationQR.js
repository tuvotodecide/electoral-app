// src/container/TabBar/Recovery/RecuperationQR.js
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Alert,
  ToastAndroid,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';

import QRCodeSVG from 'react-native-qrcode-svg';
import {openSettings} from 'react-native-permissions';

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
import { useSelector } from 'react-redux';
import wira from 'wira-sdk';

const recoveryService = new wira.RecoveryService();

export default function RecuperationQR() {
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef(null);
  const userData = useSelector(state => state.wallet.payload);

  useEffect(() => {
    (async () => {
      try {
        if (!userData) throw new Error('No se encontró la identidad');

        const bioEnabled = await getBioFlag();
        setQrData(recoveryService.prepareQrData({...userData, bioEnabled}));
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveQr = async () => {
    if (!viewShotRef.current)
      return Alert.alert('QR', 'El código aún no está listo');
    if (saving) return;

    setSaving(true);
    try {
      const hasPermission = await recoveryService.requestGalleryPermission();
      if (!hasPermission) {
        setSaving(false);
        return;
      }

      const {savedOn, path, fileName} = await recoveryService.saveQr(viewShotRef);

      if(savedOn === 'gallery') {
        ToastAndroid.show('QR guardado en la galería', ToastAndroid.LONG);

        Alert.alert('QR guardado', 'El código QR se guardó exitosamente ', [
          { text: 'OK', style: 'default' },
        ]);
      } else if (savedOn === 'downloads') {
        ToastAndroid.show('QR guardado en Descargas', ToastAndroid.LONG);
        Alert.alert(
          'QR guardado',
          `No se pudo guardar en la galería, pero se guardó en Descargas.\n\nArchivo: ${fileName}`,
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Abrir descargas',
              onPress: () => {
                Linking.openURL(
                  'content://com.android.externalstorage.documents/root/primary:Download'
                ).catch(() => openSettings());
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'QR guardado',
          `Se guardó en el directorio de la app:\n${path}`,
          [{ text: 'OK' }]
        );
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
    <CSafeAreaView addTabPadding={false}>
      <CHeader title={String.qrRecoveryTitle} />

      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <wira.ViewShot
          ref={viewShotRef}
          style={local.qrBox}
          options={{format: 'png', quality: 1}}>
          <QRCodeSVG
            value={qrData}
            size={moderateScale(250)}
            backgroundColor="#fff"
            color="#000"
          />
        </wira.ViewShot>

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

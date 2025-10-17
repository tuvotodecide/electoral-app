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
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';
import {useSelector} from 'react-redux';
import wira from 'wira-sdk';
import ViewShot from 'react-native-view-shot';

const recoveryService = new wira.RecoveryService();

export default function RecuperationQR() {
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef(null);
  const {logAction} = useNavigationLogger('RecuperationQR', true);
  const userData = useSelector(state => state.wallet.payload);

  useEffect(() => {
    (async () => {
      try {
        if (!userData) {
          logAction('MissingUserData');
          throw new Error('No se encontró la identidad');
        }

        const bioEnabled = await getBioFlag();
        const prepared = recoveryService.prepareQrData({...userData, bioEnabled});
        setQrData(prepared);
        logAction('PrepareQrSuccess');
      } catch (err) {
        logAction('PrepareQrError', {message: err?.message});
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userData]);

  const initSaveQr = async () => {
    if (!viewShotRef.current)
      return Alert.alert('QR', 'El código aún no está listo');
    if (saving) return;

    setSaving(true);
    try {
      logAction('SaveQrAttempt');
      const hasPermission = await recoveryService.requestGalleryPermission();
      if (!hasPermission) {
        setSaving(false);
        logAction('SaveQrPermissionDenied');
        return;
      }

      const uri = await viewShotRef.current.capture();
      saveQr(uri);
    } catch (err) {
      logAction('InitSaveError', {message: err?.message});

      Alert.alert('Error', errorMessage, [
        {text: 'OK', style: 'default'},
        {text: 'Abrir configuración', onPress: () => openSettings()},
      ]);
    } 
  };

  const saveQr = async (dataUrl) => {
    try {
      const {savedOn, path, fileName} = await recoveryService.saveQrOnDevice(dataUrl);

      if(savedOn === 'gallery') {
        logAction('SaveQrGallery');
        ToastAndroid.show('QR guardado en la galería', ToastAndroid.LONG);

        Alert.alert('QR guardado', 'El código QR se guardó exitosamente ', [
          { text: 'OK', style: 'default' },
        ]);
      } else if (savedOn === 'downloads') {
        logAction('SaveQrDownloads');
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
        logAction('SaveQrAppDirectory');
        Alert.alert(
          'QR guardado',
          `Se guardó en el directorio de la app:\n${path}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logAction('SaveQrError', {message: err?.message});

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
  }

  if (loading) {
    return (
      <CSafeAreaView testID="recuperationQrLoadingContainer">
        <CHeader testID="recuperationQrLoadingHeader" title={String.qrRecoveryTitle} />
        <View testID="recuperationQrLoadingCenter" style={styles.center}>
          <ActivityIndicator testID="recuperationQrLoadingIndicator" size="large" />
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView testID="recuperationQrContainer" addTabPadding={false}>
      <CHeader testID="recuperationQrHeader" title={String.qrRecoveryTitle} />

      <KeyBoardAvoidWrapper testID="recuperationQrKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <ViewShot
          ref={viewShotRef}
          style={local.qrBox}
          options={{
            format: 'png',
            quality: 1.0,
            width: 1500,
            height: 1500,
            result: 'base64',
          }}
        >
          <QRCodeSVG
            testID="recuperationQrCode"
            value={qrData}
            size={moderateScale(290)}
            backgroundColor="#fff"
            color="#000"
            quietZone={10}
          />
        </ViewShot>

        <CText testID="recuperationQrDescription" type="B16" align="center" marginTop={20}>
          {String.qrRecoveryDescription}
        </CText>
      </KeyBoardAvoidWrapper>

      <View testID="recuperationQrFooter" style={styles.ph20}>
        <CAlert testID="recuperationQrWarning" status="warning" message={String.qrRecoveryWarning} />
        <CButton
          testID="recuperationQrSaveButton"
          title={saving ? 'Guardando…' : String.qrRecoveryButton}
          onPress={initSaveQr}
          disabled={saving}
          frontIcon={
            saving ? (
              <ActivityIndicator testID="recuperationQrSaveLoading" size={20} color="#fff" />
            ) : (
              <Icono testID="recuperationQrSaveIcon" name="download-outline" size={20} color="#fff" />
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

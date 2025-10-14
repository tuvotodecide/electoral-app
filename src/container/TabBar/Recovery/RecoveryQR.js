import React, {useState} from 'react';
import {
  View,
  Alert,
  Platform,
  ToastAndroid,
  StyleSheet,
} from 'react-native';
import CSafeAreaViewAuth from '../../../components/common/CSafeAreaViewAuth';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import UploadCardImage from '../../../components/common/UploadCardImage';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import {styles} from '../../../themes';
import String from '../../../i18n/String';
import {moderateScale} from '../../../common/constants';
import {AuthNav} from '../../../navigation/NavigationKey';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';
import wira from 'wira-sdk';
import { getLegacyData } from '../../../utils/migrateLegacy';
import CAlert from '../../../components/common/CAlert';
import {BACKEND_IDENTITY} from '@env';

const recoveryService = new wira.RecoveryService();

export default function RecoveryQr({navigation}) {
  const [imageUri, setImageUri] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const {logAction, logNavigation} = useNavigationLogger('RecoveryQR', true);
  // ⬇️ Este es el ÚNICO punto de entrada de imagen (galería o cámara)
  const onImageSelected = async (asset) => {
    setErrorMsg(null);
    if (!asset?.uri) {
      logAction('RecoveryQrImageMissing');
      Alert.alert('Imagen', 'No se pudo obtener la imagen seleccionada.');
      return;
    }

    setImageUri(asset.uri);
    setLoading(true);
    try {
      logAction('RecoveryQrParseAttempt');
      const start = Date.now();
      //console.log('[RecoveryQR] recoveryFromQr start', { uri: asset.uri });
      const dataFromQr = await recoveryService.recoveryFromQr(asset.uri);
      //console.log('[RecoveryQR] recoveryFromQr success', { duration, preview });

      let newPayload = {
        data: dataFromQr,
      };

      if(!dataFromQr.vc) {
        if(dataFromQr.streamId && dataFromQr.privKey) {
          newPayload.legacyData = await getLegacyData(dataFromQr);
          const api = new wira.RegistryApi(BACKEND_IDENTITY);
          const {exists} = await api.registryCheckByDni(dataFromQr.dni);
          if(exists) {
            setErrorMsg(String.alreadyMigrated);
            return;
          }
        } else {
          setErrorMsg(String.notEnoughLegacyData);
          return;
        }
      }

      setPayload(newPayload);
      logAction('RecoveryQrParseSuccess');
      if (Platform.OS === 'android') {
        ToastAndroid.show('QR válido', ToastAndroid.SHORT);
      }
    } catch (err) {
      // Detailed error logging for connection / SDK errors
      const url = err?.config?.url || err?.apiDebug?.url || err?.apiDebug?.requestUrl || err?.request?.uri || null;
      const status = err?.response?.status ?? null;
      console.error('[RecoveryQR] recoveryFromQr error', {
        message: err?.message,
        code: err?.code ?? null,
        url,
        status,
        responseData: err?.response?.data ?? null,
        apiDebug: err?.apiDebug ?? null,
        stack: err?.stack ?? null,
      });
      logAction('RecoveryQrParseError', {
        message: err?.message,
        code: err?.code ?? null,
        url,
        status,
      });
      setPayload(null);
      setImageUri(null);
      Alert.alert('QR inválido', err?.message || 'No se pudo leer el QR.');
    } finally {
      setLoading(false);
    }
  };

  const goSetPin = () => {
    if (!payload) {
      logAction('RecoveryQrContinueWithoutPayload');
      return;
    }
    logNavigation(AuthNav.RecoveryUserQrpin, {payload: true});
    navigation.navigate(AuthNav.RecoveryUserQrpin, { payload });
  };

  return (
    <CSafeAreaViewAuth testID="recoveryQrContainer">
      <CHeader testID="recoveryQrHeader" />
      <KeyBoardAvoidWrapper testID="recoveryQrKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View testID="recoveryQrMainContent" style={local.main}>
          <CText testID="recoveryQrTitle" type="B20" align="center" style={styles.boldText}>
            {String.RecoverywithQR}
          </CText>
          <CText testID="recoveryQrSubtitle" type="B16" align="center">
            {String.recoveryQrSubtitle}
          </CText>

          <UploadCardImage
            testID="recoveryQrUploadImage"
            label={String.qrimagelabel}
            image={imageUri ? { uri: imageUri } : null}
            setImage={onImageSelected}
            loading={loading}
          />
          {payload?.legacyData && <CAlert message={String.legacyDataFound} testID="recoveryQrLegacyDataAlert" />}
          {errorMsg && <CAlert status='error' message={errorMsg} testID="recoveryQrLegacyDataError" />}

          {payload && (
            <CText testID="recoveryQrValidMessage" type="R14" align="center" style={{marginTop: 10}}>
              {String.qrValid}
            </CText>
          )}
        </View>
      </KeyBoardAvoidWrapper>

      <View testID="recoveryQrFooter" style={local.footer}>
        <CButton
          testID="recoveryQrContinueButton"
          title={String.continueButton}
          onPress={goSetPin}
          disabled={!payload || loading}
        />
      </View>
    </CSafeAreaViewAuth>
  );
}

const local = StyleSheet.create({
  main: {...styles.ph20, gap: moderateScale(8)},
  footer: {...styles.ph20, marginBottom: moderateScale(20)},
});

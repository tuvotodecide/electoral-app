import React, {useState} from 'react';
import {
  View,
  Alert,
  Platform,
  ToastAndroid,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import CSafeAreaViewAuth from '../../../components/common/CSafeAreaViewAuth';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import {styles} from '../../../themes';
import String from '../../../i18n/String';
import {moderateScale} from '../../../common/constants';
import {AuthNav} from '../../../navigation/NavigationKey';

import wira from 'wira-sdk';
import { getLegacyData } from '../../../utils/migrateLegacy';
import CAlert from '../../../components/common/CAlert';
import {BACKEND_IDENTITY} from '@env';

const recoveryService = new wira.RecoveryService();

export default function RecoveryQr({navigation}) {
  const [selectFileLabel, setSelectFileLabel] = useState(String.selectFile);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const onUploadPress = async () => {
    setErrorMsg(null);
    setPayload(null);
    setLoading(true);
    
    try {
      const recoveredData = await recoveryService.recoveryFromBackup();
      let newPayload = {
        data: recoveredData,
      };

      if(!recoveredData.identity) {
        if(recoveredData.streamId && recoveredData.privKey) {
          newPayload.legacyData = await getLegacyData(recoveredData);
          const api = new wira.RegistryApi(BACKEND_IDENTITY);
          const {exists} = await api.registryCheckByDni(recoveredData.dni);
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
      setSelectFileLabel(String.processingSuccess);
      if (Platform.OS === 'android') {
        ToastAndroid.show(String.processingSuccess, ToastAndroid.SHORT);
      }
    } catch (err) {
      if (err.message.includes('user canceled')) {
        return;
      }

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
      setPayload(null);
      setSelectFileLabel(String.selectFile);
      Alert.alert(String.selectFileError, err.message);
    } finally {
      setLoading(false);
    }
  };

  const goSetPin = () => {
    if (!payload) {
      return;
    }
    navigation.navigate(AuthNav.RecoveryUserQrpin, { payload });
  };

  return (
    <CSafeAreaViewAuth testID="recoveryFileContainer">
      <CHeader testID="recoveryFileHeader" />
      <KeyBoardAvoidWrapper testID="recoveryFileKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View testID="recoveryFileMainContent" style={local.main}>
          <CText testID="recoveryFileTitle" type="B20" align="center" style={styles.boldText}>
            {String.recoverywithFile}
          </CText>
          <CText testID="recoveryFileSubtitle" type="B16" align="center">
            {String.recoveryFileSubtitle}
          </CText>

          <TouchableOpacity
            testID="recoveryFileUploadCard"
            style={[local.uploadCard, loading && local.uploadCardDisabled]}
            onPress={onUploadPress}
            disabled={loading}
            activeOpacity={0.8}
          >
            <CText type="R14" align="center" style={styles.boldText}>
              {selectFileLabel}
            </CText>
            {loading && (
              <ActivityIndicator
                size="small"
                color={styles.primary?.color || '#000'}
                style={local.uploadSpinner}
              />
            )}
          </TouchableOpacity>
          {payload?.legacyData && <CAlert message={String.legacyDataFound} testID="recoveryFileLegacyDataAlert" />}
          {errorMsg && <CAlert status='error' message={errorMsg} testID="recoveryFileLegacyDataError" />}
        </View>
      </KeyBoardAvoidWrapper>

      <View testID="recoveryFileFooter" style={local.footer}>
        <CButton
          testID="recoveryFileContinueButton"
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
  uploadCard: {
    borderWidth: 1,
    marginVertical: moderateScale(20),
    borderColor: '#d1d5db',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  uploadCardDisabled: {
    opacity: 0.6,
  },
  uploadSpinner: {
    marginTop: moderateScale(8),
  },
  footer: {...styles.ph20, marginBottom: moderateScale(20)},
});

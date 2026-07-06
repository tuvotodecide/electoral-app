import React, {useState} from 'react';
import {
  View,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';

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
import CAlert from '../../../components/common/CAlert';
import { useSelector } from 'react-redux';
import typography from '@/src/themes/typography';
import { captureError } from '../../../config/sentry';

const recoveryService = new wira.RecoveryService();

export default function RecoveryQr({navigation}) {
  const [selectFileLabel, setSelectFileLabel] = useState(String.selectFile);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pin, setPin] = useState(null);

  const colors = useSelector(state => state.theme.theme);

  const onUploadPress = async () => {
    setErrorMsg(null);
    setPayload(null);
    setLoading(true);
    
    try {
      const recoveredData = await recoveryService.recoveryFromBackup(pin);
      let newPayload = {
        data: recoveredData,
      };

      setPayload(newPayload);
      setSelectFileLabel(String.processingSuccess);
    } catch (err) {
      if (err.message.includes('user canceled')) {
        return;
      }

      let errorMessage = String.backupSaveError;
      let openSettings = false;
      if (err.message.includes('Storage permission not granted')) {
        errorMessage = String.permissionDeniedMessage;
        openSettings = true;
      } else if (err.message.includes('Faltan campos')) {
        errorMessage = String.badDirectoryMessage;
      } else if (err.message.includes('Invalid PIN')) {
        errorMessage = String.incorrectPinError;
      } else {
        captureError(err, {
          flow: 'RecoveryQR',
          step: 'onUploadPress',
          critical: true,
        });
      }

      const buttons = [
        {text: 'OK', style: 'default'},
      ];

      if (openSettings) {
        buttons.push({text: String.openSettings, onPress: () => openSettings()});
      }

      setPayload(null);
      setSelectFileLabel(String.selectFile);
      Alert.alert(String.selectFileError, errorMessage, buttons);
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

  const onCodeFilled = (code) => {
    if (code.length === 4) {
      setPin(code);
    } else {
      setPin(null);
    }
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

          <CText testID="recuperationFileDescription" type="B16" align="center" marginTop={20}>
            {String.enterPin}
          </CText>
          <OTPTextInput
            testID="textInput"
            inputCount={4}
            containerStyle={local.otpInputViewStyle}
            keyboardType="number-pad"
            handleTextChange={onCodeFilled}
            secureTextEntry={true}
            editable
            keyboardAppearance={'dark'}
            placeholderTextColor={colors.textColor}
            autoFocus={false}
            textInputStyle={[
              local.underlineStyleBase,
              {
                backgroundColor: colors.inputBackground,
                color: colors.textColor,
                borderColor: colors.grayScale500,
              },
            ]}
            tintColor={colors.primary}
            offTintColor={colors.grayScale500}
          />

          <TouchableOpacity
            testID="recoveryFileUploadCard"
            style={[local.uploadCard, (!pin || loading) && local.uploadCardDisabled]}
            onPress={onUploadPress}
            disabled={!pin || loading}
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
  otpInputViewStyle: {
    ...styles.selfCenter,
    height: '20%',
    ...styles.mt10,
  },
  underlineStyleBase: {
    width: moderateScale(50),
    height: moderateScale(55),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    ...styles.mh5,
  },
});

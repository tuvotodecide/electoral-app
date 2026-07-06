// src/container/TabBar/Recovery/RecuperationQR.js
import React, {useState} from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';

import {openSettings} from 'expo-linking';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../components/common/CText';
import CAlert from '../../../components/common/CAlert';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import String from '../../../i18n/String';
import {styles} from '../../../themes';

import {useSelector} from 'react-redux';
import wira from 'wira-sdk';
import { useBackupCheck } from '@/src/hooks/useBackupCheck';
import { StackNav } from '@/src/navigation/NavigationKey';
import { moderateScale } from '@/src/common/constants';
import typography from '@/src/themes/typography';

import { captureError } from '../../../config/sentry';
const recoveryService = new wira.RecoveryService();

export default function RecuperationQR({ navigation }) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pin, setPin] = useState(null);
  const colors = useSelector(state => state.theme.theme);
  const { checkBackupAsStored } = useBackupCheck()

  const initSaveQr = async () => {
    if (saving) return;
    if (saveSuccess) {
      navigation.reset({ index: 0, routes: [{ name: StackNav.TabNavigation }] });
      return;
    }

    setSaving(true);
    try {
      await saveData();
      await checkBackupAsStored();
    } catch (error) {
      captureError(error, {
        flow: 'RecuperationQR',
        step: 'initSaveQr',
        critical: true,
      });
      Alert.alert('Error', error.message, [
        {text: 'OK', style: 'default'},
        {text: 'Abrir configuración', onPress: () => openSettings()},
      ]);
    } 
  };

  const saveData = async () => {
    try {
      await recoveryService.backupDataOnDevice(pin);

      setSaveSuccess(true);
      Alert.alert(
        String.backed,
        String.backedOnSelectedDir,
        [{ text: 'OK' }]
      );
    } catch (error) {
      if (error.message.includes('Export canceled')) {
        setSaving(false);
        return;
      }
      let errorMessage = String.backupSaveError;
      let openSettings = false;
      if (error.message.includes('Storage permission not granted')) {
        errorMessage = String.permissionDeniedMessage;
        openSettings = true;
      } else if (error.message.includes('ENOENT')) {
        errorMessage = String.badDirectoryMessage;
      } else if (error.message.includes('Invalid PIN')) {
        errorMessage = String.incorrectPinError;
      } else {
        captureError(error, {
          flow: 'RecuperationQR',
          step: 'saveData',
          critical: true,
        });
      }

      const buttons = [
        {text: 'OK', style: 'default'},
      ];

      if (openSettings) {
        buttons.push({text: String.openSettings, onPress: () => openSettings()});
      }

      Alert.alert('Error', errorMessage, buttons);
    } finally {
      setSaving(false);
    }
  }

  const onCodeFilled = (code) => {
    if (code.length === 4) {
      setPin(code);
    } else {
      setPin(null);
    }
  };

  return (
    <CSafeAreaView testID="recuperationFileContainer" addTabPadding={false}>
      <CHeader testID="recuperationFileHeader" title={String.dataBackup} />

      <KeyBoardAvoidWrapper testID="recuperationFileKeyboardWrapper" contentContainerStyle={styles.ph20}>
        <View style={{ backgroundColor: colors.stepBackgroundColor, ...local.backupBox }}>
          <Icono testID="recuperationFileBackupIcon" name="card-account-details-outline" size={80} color={colors.primary} />
          <CText testID="recuperationFileDescription" type="B16" align="center" marginTop={20}>
            {String.backupFileDescription}
          </CText>
        </View>

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
        <CAlert testID="recuperationFileWarning" message={String.enterPinInfo} />
      </KeyBoardAvoidWrapper>

      <View testID="recuperationFileFooter" style={styles.ph20}>
        <CAlert testID="recuperationFileWarning" status="warning" message={String.backupFileWarning} />
        <CButton
          testID="recuperationFileSaveButton"
          title={pin === null ? String.enterPin : saving ? String.downloadingBackup : saveSuccess ? String.backupFileSuccess : String.downloadBackup}
          onPress={initSaveQr}
          disabled={pin === null || saving}
          variant={saveSuccess ? 'outlined' : 'default'}
          frontIcon={
            saving ? (
              <ActivityIndicator testID="recuperationFileSaveLoading" size={20} color="#fff" />
            ) : (
              <Icono
                testID="recuperationFileSaveIcon"
                name={saveSuccess ? "check-circle-outline" : "download-outline"}
                size={20}
                color={saveSuccess ? colors.primary : "#fff"}
              />
            )
          }
          containerStyle={{marginVertical: 20}}
        />
      </View>
    </CSafeAreaView>
  );
}

const local = StyleSheet.create({
  backupBox: {
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center'
  },
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

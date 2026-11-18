import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// custom import

import {
  IdentityApiUnreachableError,
  RegistryProfileError,
  VaultError,
} from '@privado-id/expo-sdk';
import { getPrivadoClient } from '../../../services/privado/privadoSession';
import { clearRegistryBackupPending } from '../../../services/privado/registryBackupSync';
import { moderateScale } from '../../../common/constants';
import CButton from '../../../components/common/CButton';
import CHeader from '../../../components/common/CHeader';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import LoadingModal from '../../../components/modal/LoadingModal';
import String from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';
import { styles } from '../../../themes';
import typography from '../../../themes/typography';
import { getSecondaryTextColor } from '../../../utils/ThemeUtils';


import { captureError } from '../../../config/sentry';

/**
 * Mensaje para un cambio de PIN fallido. En todos estos casos el PIN no cambió:
 * `client.changePin` sube primero el respaldo cifrado con el PIN nuevo al
 * registro y solo después cambia el PIN del vault.
 */
const describeChangePinError = err => {
  if (err instanceof IdentityApiUnreachableError) {
    return {message: `${String.networkError} Tu PIN no cambió.`, expected: true};
  }
  if (err instanceof VaultError && err.code === 'INVALID_PIN') {
    return {
      message: 'El PIN actual no es correcto. Vuelve a empezar el cambio de PIN.',
      expected: true,
    };
  }
  if (err instanceof VaultError && err.code === 'PIN_TOO_SHORT') {
    return {message: 'El PIN nuevo es demasiado corto.', expected: true};
  }
  if (err instanceof RegistryProfileError && err.code === 'not-found') {
    return {
      message:
        'No encontramos el registro de tu cuenta para guardar el respaldo con el PIN nuevo. Tu PIN no cambió.',
      expected: false,
    };
  }
  return {
    message: 'No se pudo cambiar tu PIN. Inténtalo de nuevo más tarde.',
    expected: false,
  };
};

export default function ChangePinNewConfirm({navigation, route}) {
  const {oldPin, newPin} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const [modal, setModal] = useState({
    visible: false,
    message: '',
    isLoading: false,
    success: false,
  });
  const [otp, setOtp] = useState('');
  const onOtpChange = text => setOtp(text);
  const finish = async () => {
    if (otp !== newPin) {
      return setModal({
        ...modal,
        visible: true,
        message: 'Los PIN no coinciden',
      });
    }
    try {
      setModal({
        ...modal,
        visible: true,
        message: String.waitForPinUpdate,
        isLoading: true,
      });
      // Delay to allow modal to render
      await new Promise(resolve => setTimeout(resolve, 100));
      // Sube el respaldo con el PIN nuevo a /registry/profile y luego cambia
      // el PIN del vault (la recuperación con carnet pedirá el PIN nuevo).
      const client = await getPrivadoClient();
      await client.changePin({currentPin: oldPin, newPin});
      // changePin subió un respaldo completo: no queda nada pendiente.
      await clearRegistryBackupPending();
      setModal({
        visible: true,
        message: 'Tu PIN ha sido actualizado correctamente',
        success: true,
        isLoading: false,
      });
    } catch (err) {
      const {message, expected} = describeChangePinError(err);
      if (!expected) {
        captureError(err, {
          flow: 'ChangePinNewConfirm',
          step: 'finish',
          critical: true,
          code: err?.code,
        });
      }
      setModal({visible: true, message, isLoading: false, success: false});
    }
  };

  const closeModal = () => {
    if (modal.success) {
      navigation.reset({index: 0, routes: [{name: StackNav.TabNavigation}]});
    }
    setModal({visible: false, message: '', success: false, isLoading: false});
  };


  return (
    <CSafeAreaView testID="changePinNewConfirmContainer">
      <CHeader testID="changePinNewConfirmHeader" />
      <KeyBoardAvoidWrapper testID="changePinNewConfirmKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View testID="changePinNewConfirmMainContainer" style={localStyle.mainContainer}>
          <View testID="changePinNewConfirmContentContainer">
            <CText
              testID="changePinNewConfirmTitle"
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.pinConfirmAccessTitle}
            </CText>
            <CText
              testID="changePinNewConfirmSubtitle"
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.pinAccessDescription1}
            </CText>
            <OTPTextInput
              testID="textInput"
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              handleTextChange={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocus={true}
              textInputStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              tintColor={colors.primary}
            />
          </View>
          <View testID="changePinNewConfirmButtonContainer">
            <CButton
              testID="changePinNewConfirmFinishButton"
              disabled={otp.length !== 4}
              title={String.btnContinue}
              type={'B16'}
              onPress={finish}
            />
          </View>
        </View>
      </KeyBoardAvoidWrapper>
      <LoadingModal
        testID="changePinNewConfirmResultModal"
        {...modal}
        buttonText={String.ok}
        onClose={closeModal}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  headerTextStyle: {
    ...styles.mt10,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyBetween,
    ...styles.flex,
  },
  otpInputViewStyle: {
    ...styles.selfCenter,
    height: '20%',
    ...styles.mt30,
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

  resendButton: {
    ...styles.mb20,
    ...styles.mt0,
  },
  diffPhoneNumberText: {
    ...styles.mt15,
  },
});

import {StyleSheet, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../components/common/CText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import typography from '../../../themes/typography';
import CButton from '../../../components/common/CButton';
import {AuthNav, StackNav} from '../../../navigation/NavigationKey';
import StepIndicator from '../../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import String from '../../../i18n/String';
import {changePin} from '../../../utils/changePin';
import InfoModal from '../../../components/modal/InfoModal';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';

export default function ChangePinNewConfirm({navigation, route}) {
  const {oldPin, newPin} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const [modal, setModal] = useState({visible: false, msg: '', title: ''});
  const [otp, setOtp] = useState('');

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('ChangePinNewConfirm', true);
  const onOtpChange = text => setOtp(text);
  const otpRef = useRef(null);
  const finish = async () => {
    if (otp !== newPin) {
      return setModal({
        visible: true,
        msg: 'Los PIN no coinciden',
        title: 'Error',
      });
    }
    try {
      await changePin(oldPin, newPin);
      setModal({
        visible: true,
        title: 'Éxito',
        msg: 'Tu PIN ha sido actualizado correctamente',
      });
    } catch (err) {
      setModal({visible: true, title: 'Error', msg: err.message});
    }
  };

  const closeModal = () => {
    if (modal.title === 'Éxito') {
      navigation.reset({index: 0, routes: [{name: StackNav.TabNavigation}]});
    }
    setModal({visible: false, msg: '', title: ''});
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      otpRef.current?.focusField(0);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

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
            <OTPInputView
              testID="changePinNewConfirmOtpInput"
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocusOnLoad={true}
              codeInputFieldStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              codeInputHighlightStyle={{borderColor: colors.primary}}
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
      <InfoModal
        testID="changePinNewConfirmResultModal"
        visible={modal.visible}
        title={modal.title}
        message={modal.msg}
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
    height: moderateScale(50),
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

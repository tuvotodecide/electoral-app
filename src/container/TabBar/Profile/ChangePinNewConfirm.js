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
import {StackNav} from '../../../navigation/NavigationKey';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import String from '../../../i18n/String';
import wira from 'wira-sdk';
import {BACKEND_IDENTITY} from '@env';
import LoadingModal from '../../../components/modal/LoadingModal';


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
  const otpRef = useRef(null);
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
      await wira.updatePin(BACKEND_IDENTITY, oldPin, newPin);
      setModal({
        visible: true,
        message: 'Tu PIN ha sido actualizado correctamente',
        success: true,
        isLoading: false,
      });
    } catch (err) {
      setModal({visible: true, message: err.message, isLoading: false, success: false});
    }
  };

  const closeModal = () => {
    if (modal.success) {
      navigation.reset({index: 0, routes: [{name: StackNav.TabNavigation}]});
    }
    setModal({visible: false, message: '', success: false, isLoading: false});
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
              testID="textInput"
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

import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// custom import
import wira from 'wira-sdk';
import { moderateScale } from '../../../common/constants';
import CHeader from '../../../components/common/CHeader';
import CLoaderOverlay from '../../../components/common/CLoaderOverlay';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import InfoModal from '../../../components/modal/InfoModal';
import String from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';
import { styles } from '../../../themes';
import typography from '../../../themes/typography';
import { getSecondaryTextColor } from '../../../utils/ThemeUtils';


export default function ChangePinVerify({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [verifying, setVerifying] = useState(false);
  const [modal, setModal] = useState({visible: false, msg: ''});
  const otpRef = useRef(null);

  const handleFilled = async (code) => {
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    verify(code);
  }

  const verify = async code => {
    if (code.length !== 4) return;
    try {
      if (!(await wira.checkPin(code))) {
        otpRef.current?.clear();
        return setModal({
          visible: true,
          msg: 'PIN actual incorrecto',
        });
      }
    } catch (error) {
      otpRef.current?.clear();
      setModal({
        visible: true,
        msg: 'Error al verificar el PIN: ' + error.message,
      });
      return;
    } finally {
      setVerifying(false);
    }
    
    navigation.replace(StackNav.ChangePinNew, {oldPin: code});
  };

  return (
    <CSafeAreaView testID="changePinVerifyContainer">
      <CHeader testID="changePinVerifyHeader" />
      <KeyBoardAvoidWrapper testID="changePinVerifyKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View testID="changePinVerifyMainContainer" style={localStyle.mainContainer}>
          <View testID="changePinVerifyContentContainer">
            <CText
              testID="changePinVerifyTitle"
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.pinChangeAccessTitle}
            </CText>
            <CText
              testID="changePinVerifySubtitle"
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.pinChange}
            </CText>
            <OTPTextInput
              testID="textInput"
              ref={otpRef}
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              handleTextChange={code => {
                if (code.length === 4) {
                  handleFilled(code);
                }
              }}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocus
              textInputStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              tintColor={colors.primary}
              offTintColor={colors.grayScale500}
            />
          </View>
          <View testID="changePinVerifySpacerContainer"></View>
        </View>
      </KeyBoardAvoidWrapper>
      {verifying ? <CLoaderOverlay message={String.verifyingPin} /> : null}
      <InfoModal
        testID="changePinVerifyErrorModal"
        visible={modal.visible}
        title="Error"
        message={modal.msg}
        onClose={() => setModal({visible: false, msg: ''})}
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

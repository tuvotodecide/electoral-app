import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// Custom imports
import { moderateScale } from '../../../common/constants';
import CButton from '../../../components/common/CButton';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import { styles } from '../../../themes';
import typography from '../../../themes/typography';
import { getSecondaryTextColor } from '../../../utils/ThemeUtils';

export default function VotingPinModal({ visible, loading, error, onCancel, onSubmit }) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');

  const onOtpChange = text => {
    setOtp(text);
  };

  const handleCancel = () => {
    setOtp('');
    onCancel();
  };

  const handleContinue = () => {
    onSubmit(otp);
  };

  return (
    <Modal
      testID="votingPinModal"
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <View style={localStyle.overlay}>
        <View style={[localStyle.modalContainer, { backgroundColor: colors.stepBackgroundColor }]}>
          <CText
            testID="votingPinModalTitle"
            type={'B20'}
            align={'center'}>
            {String.enterPin}
          </CText>
          <CText
            testID="votingPinModalDescription"
            type={'R14'}
            color={getSecondaryTextColor(colors)}
            align={'center'}
            style={localStyle.descriptionStyle}>
            {String.enterPinVoteDescription}
          </CText>
          <OTPTextInput
            testID="votingPinModalInput"
            inputCount={4}
            containerStyle={localStyle.otpInputViewStyle}
            handleTextChange={onOtpChange}
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
          />
          {!!error && (
            <CText
              testID="votingPinModalError"
              type={'R14'}
              color={colors.rejectedColor}
              align={'center'}
              style={localStyle.errorStyle}>
              {error}
            </CText>
          )}
          <CButton
            testID="votingPinModalContinueButton"
            disabled={otp.length !== 4 || loading}
            title={loading ? String.verifyingPin : String.btnContinue}
            type={'B16'}
            onPress={handleContinue}
          />
          <CButton
            testID="votingPinModalCancelButton"
            variant={'outlined'}
            disabled={loading}
            title={String.cancel}
            type={'B16'}
            sinMargen
            onPress={handleCancel}
          />
        </View>
      </View>
    </Modal>
  );
}

const localStyle = StyleSheet.create({
  overlay: {
    ...styles.flex,
    ...styles.center,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...styles.ph20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: moderateScale(16),
    ...styles.ph20,
    ...styles.pv20,
  },
  descriptionStyle: {
    ...styles.mt10,
  },
  otpInputViewStyle: {
    ...styles.selfCenter,
    height: moderateScale(70),
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
  errorStyle: {
    ...styles.mt15,
  },
});

import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';

// custom import
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../themes';
import CSafeAreaView from '../../components/common/CSafeAreaView';
import CHeader from '../../components/common/CHeader';
import CText from '../../components/common/CText';
import {moderateScale} from '../../common/constants';
import String from '../../i18n/String';
import {validPassword, validateConfirmPassword} from '../../utils/Validation';
import CInput from '../../components/common/CInput';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';

export default function CreateNewPassword({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordInputStyle, setPasswordInputStyle] = useState({});
  const [confirmPasswordInputStyle, setConfirmPasswordInputStyle] = useState(
    {},
  );

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const onFocusPassword = () => {
    onFocusInput(setPasswordInputStyle);
  };
  const onBlurPassword = () => {
    onBlurInput(setPasswordInputStyle);
  };
  const BlurredStyle = {
    borderColor: colors.inputBackground,
  };
  const FocusedStyle = {
    borderColor: colors.primary,
  };

  const onChangedConfirmPassword = val => {
    const {msg} = validateConfirmPassword(val.trim(), password);
    setConfirmPassword(val.trim());
    setConfirmPasswordError(msg);
  };

  const onChangedPassword = val => {
    const {msg} = validPassword(val.trim());
    setPassword(val.trim());
    setPasswordError(msg);
  };
  const onFocusConfirmPassword = () => {
    onFocusInput(setConfirmPasswordInputStyle);
  };
  const onBlurConfirmPassword = () => {
    onBlurInput(setConfirmPasswordInputStyle);
  };
  const onPressResetPassword = () => {
    navigation.navigate(AuthNav.SuccessfulPassword);
  };
  return (
    <CSafeAreaView>
      <CHeader />
      <KeyBoardAvoidWrapper
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(25)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText type={'B24'}>{String.createNewPassword}</CText>
          <CText type={'R14'} color={colors.grayScale500}>
            {String.newPasswordDescription}
          </CText>
          <CInput
            placeholder={String.password}
            _value={password}
            _errorText={passwordError}
            maxLength={30}
            keyBoardType={'default'}
            autoCapitalize={'none'}
            toGetTextFieldValue={onChangedPassword}
            isSecure
            inputContainerStyle={passwordInputStyle}
            _onFocus={onFocusPassword}
            onBlur={onBlurPassword}
          />
          <CInput
            placeholder={String.confirmPassword}
            _value={confirmPassword}
            _errorText={confirmPasswordError}
            maxLength={30}
            keyBoardType={'default'}
            autoCapitalize={'none'}
            toGetTextFieldValue={onChangedConfirmPassword}
            isSecure
            inputContainerStyle={confirmPasswordInputStyle}
            _onFocus={onFocusConfirmPassword}
            onBlur={onBlurConfirmPassword}
          />
        </View>
        <CButton
          title={String.resetPassword}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          onPress={onPressResetPassword}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  btnStyle: {
    ...styles.selfCenter,
    width: '90%',
  },
});

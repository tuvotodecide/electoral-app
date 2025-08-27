import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo, useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import {validName, validPassword, validateEmail} from '../../utils/Validation';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import {styles} from '../../themes';
import CInput from '../../components/common/CInput';
import CButton from '../../components/common/CButton';
import {socialIcon} from '../../api/constant';
import {AuthNav} from '../../navigation/NavigationKey';

export default function SignUp({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailInputStyle, setEmailInputStyle] = useState(BlurredStyle);
  const [passwordInputStyle, setPasswordInputStyle] = useState(BlurredStyle);
  const [nameInputStyle, setNameInputStyle] = useState(BlurredStyle);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const BlurredStyle = {
    borderColor: colors.inputBackground,
  };
  const FocusedStyle = {
    borderColor: colors.primary,
  };
  const onFocusEmail = () => {
    onFocusInput(setEmailInputStyle);
  };
  const onBlurEmail = () => {
    onBlurInput(setEmailInputStyle);
  };
  const onFocusPassword = () => {
    onFocusInput(setPasswordInputStyle);
  };
  const onBlurPassword = () => {
    onBlurInput(setPasswordInputStyle);
  };
  const onFocusName = () => {
    onFocusInput(setNameInputStyle);
  };
  const onBlurName = () => {
    onBlurInput(setNameInputStyle);
  };
  const onChangeName = text => {
    const {msg} = validName(text);
    setName(text);
    setNameError(msg);
    return false;
  };
  const onChangedEmail = val => {
    const {msg} = validateEmail(val.trim());
    setEmail(val.trim());
    setEmailError(msg);
  };

  const onChangedPassword = val => {
    const {msg} = validPassword(val.trim());
    setPassword(val.trim());
    setPasswordError(msg);
  };
  const onPressRememberMe = () => {
    setRememberMe(!rememberMe);
  };
  const onPressSignUp = () => {
    navigation.navigate(AuthNav.SignUpWithMobileNumber);
  };
  const onPressSignIn = () => {
    navigation.navigate(AuthNav.Login);
  };
  const RenderSocialBtn = memo(({item}) => {
    return (
      <TouchableOpacity
        testID={`signUpSocialButton_${item.name.toLowerCase()}`}
        style={[
          localStyle.socialBtn,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
            backgroundColor: colors.dark
              ? colors.inputBackground
              : colors.backgroundColor,
          },
        ]}>
        <View style={localStyle.rowWithGap}>
          {item.icon}
          <CText testID={`signUpSocialButtonText_${item.name.toLowerCase()}`} type={'M14'} color={colors.textColor} style={styles.ml20}>
            {item.name}
          </CText>
        </View>
      </TouchableOpacity>
    );
  });
  return (
    <CSafeAreaViewAuth testID="signUpContainer">
      <CHeader testID="signUpHeader" />
      <KeyBoardAvoidWrapper
        testID="signUpKeyboardWrapper"
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(25)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText testID="signUpTitle" type={'B24'}>{String.createYourAccount}</CText>

          <CText testID="signUpDescription" type={'R14'} color={colors.grayscale500}>
            {String.accountText}
          </CText>
          <CInput
            testID="signUpFullNameInput"
            placeholder={String.fullName}
            _value={name}
            keyBoardType={'default'}
            _errorText={nameError}
            maxLength={30}
            autoCapitalize={'none'}
            toGetTextFieldValue={onChangeName}
            inputContainerStyle={nameInputStyle}
            _onFocus={onFocusName}
            onBlur={onBlurName}
          />
          <CInput
            testID="signUpEmailInput"
            placeholder={String.email}
            _value={email}
            keyBoardType={'email-address'}
            _errorText={emailError}
            maxLength={30}
            autoCapitalize={'none'}
            toGetTextFieldValue={onChangedEmail}
            inputContainerStyle={emailInputStyle}
            _onFocus={onFocusEmail}
            onBlur={onBlurEmail}
          />
          <CInput
            testID="signUpPasswordInput"
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
          <CButton
            title={String.signUp}
            onPress={onPressSignUp}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
            testID="signUpButton"
          />
          <View testID="signUpAgreementContainer" style={styles.flexRow}>
            <TouchableOpacity onPress={onPressRememberMe} testID="signUpRememberMeCheckbox">
              <Ionicons
                testID="signUpRememberMeIcon"
                name={!!rememberMe ? 'checkbox' : 'square-outline'}
                color={!!rememberMe ? colors.primary : colors.grayScale50}
                size={moderateScale(24)}
              />
            </TouchableOpacity>
            <CText testID="signUpAgreementText" type={'r14'} color={colors.colorText} style={{width: '95%'}}>
              {String.agreementText}
              <CText testID="signUpUserAgreementLink" type={'r14'} color={colors.primary}>
                {String.userAgreement}
              </CText>
              <CText testID="signUpAndText" type={'r14'} color={colors.colorText}>
                {String.and}
              </CText>
              <CText testID="signUpPrivacyPolicyLink" type={'r14'} color={colors.primary}>
                {String.privacyPolicy}
              </CText>
            </CText>
          </View>
          <View testID="signUpDividerContainer" style={localStyle.divider}>
            <View
              testID="signUpDividerLine1"
              style={[
                localStyle.orContainer,
                {
                  backgroundColor: colors.dark
                    ? colors.grayScale500
                    : colors.grayScale200,
                },
              ]}
            />
            <CText testID="signUpOrText" type={'r12'} style={styles.mh10} color={colors.grayScale500}>
              {String.orSignInWith}
            </CText>
            <View
              testID="signUpDividerLine2"
              style={[
                localStyle.orContainer,
                {
                  backgroundColor: colors.dark
                    ? colors.grayScale500
                    : colors.grayScale200,
                },
              ]}
            />
          </View>
          <View testID="signUpSocialButtonsContainer" style={localStyle.socialBtnContainer}>
            {socialIcon.map((item, index) => (
              <RenderSocialBtn item={item} key={index.toString()} />
            ))}
          </View>
        </View>
      </KeyBoardAvoidWrapper>
      <View testID="signUpBottomContainer" style={localStyle.bottomTextContainer}>
        <CText testID="signUpAlreadyAccountText" type={'R14'} color={colors.grayScale500}>
          {String.alreadyHaveAccount}
        </CText>
        <TouchableOpacity onPress={onPressSignIn} testID="signInLinkButton">
          <CText testID="signInLinkText" color={colors.primary} style={localStyle.loginText}>
            {String.signIn}
          </CText>
        </TouchableOpacity>
      </View>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  btnStyle: {
    ...styles.selfCenter,
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mt20,
  },
  orContainer: {
    height: getHeight(1),
    width: '20%',
  },
  socialBtn: {
    ...styles.center,
    height: getHeight(45),
    width: '46%',
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(1),
    ...styles.mh10,
    ...styles.mt20,
  },
  socialBtnContainer: {
    ...styles.flexRow,
  },
  bottomTextContainer: {
    ...styles.flexRow,
    ...styles.selfCenter,
    ...styles.mb20,
  },
  loginText: {
    marginTop: moderateScale(2),
  },
});

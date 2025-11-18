import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo, useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import {Splash_Dark, Splash_Light} from '../../assets/svg';
import {getHeight, moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import CHeader from '../../components/common/CHeader';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import CInput from '../../components/common/CInput';
import {validPassword, validateEmail} from '../../utils/Validation';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import CButton from '../../components/common/CButton';
import {socialIcon} from '../../api/constant';
import {AuthNav, StackNav, TabNav} from '../../navigation/NavigationKey';
import {setAuthToken} from '../../utils/AsyncStorage';


export default function Login({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailInputStyle, setEmailInputStyle] = useState(BlurredStyle);
  const [passwordInputStyle, setPasswordInputStyle] = useState(BlurredStyle);

  

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
  const onPressForgotPassword = () => {
    navigation.navigate(AuthNav.SignUpWithMobileNumber, {
      title: String.forgotPassWord,
    });
  };
  const OnPressRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const onPressSignUp = () => {
    navigation.navigate(AuthNav.SignUp);
  };
  const onPressSignIn = async () => {
    await setAuthToken(true);
    navigation.reset({
      index: 0,
      routes: [{name: StackNav.TabNavigation}],
    });
  };

  const RenderSocialBtn = memo(({item}) => {
    return (
      <TouchableOpacity
        testID={`loginSocialButton_${item.name.toLowerCase()}`}
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
          <CText testID={`loginSocialButtonText_${item.name.toLowerCase()}`} type={'M14'} color={colors.textColor} style={styles.ml20}>
            {item.name}
          </CText>
        </View>
      </TouchableOpacity>
    );
  });

  return (
    <CSafeAreaViewAuth testID="loginContainer">
      <CHeader testID="loginHeader" />
      <KeyBoardAvoidWrapper
        testID="loginKeyboardWrapper"
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(25)},
        ]}>
        <View testID="loginMainContainer" style={localStyle.mainContainer}>
          <View testID="loginLogoContainer" style={localStyle.logoStyle}>
            {colors.dark ? (
              <Splash_Dark
                testID="loginLogoDark"
                width={moderateScale(64)}
                height={moderateScale(64)}
              />
            ) : (
              <Splash_Light
                testID="loginLogoLight"
                width={moderateScale(64)}
                height={moderateScale(64)}
              />
            )}
          </View>
          <CText testID="welcomeBackTitle" type={'B24'} align={'center'}>
            {String.welcomeBack}
          </CText>
          <CText testID="signInSubtitle" type={'R14'} align={'center'} color={colors.grayScale400}>
            {String.signInToYourAccount}
          </CText>
          <CInput
            testID="loginEmailInput"
            placeholder={String.email}
            _value={email}
            keyBoardType={'email-address'}
            _errorText={emailError}
            maxLength={30}
            autoCapitalize={'none'}
            toGetTextFieldValue={onChangedEmail}
            inputContainerStyle={[localStyle.inputBoxStyle, emailInputStyle]}
            _onFocus={onFocusEmail}
            onBlur={onBlurEmail}
          />
          <CInput
            testID="loginPasswordInput"
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
          <View testID="loginRememberAndForgotContainer" style={[styles.rowSpaceBetween, styles.mt10]}>
            <View testID="loginRememberMeContainer" style={styles.rowSpaceAround}>
              <TouchableOpacity testID="loginRememberMeCheckbox" onPress={OnPressRememberMe}>
                <Ionicons
                  testID="loginRememberMeIcon"
                  name={!!rememberMe ? 'checkbox' : 'square-outline'}
                  color={!!rememberMe ? colors.primary : colors.grayScale50}
                  size={moderateScale(24)}
                />
              </TouchableOpacity>
              <CText
                testID="loginRememberMeLabel"
                type={'r14'}
                color={colors.colorText}
                style={styles.ml5}
                align={'center'}>
                {String.rememberMe}
              </CText>
            </View>
            <TouchableOpacity testID="loginForgotPasswordLink" onPress={onPressForgotPassword}>
              <CText testID="loginForgotPasswordText" type={'M14'} color={colors.primary} align={'center'}>
                {String.forgotPassWord}
              </CText>
            </TouchableOpacity>
          </View>
          <CButton
            testID="loginSignInButton"
            title={String.signIn}
            onPress={onPressSignIn}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
          />
          <View testID="loginDividerContainer" style={localStyle.divider}>
            <View
              testID="loginDividerLine1"
              style={[
                localStyle.orContainer,
                {
                  backgroundColor: colors.dark
                    ? colors.grayScale500
                    : colors.grayScale200,
                },
              ]}
            />
            <CText testID="loginOrText" type={'r12'} style={styles.mh10} color={colors.grayScale500}>
              {String.orSignInWith}
            </CText>
            <View
              testID="loginDividerLine2"
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
          <View testID="loginSocialButtonsContainer" style={localStyle.socialBtnContainer}>
            {socialIcon.map((item, index) => (
              <RenderSocialBtn item={item} key={index.toString()} />
            ))}
          </View>
        </View>
      </KeyBoardAvoidWrapper>
      <View testID="loginBottomContainer" style={localStyle.bottomTextContainer}>
        <CText testID="loginNoAccountLabel" type={'R14'} color={colors.grayScale500}>
          {String.doHaveAnAccount}
        </CText>
        <TouchableOpacity testID="loginSignUpLink" onPress={onPressSignUp}>
          <CText testID="loginSignUpText" color={colors.primary} style={localStyle.signUpText}>
            {String.signUp}
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
  logoStyle: {
    ...styles.selfCenter,
  },
  inputBoxStyle: {
    ...styles.mt30,
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mt10,
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
  btnStyle: {
    ...styles.selfCenter,
  },
  bottomTextContainer: {
    ...styles.flexRow,
    ...styles.selfCenter,
    ...styles.mb20,
  },
});

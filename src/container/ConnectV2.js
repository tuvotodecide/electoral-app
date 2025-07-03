import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../components/common/CSafeAreaView';
import {deviceWidth, getHeight, moderateScale} from '../common/constants';
import {styles} from '../themes';
import images from '../assets/images';
import CText from '../components/common/CText';
import String from '../i18n/String';
import CButton from '../components/common/CButton';
import {AppleIcon, Apple_Dark, GoogleIcon} from '../assets/svg';
import {AuthNav} from '../navigation/NavigationKey';

export default function Connect({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressSignUp = () => {
    navigation.navigate(AuthNav.SignUp);
  };

  const onPressContinueWithEmail = () => {
    navigation.navigate(AuthNav.Login);
  };
  const OnPressContinueWithGoogle = () => {};

  const OnPressContinueWithApple = () => {};

  return (
    <CSafeAreaView style={localStyle.Container}>
      <View style={localStyle.imageContainer}>
        <Image source={images.ConnectImage} style={localStyle.imageStyle} />
      </View>
      <CText type={'B24'} style={styles.mt20} align={'center'}>
        {String.getStarted}
      </CText>
      <CText
        type={'R14'}
        style={styles.mt5}
        color={colors.grayScale500}
        align={'center'}>
        {String.allInOneInvestmentPlatform}
      </CText>
      <CButton
        onPress={onPressContinueWithEmail}
        title={String.continueWithEmail}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
      />
      <TouchableOpacity
        onPress={OnPressContinueWithApple}
        style={[localStyle.googleStyle, {borderColor: colors.grayScale200}]}>
        {colors.dark ? <Apple_Dark /> : <AppleIcon />}
        <CText
          type={'S16'}
          color={colors.Black}
          align={'center'}
          style={styles.mh20}>
          {String.continueWithApple}
        </CText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={OnPressContinueWithGoogle}
        style={[localStyle.googleStyle, {borderColor: colors.grayScale200}]}>
        <GoogleIcon />
        <CText
          type={'S16'}
          color={colors.Black}
          align={'center'}
          style={styles.mh20}>
          {String.continueWithGoogle}
        </CText>
      </TouchableOpacity>

      <View style={localStyle.bottomTextContainer}>
        <CText type={'R14'} color={colors.grayScale500}>
          {String.doHaveAnAccount}
        </CText>
        <TouchableOpacity onPress={onPressSignUp}>
          <CText color={colors.primary} style={localStyle.signUpText}>
            {String.signUp}
          </CText>
        </TouchableOpacity>
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  Container: {
    width: deviceWidth,
    ...styles.itemsCenter,
  },
  imageContainer: {
    width: deviceWidth,
  },
  imageStyle: {
    width: deviceWidth,
    height: getHeight(390),
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
  googleStyle: {
    ...styles.alignCenter,
    ...styles.flexRow,
    ...styles.mv10,
    ...styles.center,
    ...styles.selfCenter,
    borderWidth: moderateScale(1),
    height: moderateScale(52),
    width: '90%',
    borderRadius: moderateScale(10),
  },
  signUpText: {
    marginTop: moderateScale(2),
  },
  bottomTextContainer: {
    ...styles.flexRow,
    ...styles.mb30,
    ...styles.selfCenter,
  },
});

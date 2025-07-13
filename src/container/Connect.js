import {Image, StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../components/common/CSafeAreaView';
import CSafeAreaViewAuth from '../components/common/CSafeAreaViewAuth';
import {deviceWidth, moderateScale} from '../common/constants';
import {styles} from '../themes';
import images from '../assets/images';
import CText from '../components/common/CText';
import String from '../i18n/String';
import CButton from '../components/common/CButton';
import {AuthNav, StackNav} from '../navigation/NavigationKey';
import CIconText from '../components/common/CIconText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {commonColor} from '../themes/colors';
export default function Connect({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressRegister1 = () => {
    navigation.navigate(AuthNav.RegisterUser1);
  };

  const onPressLoginUser = () => {
    navigation.navigate(AuthNav.LoginUser);
  };

  const onPressInfo = () => {
    // navigation.navigate(AuthNav.Login);
    navigation.navigate(StackNav.OnBoarding);
  };

  return (
    // <CSafeAreaView style={localStyle.Container}>
    <CSafeAreaViewAuth style={localStyle.container}>
      <View style={localStyle.imageContainer}>
        <Image source={images.logoImg} style={localStyle.imageStyle} />
      </View>
      <View
        style={[
          localStyle.contentContainer,
          {backgroundColor: colors.primary},
        ]}>
        <CText
          type={'B24'}
          style={styles.mb20}
          align={'center'}
          color={colors.white}>
          {String.connectTitle}
        </CText>

        <CIconText
          icon={<Icon name="shield-lock" size={24} color={colors.white} />}
          text={String.connectItem1}
          color={colors.white}
        />

        <CIconText
          icon={<Icon name="swap-horizontal" size={24} color={colors.white} />}
          text={String.connectItem2}
          color={colors.white}
        />

        <CIconText
          icon={
            <Icon name="lightbulb-on-outline" size={24} color={colors.white} />
          }
          text={String.connectItem3}
          color={colors.white}
        />

        <View style={localStyle.bottomButtons}>
          <CButton
            onPress={onPressInfo}
            title={String.connectBtnInfo + ' '}
            type={'B16'}
            icon={<Icon name="arrow-right" size={25} color={colors.white} />}
            containerStyle={localStyle.btnStyle}
            sinMargen
          />

          <CButton
            onPress={onPressRegister1}
            title={String.connectBtnRegister}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
            color={commonColor.gradient2}
            bgColor={commonColor.white}
            sinMargen
          />

          <CButton
            onPress={onPressLoginUser}
            title={String.connectBtnLogin}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
            color={colors.white}
            bgColor={commonColor.gradient2}
          />
        </View>
      </View>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  Container: {
    width: deviceWidth,
    ...styles.itemsCenter,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(30),
    marginBottom: moderateScale(30),
  },
  imageStyle: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
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
  contentContainer: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    justifyContent: 'space-between',
  },
  bottomButtons: {
    width: '100%',
  },
});

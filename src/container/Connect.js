import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

// custom import
import { MaterialCommunityIcons } from '@expo/vector-icons';
import images from '../assets/images';
import { deviceWidth, moderateScale } from '../common/constants';
import CButton from '../components/common/CButton';
import CIconText from '../components/common/CIconText';
import CSafeAreaViewAuth from '../components/common/CSafeAreaViewAuth';
import CText from '../components/common/CText';
import String from '../i18n/String';
import { hydrateDemoSession } from '../features/demo/demoSession';
import { AuthNav, StackNav } from '../navigation/NavigationKey';
import { describeNav, notifNavLog } from '../utils/notifNavDebug';
import { styles } from '../themes';
import { commonColor } from '../themes/colors';
import { captureError } from '../config/sentry';
import {
  clearLocalDataOnFirstLaunch,
  hasLocalAccount,
} from '../services/privado/localAccount';

/** Si hay cuenta local; ante un error del SDK se toma como que no hay. */
const checkLocalAccount = async step => {
  try {
    return await hasLocalAccount();
  } catch (error) {
    captureError(error, { flow: 'Connect', step, critical: false });
    return false;
  }
};

export default function Connect({ navigation }) {
  const colors = useSelector(state => state.theme.theme);

  useEffect(() => {
    notifNavLog('Connect', 'mounted', { current: describeNav() });
    const checkUserData = async () => {
      try {
        // iOS: borra la cuenta que quedó en el Keychain de una instalación anterior.
        await clearLocalDataOnFirstLaunch();
      } catch (error) {
        captureError(error, { flow: 'Connect', step: 'firstLaunch', critical: false });
      }
      const response = await checkLocalAccount('checkUserData');
      notifNavLog('Connect', 'checkUserData', { hasUserData: response });
      if (response) {
        // Una billetera real siempre gana sobre una sesión demo persistida.
        notifNavLog('Connect', 'replace -> LoginUser', { current: describeNav() });
        navigation.replace(AuthNav.LoginUser);
        return;
      }

      // La demo se retoma en AccountAccess, no en LoginUser: LoginUser abre el
      // vault, y sin billetera no hay vault que abrir.
      const demoActive = await hydrateDemoSession();
      if (demoActive) {
        navigation.replace(AuthNav.AccountAccess, {resumeDemo: true});
      }
    };
    checkUserData();
  }, []);

  const onPressRegister1 = () => {
    navigation.navigate(AuthNav.RegisterUser1);
  };

  const onPressLoginUser = async () => {
    const response = await checkLocalAccount('onPressLoginUser');
    if (!response) {
      // Sin billetera local: pantalla de cédula + PIN, que deriva a
      // recuperación para cualquier cuenta real.
      navigation.navigate(AuthNav.AccountAccess);
    } else {
      navigation.navigate(AuthNav.LoginUser);
    }
  };

  const onPressInfo = () => {
    // navigation.navigate(AuthNav.Login);
    navigation.navigate(StackNav.OnBoarding);
  };

  return (
    // <CSafeAreaView style={localStyle.Container}>
    <CSafeAreaViewAuth style={localStyle.container} testID="connectContainer">
      <View style={localStyle.imageContainer} testID="connectImageContainer">
        <Image source={images.logoImg} style={localStyle.imageStyle} testID="MiVotoLogoImage" />
      </View>
      <View
        style={[
          localStyle.contentContainer,
          { backgroundColor: colors.primary },
        ]}
        testID="connectContentContainer">
        <CText
          type={'B24'}
          style={styles.mb20}
          align={'center'}
          color={colors.white}
          testID="connectTitle">
          {String.connectTitle}
        </CText>

        <CIconText
          icon={<MaterialCommunityIcons name="shield-lock" size={24} color={colors.white} />}
          text={String.connectItem1}
          color={colors.white}
          testID="connectFeature1"
        />

        <CIconText
          icon={<MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.white} />}
          text={String.connectItem2}
          color={colors.white}
          testID="connectFeature2"
        />

        <CIconText
          icon={
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.white} />
          }
          text={String.connectItem3}
          color={colors.white}
          testID="connectFeature3"
        />

        <View style={localStyle.bottomButtons} testID="connectButtonsContainer">
          <CButton
            onPress={onPressInfo}
            title={String.connectBtnInfo + ' '}
            type={'B16'}
            icon={<MaterialCommunityIcons name="arrow-right" size={25} color={colors.white} />}
            containerStyle={localStyle.btnStyle}
            sinMargen
            testID="connectInfoButton"
          />

          <CButton
            onPress={onPressRegister1}
            title={String.connectBtnRegister}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
            color={commonColor.gradient2}
            bgColor={commonColor.white}
            sinMargen
            testID="connectRegisterButton"
          />

          <CButton
            onPress={onPressLoginUser}
            title={String.connectBtnLogin}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
            color={colors.white}
            bgColor={commonColor.gradient2}
            testID="connectLoginButton"
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

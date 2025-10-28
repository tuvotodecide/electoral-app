import {Image, StyleSheet, View} from 'react-native';
import React, { useEffect, useState } from 'react';
import {useSelector} from 'react-redux';

// custom import
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
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import wira from 'wira-sdk';
import {PROVIDER_NAME} from '@env';
import InfoModal from '../components/modal/InfoModal';

const defaultModalState = {
  visible: false,
  title: '',
  message: '',
  buttonText: '',
  onClose: null,
};

export default function Connect({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [modal, setModal] = useState(defaultModalState);

  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      onSessionReceived,
    );
  }, []);

  const onSessionReceived = (files) => {
    console.log('files', files);
    if(!files || files.length !== 1) {
      return;
    }
    try {
      wira.Storage.saveSharedData(PROVIDER_NAME, files[0].text);
      setModal({
        visible: true,
        title: String.sessionReceived,
        message: String.sessionReceivedMessage,
        buttonText: String.ok,
        onClose: onPressLoginUser,
      })
    } catch (error) {
      console.log('Error processing shared session:', error);
      setModal({
        visible: true,
        title: String.error,
        message: String.sharedSessionError,
        buttonText: String.ok,
        onClose: () => setModal(defaultModalState),
      });
    }
  };

  const onPressRegister1 = () => {
    navigation.navigate(AuthNav.RegisterUser1);
  };

  const onPressLoginUser = () => {
    const response = wira.getWiraData(PROVIDER_NAME);
    if (!response) {
      navigation.navigate(AuthNav.SelectRecuperation);
      return;
    }
    navigation.navigate(AuthNav.LoginUser);
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
          {backgroundColor: colors.primary},
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
          icon={<Icon name="shield-lock" size={24} color={colors.white} />}
          text={String.connectItem1}
          color={colors.white}
          testID="connectFeature1"
        />

        <CIconText
          icon={<Icon name="swap-horizontal" size={24} color={colors.white} />}
          text={String.connectItem2}
          color={colors.white}
          testID="connectFeature2"
        />

        <CIconText
          icon={
            <Icon name="lightbulb-on-outline" size={24} color={colors.white} />
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
            icon={<Icon name="arrow-right" size={25} color={colors.white} />}
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
      <InfoModal {...modal} />
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

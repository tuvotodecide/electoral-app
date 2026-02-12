import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { check, openSettings, RESULTS } from 'react-native-permissions';
import { useSelector } from 'react-redux';
// Custom imports
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { moderateScale } from '../../common/constants';
import StepIndicator from '../../components/authComponents/StepIndicator';
import CButton from '../../components/common/CButton';
import CHeader from '../../components/common/CHeader';
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CText from '../../components/common/CText';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import String from '../../i18n/String';
import { AuthNav } from '../../navigation/NavigationKey';
import { styles } from '../../themes';
import { BACKEND_IDENTITY } from '@env';

import wira from 'wira-sdk';
import LoadingModal from '../../components/modal/LoadingModal';

export default function RegisterUser4({navigation, route}) {
  const {dni = '', frontImage, backImage, isRecovery = false} = route.params;
  const [selfie, setSelfie] = useState(null);
  const colors = useSelector(state => state.theme.theme);
  const [modal, setModal] = useState({
    visible: false,
    message: '',
    isLoading: false,
  });

  useEffect(() => {
    const openCamera = async () => {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permiso denegado', 'No se puede acceder a la cámara.');
        return;
      }

      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.8,
          saveToPhotos: true,
        },
        response => {
          if (response?.assets) {
            setSelfie(response.assets[0]);
          } else if (response?.errorCode) {
          }
        },
      );
    };

    openCamera();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const status = await check(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (status === RESULTS.GRANTED) return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {title: 'Permiso de cámara', message: 'Necesitamos acceso a la cámara.'},
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;

    if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'Cámara deshabilitada',
        'Habilita la cámara en Ajustes del sistema',
        [{text: 'Abrir ajustes', onPress: () => openSettings()}, {text: 'OK'}],
      );
    }
    return false;
  };

  const onPressNext = () => {
    if (!selfie) {
      Alert.alert('Foto requerida', 'Debes tomar una foto para continuar.');
      return;
    }

    if (isRecovery) {
      triggerRecovery();
      return;
    }

    navigation.navigate(AuthNav.RegisterUser5, {
      dni,
      frontImage,
      backImage,
      selfie,
    });
  };

  const yieldUI = () => new Promise(resolve => setTimeout(resolve, 50));

  const resizeImage = async (uri) => {
    const imageContext = ImageManipulator.manipulate(uri);
    const renderedImage = await imageContext.resize({
      height: 300,
    }).renderAsync()

    const result = await renderedImage.saveAsync({
      format: SaveFormat.JPEG,
    });

    return result;
  }

  const triggerRecovery = async () => {
    setModal({
      visible: true,
      message: String.recoveringData,
      isLoading: true,
    });
    await yieldUI();

    try {
      const resizedFrontImage = await resizeImage(frontImage.uri);
      const resizedBackImage = await resizeImage(backImage.uri);
      const resizedSelfie = await resizeImage(selfie.uri);

      const recoveryService = new wira.RecoveryService();
      await recoveryService.recoveryAndSave(
        BACKEND_IDENTITY,
        resizedFrontImage,
        resizedBackImage,
        resizedSelfie,
        dni,
      );

      setModal({
        visible: true,
        message: String.recoverySuccess,
        isLoading: false,
        success: true,
      });
    } catch (error) {
      setModal({
        visible: true,
        title: '',
        message: String.recoveryError,
        isLoading: false,
      });
      console.error('Recovery failed:', error);
      return;
    }
  };

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{
        name: AuthNav.LoginUser,
        params: {isCIRecovery: true}
      }],
    });
  }

  return (
    <CSafeAreaViewAuth testID="registerUser4Container">
      <StepIndicator testID="registerUser4StepIndicator" step={4} />
      <CHeader testID="registerUser4Header" />
      <KeyBoardAvoidWrapper
        testID="registerUser4KeyboardWrapper"
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText testID="registerUser4Title" type={'B16'}>
            {String.takePhoto}
          </CText>
          <View
            testID="registerUser4ImageBox"
            style={[
              localStyle.imageBox,
              {backgroundColor: colors.inputBackground},
            ]}>
            {selfie ? (
              <Image
                testID="registerUser4SelfieImage"
                source={{uri: selfie.uri}}
                style={localStyle.image}
              />
            ) : (
              <CText
                testID="registerUser4LoadingText"
                type="R14"
                color={colors.primary}>
                {String.loadingCamera}
              </CText>
            )}
          </View>
        </View>
      </KeyBoardAvoidWrapper>
      <View
        testID="registerUser4BottomContainer"
        style={localStyle.bottomTextContainer}>
        <CButton
          testID="registerUser4NextButton"
          title={'Siguiente'}
          onPress={onPressNext}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
        />
      </View>
      <LoadingModal
        {...modal}
        buttonText={modal.success ? String.continue : String.retryRecovery}
        onClose={modal.success ? goToLogin : triggerRecovery}
        secondBtn={modal.success ? undefined : String.btnCheckData}
        onSecondPress={() =>
          navigation.navigate(AuthNav.RegisterUser1, {isRecovery: true})
        }
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    gap: 10,
  },
  imageBox: {
    height: 400,
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: moderateScale(10),
  },
  image: {
    height: '100%',
    width: '100%',
    borderRadius: moderateScale(10),
  },
  btnStyle: {
    ...styles.selfCenter,
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
});

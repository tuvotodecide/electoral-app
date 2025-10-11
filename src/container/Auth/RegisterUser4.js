import React, {useEffect, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import {useSelector} from 'react-redux';
import {check, RESULTS, openSettings} from 'react-native-permissions';
// Custom imports
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';
import StepIndicator from '../../components/authComponents/StepIndicator';
import String from '../../i18n/String';
import {useNavigationLogger} from '../../hooks/useNavigationLogger';
import wira from 'wira-sdk';
import LoadingModal from '../../components/modal/LoadingModal';
import {PROVIDER_NAME} from '@env';

export default function RegisterUser4({navigation, route}) {
  const {dni = '', frontImage, backImage, isRecovery = false} = route.params;
  const [selfie, setSelfie] = useState(null);
  const colors = useSelector(state => state.theme.theme);
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
    isLoading: false,
  });

  const {logAction, logNavigation} = useNavigationLogger('RegisterUser4', true);

  useEffect(() => {
    const openCamera = async () => {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permiso denegado', 'No se puede acceder a la cámara.');
        logAction('camera_permission_denied');
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
            logAction('selfie_captured');
          } else if (response?.errorCode) {
            logAction('camera_launch_error', {code: response.errorCode});
          }
        },
      );
    };

    openCamera();
  }, [logAction]);

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
      logAction('selfie_missing');
      return;
    }

    if (isRecovery) {
      logAction('recovery_flow_start', {dni});
      triggerRecovery();
      return;
    }

    logNavigation(AuthNav.RegisterUser5, {dni});
    navigation.navigate(AuthNav.RegisterUser5, {
      dni,
      frontImage,
      backImage,
      selfie,
    });
  };

  const yieldUI = () => new Promise(resolve => setTimeout(resolve, 50));

  const triggerRecovery = async () => {
    setModal({
      visible: true,
      message: String.recoveringData,
      isLoading: true,
    });
    await yieldUI();

    try {
      const recoveryService = new wira.RecoveryService();
      await recoveryService.recoveryAndSave(
        frontImage,
        backImage,
        selfie,
        dni,
        PROVIDER_NAME,
      );

      setModal({visible: false, title: '', message: '', isLoading: false});
      logAction('recovery_success');
      navigation.reset({
        index: 0,
        routes: [{name: AuthNav.LoginUser}],
      });
    } catch (error) {
      setModal({
        visible: true,
        title: '',
        message: String.recoveryError,
        isLoading: false,
      });
      logAction('recovery_error', {message: error?.message});
      console.error('Recovery failed:', error);
    }
  };

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
        buttonText={String.retryRecovery}
        onClose={triggerRecovery}
        secondBtn={modal.isLoading ? undefined : String.btnCheckData}
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

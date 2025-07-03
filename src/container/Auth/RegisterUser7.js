import {Image, StyleSheet, View} from 'react-native';
import React, {useState} from 'react';

// custom import
import CSafeAreaView from '../../components/common/CSafeAreaView';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';
import {useSelector} from 'react-redux';
import images from '../../assets/images';
import CAlert from '../../components/common/CAlert';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import String from '../../i18n/String';
import { biometricLogin, biometryAvailability } from '../../utils/Biometry';
import InfoModal from '../../components/modal/InfoModal';

export default function RegisterUser7({navigation, route}) {
  const {vc, offerUrl, dni} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const [modal, setModal] = useState({visible: false, msg: ''});
  const onPressNext = () => {
    navigation.navigate(AuthNav.RegisterUser8);
  };

  const handleActivateBio = async () => {
    const {available, biometryType} = await biometryAvailability();

    if (!available) {
      return setModal({
        visible: true,
        msg: 'Este dispositivo no tiene hardware biométrico.',
      });
    }
    if (!biometryType) {
      return setModal({
        visible: true,
        msg: 'No hay huellas ni Face ID registradas. Agrega una en Ajustes del sistema.',
      });
    }

    const ok = await biometricLogin(
      biometryType === 'FaceID'
        ? 'Escanea tu rostro'
        : 'Escanea tu huella dactilar',
    );

    if (!ok) {
      return setModal({
        visible: true,
        msg: 'La autenticación falló. Intenta otra vez o utiliza tu PIN.',
      });
    }

    navigation.navigate(AuthNav.RegisterUser8, {
      vc,
      offerUrl,
      useBiometry: true,
      dni
    });
  };

  const handleLater = () =>
    navigation.navigate(AuthNav.RegisterUser8, {
      vc,
      offerUrl,
      useBiometry: false,
      dni
    });



  return (
    <CSafeAreaView>
      <StepIndicator step={7} />
      <CHeader />
      <KeyBoardAvoidWrapper
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <Image
            source={colors.dark ? images.FingerImage : images.Finger_lightImage}
            style={localStyle.imageContainer}
          />
          <CText type={'B20'} style={styles.boldText} align={'center'}>
            {String.authFingerprintTitle}
          </CText>

          <CText
            type={'B16'}
            color={getSecondaryTextColor(colors)}
            align={'center'}>
            {String.authFingerprintDesc}
          </CText>
        </View>
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CAlert status="info" message={String.alertFingerprintInfo} />

        <CButton
          title={String.btnActivateFingerprint}
          onPress={handleActivateBio}
          type={'B16'}
          variant="outlined"
          containerStyle={localStyle.btnStyle}
          sinMargen
        />

        <CButton
          title={String.btnActivateLater}
          onPress={handleLater}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
        />
      </View>
      <InfoModal
        visible={modal.visible}
        title="Atención"
        message={modal.msg}
        onClose={() => setModal({visible: false, msg: ''})}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    gap: 5,
    marginBottom: 10,
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
    ...styles.ph20,
  },
  loginText: {
    marginTop: moderateScale(2),
  },
  rowWithGap: {
    flexDirection: 'row',
    columnGap: 10,
  },
  item: {
    width: '95%',
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(180),
    width: moderateScale(180),
  },
  margin: {
    marginBottom: '20px',
  },
});

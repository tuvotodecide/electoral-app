import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {useSelector} from 'react-redux';
import images from '../../assets/images';
import {AuthNav} from '../../navigation/NavigationKey';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import String from '../../i18n/String';
import InfoModal from '../../components/modal/InfoModal';
import idCardAnalyzer from '../../utils/idCardAnalyzer';
import {normalizeOcrForUI} from '../../utils/issuerClient';
import {useNavigationLogger} from '../../hooks/useNavigationLogger';

function onlyDigits(s = '') {
  return (s || '').replace(/\D/g, '');
}

export default function RegisterUser5({navigation, route}) {
  const {dni, frontImage, backImage, selfie} = route.params;
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const colors = useSelector(state => state.theme.theme);

  const {logAction, logNavigation} = useNavigationLogger(
    'RegisterUser5',
    true,
  );

  useEffect(() => {
    logAction('id_card_analysis_started', {
      hasFrontImage: !!frontImage,
      hasBackImage: !!backImage,
      hasSelfie: !!selfie,
    });
    (async () => {
      try {
        const res = await idCardAnalyzer.analyze(
          frontImage?.uri,
          backImage?.uri,
          selfie?.uri,
        );

        if (!res.success) {
          logAction('id_card_analysis_failed', {
            reason: res.error || 'unknown',
          });
          if (res.error === 'front/back order') {
            setErrorMessage(
              'Las imágenes están desordenadas (front/back). Por favor, vuelve a capturar en el orden correcto.',
            );
          } else {
            setErrorMessage(
              res.error ||
                'Error de verificación. Vuelve a intentar con fotos más nítidas.',
            );
          }
          setErrorModalVisible(true);
          return;
        }

        const {data} = res;
        const returnedDni = onlyDigits(data.numeroDoc);
        if (returnedDni !== onlyDigits(dni)) {
          logAction('dni_mismatch_detected');
          setErrorMessage(
            'El número de documento detectado no coincide con el DNI ingresado. ' +
              'Por favor, vuelve a cargar tus imágenes.',
          );
          setErrorModalVisible(true);
          return;
        }

        const ocrData = normalizeOcrForUI(data);
        navigation.replace(AuthNav.RegisterUser6, {dni, ocrData});
        logNavigation('go_to_register_user6');
      } catch (err) {
        setErrorMessage(
          'Error de verificación. Por favor intenta de nuevo y toma fotos más nítidas.',
        );
        setErrorModalVisible(true);
        logAction('id_card_analysis_exception', {
          name: err?.name,
          message: err?.message,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [backImage?.uri, frontImage?.uri, selfie?.uri, dni, logAction, logNavigation, navigation]);

  return (
    <CSafeAreaViewAuth testID="registerUser5Container">
      <StepIndicator step={5} testID="registerUser5StepIndicator" />
      <View style={localStyle.center} testID="registerUser5CenterView">
        <View style={localStyle.mainContainer} testID="registerUser5MainContainer">
          <Image
            source={
              colors.dark
                ? images.IdentityCardImage
                : images.IdentityCard_lightImage
            }
            style={localStyle.imageContainer}
            testID="registerUser5IdentityImage"
          />
          <CText type={'B20'} style={styles.boldText} align={'center'} testID="registerUser5TitleText">
            {String.verifyingIdentityTitle}
          </CText>
          <CText
            type={'B16'}
            color={getSecondaryTextColor(colors)}
            align={'center'}
            testID="registerUser5MessageText">
            {String.verifyingIdentityMessage}
          </CText>
          {loading && (
            <ActivityIndicator
              size={60}
              color={colors.grayScale500}
              style={localStyle.marginTop}
              testID="registerUser5LoadingIndicator"
            />
          )}
        </View>
      </View>
      <InfoModal
        visible={errorModalVisible}
        title="Verificación fallida"
        message={errorMessage}
        buttonText="Reintentar"
        onClose={() => {
          setErrorModalVisible(false);
          navigation.reset({
            index: 1,
            routes: [
              {
                name: AuthNav.RegisterUser2,
                params: {dni, frontImage, backImage},
              },
            ],
          });
        }}
        testID="registerUser5ErrorModal"
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    ...styles.ph20,
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
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
    gap: 5,
  },
  marginTop: {
    marginTop: moderateScale(20),
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

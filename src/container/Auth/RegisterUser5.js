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
import {normalizeOcrForUI} from '../../utils/issuerClient';

import { IdentityApiUnreachableError } from '@privado-id/expo-sdk';
import { captureError } from '@/src/config/sentry';
import { getPrivadoClient } from '@/src/services/privado/privadoSession';
import { analysisErrorMessage } from '@/src/services/privado/registryErrors';
import { resizeImage } from '@/src/services/ImageManipulatorService';

function onlyDigits(s = '') {
  return (s || '').replace(/\D/g, '');
}

export default function RegisterUser5({navigation, route}) {
  const {dni, frontImage, backImage, selfie, livenessResult} = route.params;
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const colors = useSelector(state => state.theme.theme);

  useEffect(() => {
    (async () => {
      try {
        const frontImageB64 = await resizeImage(frontImage.uri);
        const backImageB64 = await resizeImage(backImage.uri);
        // Con prueba de vida la selfie ya viene verificada en base64.
        const selfieImageB64 = selfie.base64 ?? (await resizeImage(selfie.uri));

        // El resultado de la prueba de vida se consume aquí aunque el análisis
        // falle: para reintentar hay que repetir la verificación.
        const client = await getPrivadoClient();
        const {data, identityToken, identityTokenExpiresAt} =
          await client.analyzeIdentityDocument({
            frontImage: frontImageB64,
            backImage: backImageB64,
            selfieImage: selfieImageB64,
            livenessResult,
          });

        const returnedDni = onlyDigits(data.numeroDoc);
        if (returnedDni !== onlyDigits(dni)) {
          setErrorMessage(
            'El número de documento detectado no coincide con el DNI ingresado. ' +
              'Por favor, vuelve a cargar tus imágenes.',
          );
          setErrorModalVisible(true);
          return;
        }

        const ocrData = normalizeOcrForUI(data);
        // identityToken lo exigen /credentials/identity y /registry/register
        // (vence a los ~10 minutos). identityData son los datos tal como los
        // leyó el backend: ocrData deja solo los dígitos del número de
        // documento y el token certifica el número completo.
        const identityData = {
          numeroDoc: data.numeroDoc,
          fullName: data.fullName,
          fechaNacimiento: data.fechaNacimiento,
          fechaExpedicion: data.fechaExpedicion,
          lugarExpedicion: data.lugarExpedicion,
        };
        navigation.replace(AuthNav.RegisterUser6, {
          dni,
          ocrData,
          identityData,
          identityToken,
          identityTokenExpiresAt,
        });
      } catch (err) {
        const analysisMessage = analysisErrorMessage(err);
        if (analysisMessage) {
          setErrorMessage(analysisMessage);
        } else if (err instanceof IdentityApiUnreachableError) {
          setErrorMessage(String.networkError);
        } else {
          captureError(err, {
            flow: 'registerUser5',
            critical: true,
            step: 'ID Card analysis',
            code: err?.code,
            analysisCode: err?.analysisCode,
          });
          setErrorMessage(String.defaultVerificationError);
        }
        setErrorModalVisible(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [backImage?.uri, frontImage?.uri, selfie?.uri, selfie?.base64, livenessResult, dni, navigation]);

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

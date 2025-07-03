import {Image, View} from 'react-native';
import React from 'react';

//custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import images from '../../../assets/images';
import CText from '../../../components/common/CText';
import CAlert from '../../../components/common/CAlert';
import CButton from '../../../components/common/CButton';
import Icono from '../../../components/common/Icono';
import {PermissionsAndroid, Platform, ToastAndroid, Alert} from 'react-native';
import String from '../../../i18n/String';

export default function RecuperationQR() {
  const onPressNext = async () => {
    try {
      let granted = true;

      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          );
        } else {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
        }

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permiso denegado',
            'No se puede guardar el archivo sin permisos.',
          );
          return;
        }
      }

      ToastAndroid.show('QR guardado en Descargas 📁', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error guardando QR:', error);
      Alert.alert('Error', 'No se pudo guardar el QR.');
    }
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.qrRecoveryTitle} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <View
          style={{
            ...styles.ph20,
            marginTop: 50,
            marginBottom: 10,
            justifyContent: 'center',
            alignItems: 'center',
            height: getHeight(300),
            width: '100%',
          }}>
          <Image
            source={images.QRImage}
            style={{
              ...styles.selfCenter,
              height: moderateScale(300),
              width: moderateScale(300),
            }}
          />
        </View>

        <CText type="B16" align="center" marginTop={20}>
          {String.qrRecoveryDescription}
        </CText>
      </KeyBoardAvoidWrapper>

      <View style={{...styles.ph20, gap: 5}}>
        <CAlert status="warning" message={String.qrRecoveryWarning} />
        <CButton
          title={String.qrRecoveryButton}
          onPress={onPressNext}
          type="B16"
          containerStyle={{...styles.mb20}}
          frontIcon={<Icono size={20} name="download-outline" color="#fff" />}
        />
      </View>
    </CSafeAreaView>
  );
}

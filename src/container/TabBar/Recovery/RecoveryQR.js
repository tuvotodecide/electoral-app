import React, {useState} from 'react';
import {
  View,
  Alert,
  Platform,
  ToastAndroid,
  StyleSheet,
} from 'react-native';
import RNQRGenerator from 'rn-qr-generator';
import pako from 'pako';
import {Buffer} from 'buffer';

import CSafeAreaViewAuth from '../../../components/common/CSafeAreaViewAuth';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import UploadCardImage from '../../../components/common/UploadCardImage';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import {styles} from '../../../themes';
import String from '../../../i18n/String';
import {moderateScale} from '../../../common/constants';
import {AuthNav} from '../../../navigation/NavigationKey';

const decompress = b64 =>
  JSON.parse(pako.inflate(Buffer.from(b64, 'base64'), {to: 'string'}));

export default function RecoveryQr({navigation}) {
  const [imageUri, setImageUri] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  // ⬇️ Este es el ÚNICO punto de entrada de imagen (galería o cámara)
  const onImageSelected = async (asset) => {
    if (!asset?.uri) {
      Alert.alert('Imagen', 'No se pudo obtener la imagen seleccionada.');
      return;
    }

    setImageUri(asset.uri);
    setLoading(true);
    try {
      // RNQRGenerator acepta content:// y file:// en Android
      const { values } = await RNQRGenerator.detect({ uri: asset.uri });

      if (!values?.length) {
        throw new Error('No pude leer un QR válido');
      }

      const data = decompress(values[0]);

      const required = [
        'streamId',
        'dni',
        'salt',
        'privKey',
        'account',
        'guardian',
        'did',
      ];
      const missing = required.filter(f => !data[f]);
      if (missing.length) {
        throw new Error(`Faltan campos: ${missing.join(', ')}`);
      }

      setPayload(data);
      if (Platform.OS === 'android') {
        ToastAndroid.show('QR válido', ToastAndroid.SHORT);
      }
    } catch (err) {
      setPayload(null);
      setImageUri(null);
      Alert.alert('QR inválido', err?.message || 'No se pudo leer el QR.');
    } finally {
      setLoading(false);
    }
  };

  const goSetPin = () => {
    navigation.navigate(AuthNav.RecoveryUserQrpin, { payload });
  };

  return (
    <CSafeAreaViewAuth testID="recoveryQrContainer">
      <CHeader testID="recoveryQrHeader" />
      <KeyBoardAvoidWrapper testID="recoveryQrKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View testID="recoveryQrMainContent" style={local.main}>
          <CText testID="recoveryQrTitle" type="B20" align="center" style={styles.boldText}>
            {String.RecoverywithQR}
          </CText>
          <CText testID="recoveryQrSubtitle" type="B16" align="center">
            {String.recoveryQrSubtitle}
          </CText>

          <UploadCardImage
            testID="recoveryQrUploadImage"
            label={String.qrimagelabel}
            image={imageUri ? { uri: imageUri } : null}
            setImage={onImageSelected}
            loading={loading}
          />

          {payload && (
            <CText testID="recoveryQrValidMessage" type="R14" align="center" style={{marginTop: 10}}>
              {String.qrValid}
            </CText>
          )}
        </View>
      </KeyBoardAvoidWrapper>

      <View testID="recoveryQrFooter" style={local.footer}>
        <CButton
          testID="recoveryQrContinueButton"
          title={String.continueButton}
          onPress={goSetPin}
          disabled={!payload || loading}
        />
      </View>
    </CSafeAreaViewAuth>
  );
}

const local = StyleSheet.create({
  main: {...styles.ph20, gap: moderateScale(8)},
  footer: {...styles.ph20, marginBottom: moderateScale(20)},
});

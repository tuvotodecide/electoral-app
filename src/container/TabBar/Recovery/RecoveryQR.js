// src/container/Auth/Recovery/RecoveryQr.js
import React, {useState} from 'react';
import {
  View,
  Alert,
  Platform,
  PermissionsAndroid,
  ToastAndroid,
  StyleSheet,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator'; // ← nueva librería
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

  
  const pickImage = async () => {
    if (Platform.OS === 'android') {
      const perm =
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const status = await PermissionsAndroid.request(perm);
      if (status !== PermissionsAndroid.RESULTS.GRANTED) {
        return Alert.alert('Permiso denegado', 'Necesitamos acceso a fotos');
      }
    }

    const res = await launchImageLibrary({mediaType: 'photo', quality: 1});
    if (res.didCancel || !res.assets?.length) return;

    const {uri} = res.assets[0];
    setImageUri(uri);
    setLoading(true);

    try {
      
      const {values} = await RNQRGenerator.detect({uri});
      if (!values.length) {
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
      ToastAndroid.show('QR válido', ToastAndroid.SHORT);
    } catch (err) {
      Alert.alert('QR inválido', err.message);
      setPayload(null);
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  };

  
  const goSetPin = () => {
    navigation.navigate(AuthNav.RecoveryUserQrpin, {payload});
  };

  
  return (
    <CSafeAreaViewAuth>
      <CHeader />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={local.main}>
          <CText type="B20" align="center" style={styles.boldText}>
            {String.RecoverywithQR}
          </CText>
          <CText type="B16" align="center">
            {String.recoveryQrSubtitle}
          </CText>

          <UploadCardImage
            label={String.qrimagelabel}
            image={imageUri ? {uri: imageUri} : null}
            setImage={pickImage}
            loading={loading}
          />

          {payload && (
            <CText type="R14" align="center" style={{marginTop: 10}}>
              {String.qrValid}
            </CText>
          )}
        </View>
      </KeyBoardAvoidWrapper>

      <View style={local.footer}>
        <CButton
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

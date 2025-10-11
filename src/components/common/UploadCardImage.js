import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {useSelector} from 'react-redux';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CText from './CText';
import {moderateScale} from '../../common/constants';

async function requestGalleryPermission() {
  if (Platform.OS !== 'android') return true;

    const perms =
    Platform.Version >= 33
      ? [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES]
      : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];

  const result = await PermissionsAndroid.requestMultiple(perms);
  return Object.values(result).every(
    v => v === PermissionsAndroid.RESULTS.GRANTED,
  );
}

export default function UploadCardImage({label, image, setImage, testID}) {
  const colors = useSelector(state => state.theme.theme);

  const selectImage =  async() => {
        const ok = await requestGalleryPermission();
    if (!ok) return;
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      response => {
        if (!response.didCancel && !response.errorCode && response.assets) {
          setImage(response.assets[0]);
        }
      },
    );
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Permiso de cámara',
          message: 'La app necesita acceder a la cámara para tomar fotos.',
          buttonPositive: 'Aceptar',
          buttonNegative: 'Cancelar',
          buttonNeutral: 'Preguntar después',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const takePhoto = async () => {
    const permission = await requestCameraPermission();
    if (!permission) {
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      },
      response => {
        if (response.assets) {
          setImage(response.assets[0]);
        } else if (response.errorCode) {
        }
      },
    );
  };

  return (
    <View style={styles.container}>
      <CText testID={testID ? `${testID}_label` : undefined} type="B16" color={colors.textColor}>
        {label}
      </CText>

      <TouchableOpacity
        testID={testID ? `${testID}_imageBox` : undefined}
        style={[styles.imageBox, {backgroundColor: colors.inputBackground}]}
        onPress={selectImage}>
        {image ? (
          <Image source={{uri: image.uri}} style={styles.image} />
        ) : (
          <Icon name="image-plus" size={40} color={colors.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity testID={testID ? `${testID}_photoButton` : undefined} style={styles.photoButton} onPress={takePhoto}>
        <CText type="R14" color={colors.primary}>
          Tomar foto
        </CText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(20),
  },
  imageBox: {
    height: 150,
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: moderateScale(10),
  },
  image: {
    height: '100%',
    width: '100%',
    borderRadius: moderateScale(10),
  },
  photoButton: {
    alignSelf: 'flex-end',
  },
});

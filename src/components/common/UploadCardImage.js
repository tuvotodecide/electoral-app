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

export default function UploadCardImage({label, image, setImage}) {
  const colors = useSelector(state => state.theme.theme);

  const selectImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
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
      console.warn('Permiso de cámara no concedido');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      },
      response => {
        if (response.assets) {
          setImage(response.assets[0]);
        } else if (response.errorCode) {
          console.warn('Error al abrir la cámara:', response.errorMessage);
        }
      },
    );
  };

  return (
    <View style={styles.container}>
      <CText type="B16" color={colors.textColor}>
        {label}
      </CText>

      <TouchableOpacity
        style={[styles.imageBox, {backgroundColor: colors.inputBackground}]}
        onPress={selectImage}>
        {image ? (
          <Image source={{uri: image.uri}} style={styles.image} />
        ) : (
          <Icon name="image-plus" size={40} color={colors.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
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

import React from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { moderateScale } from '../../common/constants';
import CText from './CText';
import * as ImagePicker from 'expo-image-picker';

export default function UploadCardImage({label, image, setImage, testID, editable = true}) {
  const colors = useSelector(state => state.theme.theme);

  const pickFromGallery =  async() => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setImage(result.assets[0]);
    }
  };

  const requestCameraPermission = async () => {
    const response = await ImagePicker.requestCameraPermissionsAsync();
    return response.granted;
  };

  const pickFromCamera = async () => {
    const permission = await requestCameraPermission();
    if (!permission) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      cameraType: ImagePicker.CameraType.back,
    });

    if (result.assets) {
      setImage(result.assets[0]);
    }
  };

  return (
    <View style={styles.container}>
      <CText testID={testID ? `${testID}_label` : undefined} type="B16" color={colors.textColor}>
        {label}
      </CText>

      <TouchableOpacity
        disabled={!editable}
        testID={testID ? `${testID}_imageBox` : undefined}
        style={[styles.imageBox, {backgroundColor: editable ? colors.inputBackground:colors.grayScale60}]}
        onPress={pickFromCamera}>
        {image ? (
          <Image source={{uri: image.uri}} style={styles.image} />
        ) : (
          <Icon name="camera" size={40} color={editable ? colors.primary : colors.grayScale200} />
        )}
      </TouchableOpacity>

      <TouchableOpacity disabled={!editable} testID={testID ? `${testID}_photoButton` : undefined} style={styles.photoButton} onPress={pickFromGallery}>
        <CText type="R14" color={editable ? colors.primary : colors.grayScale400}>
          Abrir galería
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

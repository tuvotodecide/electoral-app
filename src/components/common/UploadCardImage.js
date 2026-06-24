import React, { useRef, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { moderateScale } from '../../common/constants';
import CText from './CText';
import * as ImagePicker from 'expo-image-picker';

export default function UploadCardImage({label, image, setImage, testID, editable = true}) {
  const colors = useSelector(state => state.theme.theme);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const pickFromGallery = async () => {
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

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }
    setIsCameraReady(false);
    setCameraOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }
    const result = await cameraRef.current.takePictureAsync({
      quality: 0.8,
    });
    setImage({ uri: result.uri });
    setCameraOpen(false);
  };

  return (
    <View style={styles.container}>
      <CText testID={testID ? `${testID}_label` : undefined} type="B16" color={colors.textColor}>
        {label}
      </CText>

      <TouchableOpacity
        disabled={!editable}
        testID={testID ? `${testID}_imageBox` : undefined}
        style={[styles.imageBox, {backgroundColor: editable ? colors.inputBackground : colors.grayScale60}]}
        onPress={openCamera}>
        {image ? (
          <Image source={{uri: image.uri}} style={styles.image} />
        ) : (
          <MaterialCommunityIcons name="camera" size={40} color={editable ? colors.primary : colors.grayScale200} />
        )}
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity disabled={!editable} testID={testID ? `${testID}_photoButton` : undefined} style={styles.photoButton} onPress={pickFromGallery}>
          <CText type="R14" color={editable ? colors.primary : colors.grayScale400}>
            Abrir galería
          </CText>
        </TouchableOpacity>
      )}

      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setIsCameraReady(true)}
          />
          <View style={styles.cameraControls}>
            <TouchableOpacity
              testID={testID ? `${testID}_cancelCamera` : undefined}
              style={styles.cameraButton}
              onPress={() => setCameraOpen(false)}>
              <MaterialCommunityIcons name="close" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              testID={testID ? `${testID}_captureButton` : undefined}
              style={[styles.captureButton, !isCameraReady && styles.captureButtonDisabled]}
              onPress={takePhoto}
              disabled={!isCameraReady}
            />
          </View>
        </View>
      </Modal>
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
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraControls: {
    position: 'absolute',
    bottom: moderateScale(40),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(40),
  },
  cameraButton: {
    padding: moderateScale(10),
  },
  captureButton: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

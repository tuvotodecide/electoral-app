import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { moderateScale } from '../../common/constants';

export default function CameraModal({
  testID,
  cameraOpen,
  setCameraOpen,
  cameraRef,
  isCameraReady,
  setIsCameraReady,
  onTakePhoto,
  facing = 'back'
}) {
  return (
    <Modal
      visible={cameraOpen}
      animationType="slide"
      onRequestClose={() => setCameraOpen(false)}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
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
            onPress={onTakePhoto}
            disabled={!isCameraReady}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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

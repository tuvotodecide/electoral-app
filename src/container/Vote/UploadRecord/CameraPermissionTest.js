import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
} from 'react-native-vision-camera';
import String from '../../../i18n/String';
import {StackNav} from '../../../navigation/NavigationKey';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';

export default function CameraPermissionTest({navigation}) {
  const {hasPermission, requestPermission} = useCameraPermission();
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice || frontDevice;
  const [permissionStatus, setPermissionStatus] = useState('checking');

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('CameraPermissionTest', true);
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await Camera.getCameraPermissionStatus();

      setPermissionStatus(status);
    } catch (error) {

      setPermissionStatus('error');
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission();

      if (granted) {
        setPermissionStatus('granted');
        Alert.alert('Éxito', 'Permisos de cámara concedidos');
      } else {
        setPermissionStatus('denied');
        Alert.alert('Error', 'Permisos de cámara denegados');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al solicitar permisos: ' + error.message);
    }
  };

  const testCamera = () => {
    navigation.navigate(StackNav.CameraScreen);
  };

  return (
    <View testID="cameraPermissionTestContainer" style={styles.container}>
      <Text testID="cameraPermissionTestTitle" style={styles.title}>{String.cameraPermissionTest}</Text>

      <View testID="cameraPermissionTestHasPermissionInfo" style={styles.infoContainer}>
        <Text testID="cameraPermissionTestHasPermissionLabel" style={styles.label}>{String.hookHasPermission}</Text>
        <Text testID="cameraPermissionTestHasPermissionValue" style={styles.value}>{hasPermission ? 'true' : 'false'}</Text>
      </View>

      <View testID="cameraPermissionTestStatusInfo" style={styles.infoContainer}>
        <Text testID="cameraPermissionTestStatusLabel" style={styles.label}>{String.permissionStatus}</Text>
        <Text testID="cameraPermissionTestStatusValue" style={styles.value}>{permissionStatus}</Text>
      </View>

      <View testID="cameraPermissionTestDeviceInfo" style={styles.infoContainer}>
        <Text testID="cameraPermissionTestDeviceLabel" style={styles.label}>{String.cameraDevice}</Text>
        <Text testID="cameraPermissionTestDeviceValue" style={styles.value}>
          {device ? String.available : String.notAvailable}
        </Text>
      </View>

      <View testID="cameraPermissionTestBackCameraInfo" style={styles.infoContainer}>
        <Text testID="cameraPermissionTestBackCameraLabel" style={styles.label}>{String.backCamera}</Text>
        <Text testID="cameraPermissionTestBackCameraValue" style={styles.value}>
          {backDevice ? String.available : String.notAvailable}
        </Text>
      </View>

      <View testID="cameraPermissionTestFrontCameraInfo" style={styles.infoContainer}>
        <Text testID="cameraPermissionTestFrontCameraLabel" style={styles.label}>{String.frontCamera}</Text>
        <Text testID="cameraPermissionTestFrontCameraValue" style={styles.value}>
          {frontDevice ? String.available : String.notAvailable}
        </Text>
      </View>

      <TouchableOpacity testID="cameraPermissionTestCheckButton" style={styles.button} onPress={checkPermissions}>
        <Text testID="cameraPermissionTestCheckButtonText" style={styles.buttonText}>{String.checkPermissions}</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="cameraPermissionTestRequestButton" style={styles.button} onPress={handleRequestPermission}>
        <Text testID="cameraPermissionTestRequestButtonText" style={styles.buttonText}>{String.requestPermissions}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="cameraPermissionTestCameraButton"
        style={[styles.button, !hasPermission && styles.disabledButton]}
        onPress={testCamera}
        disabled={!hasPermission}>
        <Text testID="cameraPermissionTestCameraButtonText" style={styles.buttonText}>Probar Cámara</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="cameraPermissionTestBackButton"
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text testID="cameraPermissionTestBackButtonText" style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#4F9858',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  backButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

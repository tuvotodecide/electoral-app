import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
} from 'react-native-vision-camera';
import String from '../../../i18n/String';
import {StackNav} from '../../../navigation/NavigationKey';

export default function CameraPermissionTest({navigation}) {
  const {hasPermission, requestPermission} = useCameraPermission();
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice || frontDevice;
  const [permissionStatus, setPermissionStatus] = useState('checking');

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
    <View style={styles.container}>
      <Text style={styles.title}>{String.cameraPermissionTest}</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>{String.hookHasPermission}</Text>
        <Text style={styles.value}>{hasPermission ? 'true' : 'false'}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>{String.permissionStatus}</Text>
        <Text style={styles.value}>{permissionStatus}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>{String.cameraDevice}</Text>
        <Text style={styles.value}>
          {device ? String.available : String.notAvailable}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>{String.backCamera}</Text>
        <Text style={styles.value}>
          {backDevice ? String.available : String.notAvailable}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>{String.frontCamera}</Text>
        <Text style={styles.value}>
          {frontDevice ? String.available : String.notAvailable}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkPermissions}>
        <Text style={styles.buttonText}>{String.checkPermissions}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
        <Text style={styles.buttonText}>{String.requestPermissions}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !hasPermission && styles.disabledButton]}
        onPress={testCamera}
        disabled={!hasPermission}>
        <Text style={styles.buttonText}>Probar Cámara</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Volver</Text>
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

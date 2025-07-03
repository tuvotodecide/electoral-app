import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
} from 'react-native-vision-camera';
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
      console.log('Current permission status:', status);
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionStatus('error');
    }
  };

  const handleRequestPermission = async () => {
    try {
      console.log('Requesting camera permission...');
      const granted = await requestPermission();
      console.log('Permission request result:', granted);

      if (granted) {
        setPermissionStatus('granted');
        Alert.alert('Éxito', 'Permisos de cámara concedidos');
      } else {
        setPermissionStatus('denied');
        Alert.alert('Error', 'Permisos de cámara denegados');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Error al solicitar permisos: ' + error.message);
    }
  };

  const testCamera = () => {
    navigation.navigate(StackNav.CameraScreen);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test de Permisos de Cámara</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Hook hasPermission:</Text>
        <Text style={styles.value}>{hasPermission ? 'true' : 'false'}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Permission Status:</Text>
        <Text style={styles.value}>{permissionStatus}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Camera Device:</Text>
        <Text style={styles.value}>
          {device ? 'Available' : 'Not Available'}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Back Camera:</Text>
        <Text style={styles.value}>
          {backDevice ? 'Disponible' : 'No disponible'}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Front Camera:</Text>
        <Text style={styles.value}>
          {frontDevice ? 'Disponible' : 'No disponible'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkPermissions}>
        <Text style={styles.buttonText}>Verificar Permisos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
        <Text style={styles.buttonText}>Solicitar Permisos</Text>
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

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { FirebaseNotificationService } from '../services/FirebaseNotificationService';
import database from '@react-native-firebase/database';

export const FirebaseDebugInfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const userData = useSelector(state => state.wallet.payload);
  const notificationService = new FirebaseNotificationService();

  const loadUserInfo = async () => {
    if (!userData?.address) return;
    
    setLoading(true);
    try {
      // Obtener información del usuario desde Realtime Database
      const userRef = database().ref(`usuarios/${userData.address}`);
      const snapshot = await userRef.once('value');
      const data = snapshot.val();
      
      if (data) {
        setUserInfo({
          userId: userData.address,
          ...data,
          fcmToken: data.fcmToken ? data.fcmToken.substring(0, 20) + '...' : 'No token'
        });
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error cargando info del usuario:', error);
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    }
    setLoading(false);
  };

  const refreshUserData = async () => {
    if (!userData?.address) return;
    
    try {
      const result = await notificationService.initializeUser(userData.address, {
        nombre: userData.nombre || userData.address.substring(0, 8) + '...',
      });
      
      if (result.success) {
        Alert.alert('Éxito', 'Datos del usuario actualizados');
        loadUserInfo();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, [userData]);

  if (!userData?.address) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Firebase Debug Info</Text>
        <Text style={styles.noUser}>No hay usuario autenticado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Debug Info</Text>
      
      <TouchableOpacity style={styles.button} onPress={loadUserInfo} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Cargando...' : 'Recargar Info'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.buttonRefresh} onPress={refreshUserData}>
        <Text style={styles.buttonText}>Actualizar Datos</Text>
      </TouchableOpacity>

      {userInfo ? (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{userInfo.userId.substring(0, 15)}...</Text>
          
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{userInfo.nombre || 'N/A'}</Text>
          
          <Text style={styles.label}>FCM Token:</Text>
          <Text style={styles.value}>{userInfo.fcmToken}</Text>
          
          <Text style={styles.label}>Ubicación:</Text>
          <Text style={styles.value}>
            {userInfo.ubicacion ? 
              `${userInfo.ubicacion.latitude.toFixed(4)}, ${userInfo.ubicacion.longitude.toFixed(4)}` 
              : 'N/A'}
          </Text>
          
          <Text style={styles.label}>Geohash:</Text>
          <Text style={styles.value}>{userInfo.geohash || 'N/A'}</Text>
          
          <Text style={styles.label}>Activo:</Text>
          <Text style={styles.value}>{userInfo.activo ? '✅ Sí' : '❌ No'}</Text>
          
          <Text style={styles.label}>Última actualización:</Text>
          <Text style={styles.value}>
            {userInfo.ultimaActualizacion ? 
              new Date(userInfo.ultimaActualizacion).toLocaleString() 
              : 'N/A'}
          </Text>
        </View>
      ) : (
        <Text style={styles.noData}>No hay datos guardados en Firebase</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2790b0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonRefresh: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  noUser: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

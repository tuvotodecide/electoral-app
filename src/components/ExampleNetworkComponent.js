// Ejemplo de uso de los hooks y utilidades de red
import React from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useNetworkRequest } from '../hooks/useNetworkRequest';
import { validateBackendConnectivity } from '../utils/networkUtils';
import { Http } from '../data/client/http';

const ExampleNetworkComponent = () => {
  const { loading, error, executeRequest, clearError } = useNetworkRequest();

  // Ejemplo de uso con una llamada a API
  const handleApiCall = async () => {
    try {
      const result = await executeRequest(
        () => Http.get('users'), // Tu llamada a la API
        {
          showAlert: true,
          maxRetries: 3,
          requireInternet: true,
        }
      );
      console.log('API call successful:', result);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  // Función para probar conectividad
  const testConnectivity = async () => {
    try {
      const results = await validateBackendConnectivity();
      console.log('Connectivity test results:', results);
      
      results.forEach(result => {
        console.log(`${result.name}: ${result.ok ? 'OK' : 'FAILED'}`);
        if (!result.ok && result.error) {
          console.log(`Error: ${result.error}`);
        }
      });
    } catch (error) {
      console.error('Connectivity test failed:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Network Request Example
      </Text>
      
      {loading && (
        <View style={{ marginBottom: 20 }}>
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      )}
      
      {error && (
        <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#ffebee' }}>
          <Text style={{ color: '#d32f2f' }}>Error: {error.message}</Text>
          <Button title="Clear Error" onPress={clearError} />
        </View>
      )}
      
      <Button 
        title="Test API Call" 
        onPress={handleApiCall}
        disabled={loading}
      />
      
      <View style={{ marginTop: 10 }}>
        <Button 
          title="Test Connectivity" 
          onPress={testConnectivity}
          disabled={loading}
        />
      </View>
    </View>
  );
};

export default ExampleNetworkComponent;

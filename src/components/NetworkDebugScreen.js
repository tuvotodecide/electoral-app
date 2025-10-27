import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { testAllEnvironmentUrls, debugEnvironmentConfig } from '../utils/debugNetwork';
import { validateBackendConnectivity } from '../utils/networkUtils';

const NetworkDebugScreen = ({ onClose }) => {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Debug de configuración
      console.log('=== Running Environment Debug ===');
      debugEnvironmentConfig();

      // Test de URLs
      console.log('=== Testing Environment URLs ===');
      const urlResults = await testAllEnvironmentUrls();

      // Test de conectividad backend
      console.log('=== Testing Backend Connectivity ===');
      const backendResults = await validateBackendConnectivity();

      setResults([
        { type: 'URLs', data: urlResults },
        { type: 'Backend Health', data: backendResults }
      ]);

    } catch (error) {
      console.error('Test failed:', error);
      setResults([{ type: 'Error', data: [{ error: error.message }] }]);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (ok) => {
    return ok ? '#4CAF50' : '#F44336';
  };

  const getStatusText = (ok) => {
    return ok ? 'OK' : 'FAILED';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Debug</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.testButton, testing && styles.testButtonDisabled]} 
        onPress={runAllTests}
        disabled={testing}
      >
        <Text style={styles.testButtonText}>
          {testing ? 'Testing...' : 'Run Network Tests'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.type}</Text>
            {section.data.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>
                    {item.name || `Item ${itemIndex + 1}`}
                  </Text>
                  <Text style={[
                    styles.resultStatus,
                    { color: getStatusColor(item.ok) }
                  ]}>
                    {getStatusText(item.ok)}
                  </Text>
                </View>
                {item.url && (
                  <Text style={styles.resultUrl} numberOfLines={2}>
                    {item.url}
                  </Text>
                )}
                {item.error && (
                  <Text style={styles.resultError}>
                    Error: {item.error}
                  </Text>
                )}
                {item.status && (
                  <Text style={styles.resultDetail}>
                    Status: {item.status}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    bottom: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#2196F3',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultUrl: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultError: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 12,
    color: '#666',
  },
});

export default NetworkDebugScreen;

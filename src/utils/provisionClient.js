import { GATEWAY_BASE } from '@env';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { STORAGE_KEY } from '../common/constants';

export async function fetchProvision({
  mock = true,
  gatewayBase = GATEWAY_BASE,
} = {}) {
  if (!gatewayBase) {
    throw new Error('GATEWAY_BASE no configurado para provisioning');
  }

  const body =
    Platform.OS === 'android'
      ? {
          platform: 'android',
          // En producción: integrityToken + nonce reales de Play Integrity
          // En mock: usa el mismo nonce en ambos
          integrityToken: mock ? `MOCK_OK:bm9uY2VfZGVtby` : '<JWS>',
          nonce: mock ? 'bm9uY2VfZGVtby' : '<nonce_base64url>',
        }
      : {
          platform: 'ios',
          attestationObject: mock ? `MOCK_OK:bm9uY2VfZGVtby` : '<base64>',
          keyId: mock ? 'bW9ja19rZXk=' : '<base64>',
          challenge: mock ? 'bm9uY2VfZGVtby' : '<base64>',
        };

  const { data } = await axios.post(`${gatewayBase}/provision`, body, {
    timeout: 20000,
  });
  // data = { issuer: { adminBase, agentBase, createCredentialPath, ... }, gemini: {...} }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function getProvision() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const data = JSON.parse(raw);
    return data;
  } catch (error) {
    void error;
    return null;
  }
}

export async function ensureProvisioned({
  mock = true,
  gatewayBase = GATEWAY_BASE,
} = {}) {
  try {
    return await fetchProvision({ mock, gatewayBase });
  } catch (error) {
    void error;
    const savedData = await getProvision();
    return savedData || null;
  }
}

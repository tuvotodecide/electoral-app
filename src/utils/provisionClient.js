import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {GATEWAY_BASE} from '@env';
import { STORAGE_KEY } from '../common/constants';

export async function fetchProvision({ mock = true } = {}) {
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

  const { data } = await axios.post(`${GATEWAY_BASE}/provision`, body, {
    timeout: 20000,
  });
  // data = { issuer: { adminBase, agentBase, createCredentialPath, ... }, gemini: {...} }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function getProvision() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function ensureProvisioned({ mock = true } = {}) {
  const have = await getProvision();
  if (have?.issuer?.adminBase) return have;
  return fetchProvision({ mock });
}

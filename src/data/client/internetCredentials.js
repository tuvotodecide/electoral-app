import * as SecureStore from 'expo-secure-store';

async function saveInternetCredentials(server, username, password) {
  const credentials = JSON.stringify({ username, password });
  // Use the server name as the key
  await SecureStore.setItemAsync(server, credentials, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}

async function getInternetCredentials(server) {
  const result = await SecureStore.getItemAsync(server);
  if (result) {
    return JSON.parse(result); // Returns { username, password }
  }
  return null;
}

async function resetInternetCredentials(server) {
  await SecureStore.deleteItemAsync(server);
}

export const InternetCredentials = {
  saveInternetCredentials,
  getInternetCredentials,
  resetInternetCredentials,
};
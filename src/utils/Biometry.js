import ReactNativeBiometrics from 'react-native-biometrics';
const rnBio = new ReactNativeBiometrics();

export async function biometryAvailability() {
  try {
    const response = await rnBio.isSensorAvailable();

    if (!response || typeof response !== 'object') {
      return {available: undefined, biometryType: undefined};
    }

    const {available, biometryType} = response;
    return {available, biometryType};
  } catch (error) {
    throw error;
  }
}

export async function biometricLogin(prompt = 'Autentícate') {
  const promptMessage = prompt === undefined ? 'Autentícate' : prompt;

  try {
    const response = await rnBio.simplePrompt({
      promptMessage,
    });

    if (!response || typeof response !== 'object') {
      return undefined;
    }

    return response.success;
  } catch (error) {
    throw error;
  }
}

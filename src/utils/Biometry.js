
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBio = new ReactNativeBiometrics();


export async function biometryAvailability() {
  const { available, biometryType } = await rnBio.isSensorAvailable();
  return { available, biometryType };
}


export async function biometricLogin(prompt = 'Autentícate') {
  const { success } = await rnBio.simplePrompt({ promptMessage: prompt });
  return success;
}

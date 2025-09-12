/**
 * Mock for react-native-biometrics
 */

export default {
  TouchID: 'TouchID',
  FaceID: 'FaceID',
  Biometrics: 'Biometrics',
  
  isSensorAvailable: jest.fn(() => 
    Promise.resolve({
      available: true,
      biometryType: 'TouchID',
    })
  ),
  
  simplePrompt: jest.fn(() => 
    Promise.resolve({
      success: true,
    })
  ),
  
  createKeys: jest.fn(() => 
    Promise.resolve({
      publicKey: 'mock-public-key',
    })
  ),
  
  biometricKeysExist: jest.fn(() => 
    Promise.resolve({
      keysExist: true,
    })
  ),
  
  deleteKeys: jest.fn(() => 
    Promise.resolve({
      keysDeleted: true,
    })
  ),
  
  createSignature: jest.fn(() => 
    Promise.resolve({
      success: true,
      signature: 'mock-signature',
    })
  ),
};

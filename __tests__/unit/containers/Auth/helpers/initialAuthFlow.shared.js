import {
  createMockSession,
  createPersistentPrivadoExpoClient,
} from '@privado-id/expo-sdk';
import {initialStorageValueGet} from '../../../../../src/utils/AsyncStorage';
import {getDraft} from '../../../../../src/utils/RegisterDraft';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../../../../src/utils/AsyncStorage', () => ({
  initialStorageValueGet: jest.fn(async () => ({themeColor: 'light'})),
  setOnBoarding: jest.fn(async () => undefined),
}));

jest.mock('../../../../../src/utils/RegisterDraft', () => ({
  getDraft: jest.fn(async () => null),
}));

export const configurarMocksFlujoInicial = () => {
  jest.clearAllMocks();

  // Circuitos ya extraídos en la caché: el splash no descarga nada.
  createPersistentPrivadoExpoClient.mockImplementation(async () =>
    createMockSession(),
  );

  initialStorageValueGet.mockResolvedValue({themeColor: 'light'});
  getDraft.mockResolvedValue(null);
  AsyncStorage.getItem.mockResolvedValue(null);
};

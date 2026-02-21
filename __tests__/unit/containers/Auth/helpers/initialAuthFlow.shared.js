import {DeviceEventEmitter} from 'react-native';
import wira, {config as wiraConfig} from 'wira-sdk';
import {initialStorageValueGet} from '../../../../../src/utils/AsyncStorage';
import {getDraft} from '../../../../../src/utils/RegisterDraft';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../../../../src/utils/migrateLegacy', () => ({
  checkLegacyDataExists: jest.fn(async () => false),
}));

jest.mock('../../../../../src/utils/AsyncStorage', () => ({
  initialStorageValueGet: jest.fn(async () => ({themeColor: 'light'})),
  setOnBoarding: jest.fn(async () => undefined),
}));

jest.mock('../../../../../src/utils/RegisterDraft', () => ({
  getDraft: jest.fn(async () => null),
}));

export const configurarMocksFlujoInicial = () => {
  let downloadInfoListener;

  jest.clearAllMocks();

  wira.initWiraSdk.mockResolvedValue(undefined);
  wira.provision.ensureProvisioned.mockResolvedValue(undefined);
  wira.Storage.checkUserData.mockResolvedValue(false);

  DeviceEventEmitter.addListener.mockImplementation((event, callback) => {
    if (event === 'downloadInfo') {
      downloadInfoListener = callback;
    }
    return {remove: jest.fn()};
  });

  wiraConfig.initDownloadCircuits.mockImplementation(async () => {
    downloadInfoListener?.(
      JSON.stringify({
        status: wiraConfig.CircuitDownloadStatus.DONE,
        info: 'ok',
      }),
    );
  });

  initialStorageValueGet.mockResolvedValue({themeColor: 'light'});
  getDraft.mockResolvedValue(null);
  AsyncStorage.getItem.mockResolvedValue(null);
};

const mockMessaging = {
  getToken: jest.fn(),
};

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => mockMessaging;
  return messaging;
});

jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({data: {ok: true}})),
}));

jest.mock('@env', () => ({
  BACKEND: 'https://backend.example/',
}));

jest.mock('../../../src/utils/AsyncStorage', () => ({
  setAsyncStorageData: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../src/utils/Session', () => ({
  getJwt: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

describe('registerDeviceToken', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockMessaging.getToken.mockReset();
  });

  it('guarda token local y lo envia autenticado cuando existe JWT', async () => {
    const axios = require('axios');
    const {setAsyncStorageData} = require('../../../src/utils/AsyncStorage');
    const {getJwt} = require('../../../src/utils/Session');
    const AsyncStorage = require('@react-native-async-storage/async-storage');

    mockMessaging.getToken.mockResolvedValue('fcm-123');
    getJwt.mockResolvedValue('jwt-123');
    AsyncStorage.getItem.mockResolvedValue('did:pending:1');

    const {registerDeviceToken} = require('../../../src/utils/registerDeviceToken');
    await registerDeviceToken();

    expect(setAsyncStorageData).toHaveBeenCalledWith('DEVICE_TOKEN', 'fcm-123');
    expect(axios.post).toHaveBeenCalledWith(
      'https://backend.example/device-token',
      {
        token: 'fcm-123',
        platform: 'ANDROID',
      },
      {
        headers: {
          Authorization: 'Bearer jwt-123',
        },
      },
    );
  });

  it('envia userDid cuando no hay JWT pero si hay DID pendiente', async () => {
    const axios = require('axios');
    const {getJwt} = require('../../../src/utils/Session');
    const AsyncStorage = require('@react-native-async-storage/async-storage');

    mockMessaging.getToken.mockResolvedValue('fcm-456');
    getJwt.mockResolvedValue(null);
    AsyncStorage.getItem.mockResolvedValue('did:pending:2');

    const {registerDeviceToken} = require('../../../src/utils/registerDeviceToken');
    await registerDeviceToken();

    expect(axios.post).toHaveBeenCalledWith(
      'https://backend.example/device-token',
      {
        token: 'fcm-456',
        platform: 'ANDROID',
        userDid: 'did:pending:2',
      },
      {headers: {}},
    );
  });

  it('no intenta registrar si firebase no entrega token', async () => {
    const axios = require('axios');

    mockMessaging.getToken.mockResolvedValue('');

    const {registerDeviceToken} = require('../../../src/utils/registerDeviceToken');
    await registerDeviceToken();

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('no llama backend si faltan tanto JWT como DID', async () => {
    const axios = require('axios');
    const {getJwt} = require('../../../src/utils/Session');
    const AsyncStorage = require('@react-native-async-storage/async-storage');

    mockMessaging.getToken.mockResolvedValue('fcm-789');
    getJwt.mockResolvedValue(null);
    AsyncStorage.getItem.mockResolvedValue(null);

    const {registerDeviceToken} = require('../../../src/utils/registerDeviceToken');
    await registerDeviceToken();

    expect(axios.post).not.toHaveBeenCalled();
  });
});

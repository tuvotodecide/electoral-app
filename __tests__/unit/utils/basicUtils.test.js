import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  trucateAddress,
  truncateDid,
} from '../../../src/utils/Address';
import {
  setOnBoarding,
  initialStorageValueGet,
  setAsyncStorageData,
  getAsyncStorageData,
} from '../../../src/utils/AsyncStorage';
import {getBioFlag, setBioFlag} from '../../../src/utils/BioFlag';
import {cancelTokenSourceWithTimeout} from '../../../src/utils/cancelToken';
import {
  normalizeDni,
  discoverableHashFromDni,
} from '../../../src/utils/idHash';
import {
  getCache,
  setCache,
  isFresh,
  clearCache,
} from '../../../src/utils/lookupCache';
import {
  saveAttestationAvailabilityCache,
  getAttestationAvailabilityCache,
  clearAttestationAvailabilityCache,
} from '../../../src/utils/attestationAvailabilityCache';
import {
  getAttempts,
  incAttempts,
  resetAttempts,
  isLocked,
} from '../../../src/utils/PinAttempts';
import {
  saveDraft,
  getDraft,
  clearDraft,
  jsonSafe,
} from '../../../src/utils/RegisterDraft';
import {getDeviceId} from '../../../src/utils/device-id';
import {
  startSession,
  startLocalSession,
  clearSession,
  isSessionValid,
  getJwt,
  refreshSession,
} from '../../../src/utils/Session';
import {
  setTmpRegister,
  getTmpRegister,
  clearTmpRegister,
  setTmpPin,
  getTmpPin,
  clearTmpPin,
} from '../../../src/utils/TempRegister';
import {
  getInputBackground,
  getBorderColor,
  getSecondaryTextColor,
  getDisableTextColor,
} from '../../../src/utils/ThemeUtils';
import {validateBallotLocally} from '../../../src/utils/ballotValidation';
import {normalizeUri, buildIpfsCandidates} from '../../../src/utils/normalizedUri';
import {
  THEME,
  ON_BOARDING,
  KEY,
  LOCK_KEY,
  JWT_KEY,
  EXPIRES_KEY,
  SESSION,
} from '../../../src/common/constants';

jest.mock('axios', () => ({
  CancelToken: {
    source: jest.fn(() => ({
      cancel: jest.fn(),
      token: 'token',
    })),
  },
}));

describe('utils básicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trunca direcciones y did correctamente', () => {
    expect(trucateAddress('0x1234567890', 3)).toBe('0x123...890');
    expect(truncateDid('did:example:1234567890')).toBe('did:...4567890');
  });

  it('normaliza DNI y calcula hash', () => {
    expect(normalizeDni(' 12 34 ')).toBe('1234');
    const hash = discoverableHashFromDni('1234');
    expect(hash.startsWith('0x')).toBeTruthy();
  });

  it('maneja normalizeUri y candidatos ipfs', () => {
    const cid = 'bafybeigdyrzt2ytv6d6p2k7s7r5z6s2m2m2m2m2m2m2m2m2m2';
    expect(normalizeUri(`ipfs://${cid}`)).toContain('https://ipfs.io/ipfs/');
    expect(normalizeUri('file://a.jpg')).toBe('file://a.jpg');
    expect(buildIpfsCandidates(`ipfs://${cid}`).length).toBeGreaterThan(1);
  });

  it('AsyncStorage helpers: set/get y parse', async () => {
    AsyncStorage.multiGet.mockResolvedValueOnce([
      [THEME, JSON.stringify({dark: true})],
      [ON_BOARDING, JSON.stringify(true)],
    ]);
    const {themeColor, onBoardingValue} = await initialStorageValueGet();
    expect(themeColor).toEqual({dark: true});
    expect(onBoardingValue).toBe(true);

    await setOnBoarding(true);
    await setAsyncStorageData('k', {a: 1});
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({a: 1}));
    const res = await getAsyncStorageData('k');
    expect(res).toEqual({a: 1});
  });

  it('BioFlag guarda y recupera', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('true');
    expect(await getBioFlag()).toBe(true);
    await setBioFlag(false);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('cancelTokenSourceWithTimeout cancela después del timeout', () => {
    jest.useFakeTimers();
    const axios = require('axios');
    const source = cancelTokenSourceWithTimeout(1000);
    expect(source.cancel).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(source.cancel).toHaveBeenCalledWith('timeout_1000');
    jest.useRealTimers();
  });

  it('lookupCache y attestation cache operan sobre AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({data: {x: 1}, syncedAt: Date.now(), version: 'v1'}),
    );
    const entry = await getCache('abc');
    expect(entry?.data).toEqual({x: 1});

    await setCache('abc', {y: 2}, {syncedAt: 10, version: 'v2'});
    expect(AsyncStorage.setItem).toHaveBeenCalled();

    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({data: {}, syncedAt: Date.now(), version: 'v1'}),
    );
    expect(await isFresh('abc', 100000)).toBe(true);

    await clearCache('abc');
    expect(AsyncStorage.removeItem).toHaveBeenCalled();

    await saveAttestationAvailabilityCache('dni', {foo: 'bar'});
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({foo: 'bar'}));
    const cache = await getAttestationAvailabilityCache('dni');
    expect(cache).toEqual({foo: 'bar'});
    await clearAttestationAvailabilityCache('dni');
  });

  it('PinAttempts incrementa, bloquea y libera', async () => {
    AsyncStorage.getItem.mockImplementation(async key => {
      if (key === KEY) return '4';
      if (key === LOCK_KEY) return null;
      return null;
    });
    await incAttempts();
    expect(AsyncStorage.setItem).toHaveBeenCalled();

    AsyncStorage.getItem.mockImplementation(async key => {
      if (key === LOCK_KEY) return String(Date.now() + 10000);
      return null;
    });
    expect(await isLocked()).toBe(true);

    AsyncStorage.getItem.mockImplementation(async key => {
      if (key === LOCK_KEY) return String(Date.now() - 10000);
      return null;
    });
    expect(await isLocked()).toBe(false);
    expect(AsyncStorage.multiRemove).toHaveBeenCalled();

    await resetAttempts();
    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
  });

  it('RegisterDraft guarda, lee y limpia', async () => {
    await saveDraft({a: 1});
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({a: 1}));
    const draft = await getDraft();
    expect(draft).toEqual({a: 1});
    await clearDraft();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
    expect(jsonSafe({a: 1n})).toContain('"1"');
  });

  it('Session crea, valida y limpia', async () => {
    AsyncStorage.getItem.mockImplementation(async key => {
      if (key === JWT_KEY) return null;
      return null;
    });
    await startSession('jwt-test', 1);
    expect(Keychain.setInternetCredentials).toHaveBeenCalled();

    AsyncStorage.getItem.mockImplementation(async key => {
      if (key === SESSION) return '1';
      if (key === EXPIRES_KEY) return String(Date.now() + 60000);
      return null;
    });
    Keychain.getInternetCredentials.mockResolvedValueOnce({password: 'jwt'});
    expect(await isSessionValid()).toBe(true);

    await clearSession();
    expect(Keychain.resetInternetCredentials).toHaveBeenCalled();

    Keychain.getInternetCredentials.mockResolvedValueOnce({password: 'jwt'});
    expect(await getJwt()).toBe('jwt');

    await startLocalSession(1);
    await refreshSession(1);
  });

  it('TempRegister y TempPin guardan y leen', async () => {
    await setTmpRegister({foo: 'bar'});
    Keychain.getGenericPassword.mockResolvedValueOnce({
      password: JSON.stringify({foo: 'bar'}),
    });
    const tmp = await getTmpRegister();
    expect(tmp.foo).toBe('bar');
    await clearTmpRegister();

    await setTmpPin('1234');
    Keychain.getGenericPassword.mockResolvedValueOnce({
      password: JSON.stringify({pin: '1234'}),
    });
    expect(await getTmpPin()).toBe('1234');
    await clearTmpPin();
  });

  it('ThemeUtils devuelve colores correctos', () => {
    const colors = {
      dark: false,
      grayScale800: '#111',
      grayScale600: '#222',
      grayScale400: '#333',
      grayScale200: '#444',
      grayScale700: '#555',
      grayScale300: '#666',
      inputBackground: '#777',
    };
    expect(getInputBackground(colors)).toBe('#777');
    expect(getBorderColor(colors)).toBe('#666');
    expect(getSecondaryTextColor(colors)).toBe('#222');
    expect(getDisableTextColor(colors)).toBe('#555');
  });

  it('valida acta localmente', () => {
    const res = validateBallotLocally(
      [{presidente: 5}],
      [
        {id: 'validos', value1: 5},
        {id: 'blancos', value1: 0},
        {id: 'nulos', value1: 0},
      ],
    );
    expect(res.ok).toBe(true);
  });

  it('genera device id si no existe', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const id = await getDeviceId();
    expect(typeof id).toBe('string');
    expect(id).toContain('-');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});

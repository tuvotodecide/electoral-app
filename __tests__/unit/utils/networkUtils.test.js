jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
  Dimensions: {
    get: jest.fn(() => ({width: 375, height: 667})),
  },
  Image: {
    resolveAssetSource: jest.fn(() => ({uri: 'mock://asset'})),
  },
  NativeModules: {
    IdentityBridge: {
      requestBundle: jest.fn(),
    },
  },
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  exists: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  moveFile: jest.fn(),
}));

jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  encodeFunctionData: jest.fn(() => '0xdata'),
  http: jest.fn(),
  parseEther: jest.fn(() => 100n),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({address: '0xabc'})),
}));

jest.mock('viem/account-abstraction', () => ({
  entryPoint07Address: '0xentry',
  computeAccountAddress: jest.fn(() => '0xpredicted'),
}));

import {
  ensureBundle,
  writeBundleAtomic,
  readBundleFile,
} from '../../../src/utils/ensureBundle';
import {ensureDeposit} from '../../../src/utils/ensureDeposit';
import {predictSmartAccount} from '../../../src/utils/account';

describe('utils de red y bundle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ensureBundle retorna true si existe bundle válido', async () => {
    const RNFS = require('react-native-fs');
    RNFS.exists.mockResolvedValueOnce(true);
    RNFS.stat.mockResolvedValueOnce({size: 10});

    const ok = await ensureBundle();
    expect(ok).toBe(true);
  });

  it('ensureBundle solicita bundle cuando no existe', async () => {
    const RNFS = require('react-native-fs');
    const {NativeModules} = require('react-native');
    RNFS.exists.mockResolvedValueOnce(false);
    NativeModules.IdentityBridge.requestBundle.mockResolvedValueOnce(true);

    const ok = await ensureBundle();
    expect(ok).toBe(true);
    expect(NativeModules.IdentityBridge.requestBundle).toHaveBeenCalled();
  });

  it('writeBundleAtomic y readBundleFile escriben y leen', async () => {
    const RNFS = require('react-native-fs');
    RNFS.stat.mockResolvedValueOnce({size: 10});
    await writeBundleAtomic('{"a":1}');
    expect(RNFS.writeFile).toHaveBeenCalled();
    expect(RNFS.moveFile).toHaveBeenCalled();

    RNFS.exists.mockResolvedValueOnce(true);
    RNFS.readFile.mockResolvedValueOnce('{"a":1}');
    const data = await readBundleFile();
    expect(data).toEqual({a: 1});
  });

  it('ensureDeposit retorna si ya hay depósito', async () => {
    const viem = require('viem');
    const client = {
      readContract: jest.fn(async () => 100n),
      estimateGas: jest.fn(async () => 1n),
      getGasPrice: jest.fn(async () => 1n),
      getBalance: jest.fn(async () => 1000n),
      sendTransaction: jest.fn(async () => '0xhash'),
      waitForTransactionReceipt: jest.fn(async () => ({})),
    };
    viem.createPublicClient.mockReturnValue(client);

    await ensureDeposit('arbitrum-sepolia', '0xpriv', '0xsmart');
    expect(client.sendTransaction).not.toHaveBeenCalled();
  });

  it('ensureDeposit lanza error por balance insuficiente', async () => {
    const viem = require('viem');
    const client = {
      readContract: jest.fn(async () => 0n),
      estimateGas: jest.fn(async () => 1n),
      getGasPrice: jest.fn(async () => 1n),
      getBalance: jest.fn(async () => 0n),
      sendTransaction: jest.fn(async () => '0xhash'),
      waitForTransactionReceipt: jest.fn(async () => ({})),
    };
    viem.createPublicClient.mockReturnValue(client);

    await expect(
      ensureDeposit('arbitrum-sepolia', '0xpriv', '0xsmart'),
    ).rejects.toThrow('Saldo insuficiente');
  });

  it('predictSmartAccount usa salt provisto', () => {
    global.crypto = {
      getRandomValues: jest.fn(arr => arr),
    };
    const out = predictSmartAccount('amoy', '0xpriv', 123n);
    expect(out.address).toBe('0xpredicted');
    expect(out.salt).toBe(123n);
  });
});

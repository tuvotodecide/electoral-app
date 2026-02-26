jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  createWalletClient: jest.fn(),
  encodeFunctionData: jest.fn(() => '0xdata'),
  http: jest.fn(() => ({transport: 'http'})),
  parseEther: jest.fn(() => 100n),
  bytesToHex: jest.fn(() => '0xidhash'),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({address: '0xowner'})),
}));

jest.mock('viem/account-abstraction', () => ({
  entryPoint07Address: '0xentry',
}));

jest.mock('permissionless/accounts', () => ({
  toSimpleSmartAccount: jest.fn(),
}));

jest.mock('permissionless/clients/pimlico', () => ({
  createPimlicoClient: jest.fn(),
}));

jest.mock('permissionless', () => ({
  createSmartAccountClient: jest.fn(),
}));

jest.mock('../../../src/api/params', () => ({
  availableNetworks: {
    testnet: {chain: {id: 1}, bundler: 'https://bundler.example'},
  },
  FACTORY_ADDRESS: '0xfactory',
  sponsorshipPolicyId: 'policy-id',
}));

jest.mock('../../../src/utils/constants', () => ({
  walletConfig: {
    testnet: {chain: {id: 1}},
  },
}));

jest.mock('../../../src/utils/Cifrate', () => ({
  hashIdentifier: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

jest.mock('../../../src/utils/getGuardian', () => ({
  getPredictedGuardian: jest.fn(async () => '0xguardian'),
}));

import {
  depositToEntryPoint,
  fundSmartAccount,
  predictAccount,
  predictWalletAddress,
  registerStreamAndGuardian,
} from '../../../src/utils/walletRegister';

describe('walletRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('predictAccount delega a toSimpleSmartAccount', async () => {
    const {toSimpleSmartAccount} = require('permissionless/accounts');
    toSimpleSmartAccount.mockResolvedValueOnce({address: '0xacc'});

    const client = {id: 'client'};
    const account = await predictAccount(client, '0xfactory', '0xpriv', 1n);
    expect(toSimpleSmartAccount).toHaveBeenCalled();
    expect(account.address).toBe('0xacc');
  });

  it('predictWalletAddress retorna address y salt provisto', async () => {
    const viem = require('viem');
    const {toSimpleSmartAccount} = require('permissionless/accounts');
    viem.createPublicClient.mockReturnValue({id: 'pub'});
    toSimpleSmartAccount.mockResolvedValueOnce({address: '0xpred'});

    const out = await predictWalletAddress('testnet', '0xpriv', 5n);
    expect(out).toEqual({address: '0xpred', salt: 5n});
  });

  it('fundSmartAccount envÃ­a transacciÃ³n', async () => {
    const viem = require('viem');
    const walletClient = {
      sendTransaction: jest.fn(async () => '0xhash'),
    };
    viem.createWalletClient.mockReturnValue(walletClient);

    const hash = await fundSmartAccount(
      'testnet',
      '0xsmart',
      '0xpriv',
      '0.1',
    );
    expect(walletClient.sendTransaction).toHaveBeenCalled();
    expect(hash).toBe('0xhash');
  });

  it('depositToEntryPoint construye transacciÃ³n con gas', async () => {
    const viem = require('viem');
    const walletClient = {
      sendTransaction: jest.fn(async () => '0xdeposit'),
    };
    const publicClient = {
      getGasPrice: jest.fn(async () => 10n),
    };
    viem.createWalletClient.mockReturnValue(walletClient);
    viem.createPublicClient.mockReturnValue(publicClient);

    const hash = await depositToEntryPoint(
      'testnet',
      '0xpriv',
      '0xaccount',
      '0.05',
    );
    expect(walletClient.sendTransaction).toHaveBeenCalled();
    expect(hash).toBe('0xdeposit');
  });

  it('registerStreamAndGuardian retorna receipt y guardian', async () => {
    const viem = require('viem');
    const {toSimpleSmartAccount} = require('permissionless/accounts');
    const {createPimlicoClient} = require('permissionless/clients/pimlico');
    const {createSmartAccountClient} = require('permissionless');
    const {getPredictedGuardian} = require('../../../src/utils/getGuardian');

    viem.createPublicClient.mockReturnValue({
      waitForTransactionReceipt: jest.fn(async () => ({status: 'ok'})),
    });
    toSimpleSmartAccount.mockResolvedValueOnce({address: '0xacc'});
    createPimlicoClient.mockReturnValue({
      getUserOperationGasPrice: jest.fn(async () => ({
        standard: {maxFeePerGas: 1n, maxPriorityFeePerGas: 1n},
      })),
    });
    createSmartAccountClient.mockReturnValue({
      sendTransaction: jest.fn(async () => '0xtx'),
    });

    const result = await registerStreamAndGuardian(
      'testnet',
      1n,
      '0xpriv',
      '123',
      'stream',
    );
    expect(result.guardianAddress).toBe('0xguardian');
    expect(getPredictedGuardian).toHaveBeenCalledWith('testnet', '0xacc', 1n);
  });

  it('registerStreamAndGuardian falla cuando no hay red', async () => {
    await expect(
      registerStreamAndGuardian('missing', 1n, '0xpriv', '123'),
    ).rejects.toThrow('registerStreamOnChain failed');
  });
});

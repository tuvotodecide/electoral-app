jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  getContract: jest.fn(),
  http: jest.fn(() => ({transport: 'http'})),
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

import {executeOperation} from '../../../src/api/account';

describe('api/account executeOperation', () => {
  let publicClient;

  beforeEach(() => {
    jest.clearAllMocks();

    const {createPublicClient} = require('viem');
    const {toSimpleSmartAccount} = require('permissionless/accounts');
    const {createPimlicoClient} = require('permissionless/clients/pimlico');
    const {createSmartAccountClient} = require('permissionless');

    publicClient = {
      waitForTransactionReceipt: jest.fn(),
      getTransactionReceipt: jest.fn(),
      getBlock: jest.fn(async () => ({timestamp: 1n})),
    };

    createPublicClient.mockReturnValue(publicClient);
    toSimpleSmartAccount.mockResolvedValue({address: '0xsmart'});
    createPimlicoClient.mockReturnValue({
      getUserOperationGasPrice: jest.fn(async () => ({
        standard: {maxFeePerGas: 1n, maxPriorityFeePerGas: 1n},
      })),
    });
    createSmartAccountClient.mockReturnValue({
      sendTransaction: jest.fn(async () => '0xtx'),
    });
  });

  it('usa fallback getTransactionReceipt cuando waitForTransactionReceipt vence', async () => {
    const timeoutError = new Error('Timed out while waiting for transaction');
    timeoutError.name = 'WaitForTransactionReceiptTimeoutError';
    publicClient.waitForTransactionReceipt.mockRejectedValue(timeoutError);
    publicClient.getTransactionReceipt.mockResolvedValue({
      blockNumber: 10n,
      transactionHash: '0xtx',
    });

    const waitEvent = jest.fn(async () => ({ok: true}));
    const result = await executeOperation(
      '0xpriv',
      '0xaddr',
      'testnet',
      {to: '0xabc', data: '0x123'},
      waitEvent,
      'Attested',
    );

    expect(publicClient.getTransactionReceipt).toHaveBeenCalledWith({
      hash: '0xtx',
    });
    expect(waitEvent).toHaveBeenCalledWith('testnet', 'Attested', 10n);
    expect(result.receipt.transactionHash).toBe('0xtx');
  });

  it('propaga timeout NETWORK_TIMEOUT si tampoco existe receipt', async () => {
    const timeoutError = new Error('Timed out while waiting for transaction');
    timeoutError.name = 'WaitForTransactionReceiptTimeoutError';
    publicClient.waitForTransactionReceipt.mockRejectedValue(timeoutError);
    publicClient.getTransactionReceipt.mockRejectedValue(new Error('not found'));

    await expect(
      executeOperation('0xpriv', '0xaddr', 'testnet', {
        to: '0xabc',
        data: '0x123',
      }),
    ).rejects.toMatchObject({
      name: 'WaitForTransactionReceiptTimeoutError',
      errorType: 'NETWORK_TIMEOUT',
      txHash: '0xtx',
    });
  });
});

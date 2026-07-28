import {
  executeOperation,
  sendOperationWithUserOpHash,
} from '../../../src/api/account';

jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  getContract: jest.fn(),
  http: jest.fn(() => ({transport: 'http'})),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({address: '0xowner'})),
}));

jest.mock('viem/account-abstraction', () => ({
  entryPoint06Address: '0xentry06',
  toCoinbaseSmartAccount: jest.fn(),
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

describe('api/account executeOperation', () => {
  let publicClient;

  beforeEach(() => {
    jest.clearAllMocks();

    const {createPublicClient} = require('viem');
    const {toCoinbaseSmartAccount} = require('viem/account-abstraction');
    const {createPimlicoClient} = require('permissionless/clients/pimlico');
    const {createSmartAccountClient} = require('permissionless');

    publicClient = {
      waitForTransactionReceipt: jest.fn(),
      getTransactionReceipt: jest.fn(),
      getBlock: jest.fn(async () => ({timestamp: 1n})),
    };

    createPublicClient.mockReturnValue(publicClient);
    toCoinbaseSmartAccount.mockResolvedValue({
      address: '0xsmart',
      entryPoint: {address: '0xentry06', version: '0.6'},
    });
    createPimlicoClient.mockReturnValue({
      getUserOperationGasPrice: jest.fn(async () => ({
        standard: {maxFeePerGas: 1n, maxPriorityFeePerGas: 1n},
      })),
    });
    createSmartAccountClient.mockReturnValue({
      sendTransaction: jest.fn(async () => '0xtx'),
      sendUserOperation: jest.fn(async () => '0xuserop'),
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

  it('devuelve userOpHash sin esperar receipt para publicacion oficial', async () => {
    const {createSmartAccountClient} = require('permissionless');
    const smartClient = {
      sendTransaction: jest.fn(async () => '0xtx'),
      sendUserOperation: jest.fn(async () => '0xuserop'),
    };
    createSmartAccountClient.mockReturnValueOnce(smartClient);

    const result = await sendOperationWithUserOpHash(
      '0xpriv',
      '0xsmart',
      'testnet',
      {to: '0xabc', value: '0', data: '0x123'},
    );

    expect(smartClient.sendUserOperation).toHaveBeenCalledWith({
      calls: [{to: '0xabc', value: 0n, data: '0x123'}],
    });
    expect(publicClient.waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(result).toEqual({
      userOpHash: '0xuserop',
      smartAccountAddress: '0xsmart',
      entryPointAddress: '0xentry06',
      entryPointVersion: '0.6',
    });
  });

  it('envia batch de publicacion oficial conservando orden de llamadas', async () => {
    const {createSmartAccountClient} = require('permissionless');
    const smartClient = {
      sendTransaction: jest.fn(async () => '0xtx'),
      sendUserOperation: jest.fn(async () => '0xuserop'),
    };
    createSmartAccountClient.mockReturnValueOnce(smartClient);

    await sendOperationWithUserOpHash(
      '0xpriv',
      '0xsmart',
      'testnet',
      [
        {to: '0xtoken', value: '0', data: '0xapprove'},
        {to: '0xvote', value: '0', data: '0xcreatevote'},
      ],
    );

    expect(smartClient.sendUserOperation).toHaveBeenCalledWith({
      calls: [
        {to: '0xtoken', value: 0n, data: '0xapprove'},
        {to: '0xvote', value: 0n, data: '0xcreatevote'},
      ],
    });
  });
});

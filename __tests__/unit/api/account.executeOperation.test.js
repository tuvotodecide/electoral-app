import {
  IdentityApiError,
  UserOperationReceiptError,
  createMockSession,
} from '@privado-id/expo-sdk';
import {
  executeOperation,
  sendOperationWithUserOpHash,
} from '../../../src/api/account';
import {getPrivadoClient} from '../../../src/services/privado/privadoSession';

jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  getContract: jest.fn(),
  http: jest.fn(() => ({transport: 'http'})),
}));

jest.mock('../../../src/api/params', () => ({
  availableNetworks: {
    testnet: {chain: {id: 84532}},
    othernet: {chain: {id: 1}},
  },
  getReadRpcUrl: jest.fn(chain => (chain?.id === 84532 ? 'https://rpc.example' : undefined)),
}));

jest.mock('../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

const SMART = '0x00000000000000000000000000000000000000aa';
const USER_OP_HASH = `0x${'cd'.repeat(32)}`;
const TX_HASH = `0x${'ab'.repeat(32)}`;

describe('api/account (SDK de Privado ID)', () => {
  let client;
  let onChainZk;
  let publicClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = createMockSession().client;
    client.getHolderDid.mockResolvedValue({
      did: 'did:iden3:base:sepolia:holder',
      wallet: {address: SMART},
    });
    onChainZk = client.onChainZk;
    getPrivadoClient.mockResolvedValue(client);

    const {createPublicClient} = require('viem');
    publicClient = {getBlock: jest.fn(async () => ({timestamp: 1n}))};
    createPublicClient.mockReturnValue(publicClient);
  });

  describe('executeOperation', () => {
    it('envía la llamada desde la smart wallet, espera el recibo y lee el evento', async () => {
      const waitEvent = jest.fn(async () => ({recordId: 7n}));

      const result = await executeOperation(
        SMART,
        'testnet',
        {to: '0xoracle', data: '0x123', value: 0n},
        waitEvent,
        'Attested',
      );

      expect(onChainZk.sendHolderUserOperation).toHaveBeenCalledWith({
        calls: [{to: '0xoracle', data: '0x123', value: 0n}],
      });
      expect(onChainZk.waitForUserOperationReceipt).toHaveBeenCalledWith({
        userOperationHash: USER_OP_HASH,
        timeoutMs: 15 * 60 * 1000,
      });
      expect(waitEvent).toHaveBeenCalledWith('testnet', 'Attested', 16n);
      expect(publicClient.getBlock).toHaveBeenCalledWith({blockNumber: 16n});
      // El bloque se lee por el RPC de la red del SDK, no por un bundler.
      expect(require('viem').http).toHaveBeenCalledWith('https://rpc.example');
      expect(result).toEqual({
        returnData: {recordId: 7n},
        receipt: {transactionHash: TX_HASH, blockNumber: 16n},
        userOpHash: USER_OP_HASH,
        date: new Date(1000).toLocaleString(),
      });
    });

    it('si la espera vence, vuelve a consultar el recibo una vez', async () => {
      onChainZk.waitForUserOperationReceipt.mockRejectedValueOnce(
        new UserOperationReceiptError(USER_OP_HASH, true),
      );

      const result = await executeOperation(SMART, 'testnet', {to: '0xoracle', data: '0x1'});

      expect(onChainZk.waitForUserOperationReceipt).toHaveBeenCalledTimes(2);
      expect(onChainZk.waitForUserOperationReceipt).toHaveBeenLastCalledWith({
        userOperationHash: USER_OP_HASH,
        timeoutMs: 10 * 1000,
      });
      expect(result.receipt.transactionHash).toBe(TX_HASH);
      expect(onChainZk.sendHolderUserOperation).toHaveBeenCalledTimes(1);
    });

    it('sin recibo tras la segunda consulta lanza NETWORK_TIMEOUT con el hash', async () => {
      onChainZk.waitForUserOperationReceipt.mockRejectedValue(
        new UserOperationReceiptError(USER_OP_HASH, true),
      );

      await expect(
        executeOperation(SMART, 'testnet', {to: '0xoracle', data: '0x1'}),
      ).rejects.toMatchObject({
        name: 'WaitForTransactionReceiptTimeoutError',
        errorType: 'NETWORK_TIMEOUT',
        userOpHash: USER_OP_HASH,
      });
    });

    it('una operación incluida pero revertida es un error', async () => {
      onChainZk.waitForUserOperationReceipt.mockResolvedValueOnce({
        sender: SMART,
        userOperationHash: USER_OP_HASH,
        transactionHash: TX_HASH,
        success: false,
        blockNumber: '16',
      });
      const waitEvent = jest.fn();

      await expect(
        executeOperation(SMART, 'testnet', {to: '0xoracle', data: '0x1'}, waitEvent, 'Attested'),
      ).rejects.toMatchObject({
        code: 'USER_OPERATION_REVERTED',
        userOpHash: USER_OP_HASH,
        txHash: TX_HASH,
      });
      expect(waitEvent).not.toHaveBeenCalled();
    });

    it('un 403 del proxy (cuenta sin registro) queda como AUTH para la cola', async () => {
      onChainZk.sendHolderUserOperation.mockRejectedValueOnce(
        new IdentityApiError('La cuenta no está registrada', 403, 'paymaster/rpc'),
      );

      await expect(
        executeOperation(SMART, 'testnet', {to: '0xoracle', data: '0x1'}),
      ).rejects.toMatchObject({status: 403, errorType: 'AUTH'});
    });

    it('rechaza otra cuenta u otra red sin enviar nada', async () => {
      await expect(
        executeOperation('0x00000000000000000000000000000000000000bb', 'testnet', {
          to: '0xoracle',
          data: '0x1',
        }),
      ).rejects.toThrow('La operación debe enviarse desde la cuenta de este dispositivo.');
      await expect(
        executeOperation(SMART, 'othernet', {to: '0xoracle', data: '0x1'}),
      ).rejects.toThrow(/no es la del SDK/);
      expect(onChainZk.sendHolderUserOperation).not.toHaveBeenCalled();
    });

    it('acepta la dirección sin distinguir mayúsculas', async () => {
      await executeOperation(SMART.toUpperCase().replace('0X', '0x'), 'testnet', {
        to: '0xoracle',
        data: '0x1',
      });
      expect(onChainZk.sendHolderUserOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendOperationWithUserOpHash', () => {
    it('devuelve el userOpHash sin esperar el recibo', async () => {
      const result = await sendOperationWithUserOpHash(SMART, 'testnet', {
        to: '0xabc',
        value: '0',
        data: '0x123',
      });

      expect(onChainZk.sendHolderUserOperation).toHaveBeenCalledWith({
        calls: [{to: '0xabc', value: 0n, data: '0x123'}],
        simulate: false,
      });
      expect(onChainZk.waitForUserOperationReceipt).not.toHaveBeenCalled();
      expect(result).toEqual({userOpHash: USER_OP_HASH, smartAccountAddress: SMART});
    });

    it('envía el lote de la publicación oficial en orden y sin simular (approve antes de createVote)', async () => {
      await sendOperationWithUserOpHash(SMART, 'testnet', [
        {to: '0xtoken', value: '0', data: '0xapprove'},
        {to: '0xvote', value: '0', data: '0xcreatevote'},
      ]);

      expect(onChainZk.sendHolderUserOperation).toHaveBeenCalledWith({
        calls: [
          {to: '0xtoken', value: 0n, data: '0xapprove'},
          {to: '0xvote', value: 0n, data: '0xcreatevote'},
        ],
        simulate: false,
      });
    });

    it('exige que la cuenta asignada sea la smart wallet del dispositivo', async () => {
      await expect(
        sendOperationWithUserOpHash('0x00000000000000000000000000000000000000bb', 'testnet', {
          to: '0xabc',
          data: '0x1',
        }),
      ).rejects.toThrow('La operación debe enviarse desde la cuenta de este dispositivo.');
      expect(onChainZk.sendHolderUserOperation).not.toHaveBeenCalled();
    });
  });
});

jest.mock('../../../src/utils/pinataService', () => ({}));
jest.mock('../../../src/api/oracle', () => ({
  oracleCalls: {},
  oracleReads: {isUserJury: jest.fn(async () => false)},
}));
jest.mock('../../../src/api/params', () => ({availableNetworks: {}}));
jest.mock('../../../src/utils/persistLocalImage', () => ({
  removePersistedImage: jest.fn(),
}));
jest.mock('../../../src/api/account', () => ({executeOperation: jest.fn()}));
jest.mock('../../../src/notifications', () => ({
  showActaDuplicateNotification: jest.fn(),
  showLocalNotification: jest.fn(),
}));
jest.mock('../../../src/services/pushPermission', () => ({
  requestPushPermissionExplicit: jest.fn(),
}));
jest.mock('../../../src/config/sentry', () => ({
  captureError: jest.fn(),
  addBlockchainBreadcrumb: jest.fn(),
}));
jest.mock('../../../src/utils/worksheetLocalStatus', () => ({
  WorksheetStatus: {PENDING: 'PENDING', FAILED: 'FAILED'},
  getWorksheetLocalStatus: jest.fn(),
  upsertWorksheetLocalStatus: jest.fn(),
}));
jest.mock('../../../src/utils/offlineQueue', () => ({
  enqueue: jest.fn(),
  updateById: jest.fn(),
}));
jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://backend.example',
  CHAIN: 'testnet',
  VERIFIER_REQUEST_ENDPOINT: 'https://verifier.example',
}));
jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(async () => true),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

import axios from 'axios';
import {oracleReads} from '../../../src/api/oracle';
import {syncActaBackendHandler} from '../../../src/utils/offlineQueueHandler';

describe('offlineQueueHandler syncActaBackendHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lanza error terminal cuando falta ipfsUri', async () => {
    await expect(
      syncActaBackendHandler({task: {payload: {recordId: 'r1'}}}, {}),
    ).rejects.toMatchObject({
      errorType: 'BUSINESS_TERMINAL',
      removeFromQueue: true,
    });
  });

  it('sincroniza acta y atestaciÃ³n', async () => {
    axios.get.mockResolvedValueOnce({
      data: {apiKey: 'k1', request: {nonce: 'n1'}},
    });
    axios.post
      .mockResolvedValueOnce({data: {_id: 'ballot1'}})
      .mockResolvedValueOnce({data: {ok: true}});

    const result = await syncActaBackendHandler(
      {
        task: {
          payload: {
            ipfsUri: 'ipfs://cid',
            recordId: 'rec-1',
            tableCode: 'A-1',
            dni: '123',
          },
        },
      },
      {did: 'did:1', privKey: '0xpriv', account: '0xacc'},
    );

    expect(result).toEqual({success: true, backendBallotId: 'ballot1'});
    expect(oracleReads.isUserJury).toHaveBeenCalledWith('testnet', '0xacc');
  });

  it('reintenta cuando backend responde 409', async () => {
    axios.get
      .mockResolvedValueOnce({data: {apiKey: 'k1', request: {nonce: 'n1'}}})
      .mockResolvedValueOnce({data: [{_id: 'ballot2', createdAt: '2024-01-01'}]});

    axios.post
      .mockRejectedValueOnce({response: {status: 409}})
      .mockResolvedValueOnce({data: {ok: true}});

    const result = await syncActaBackendHandler(
      {
        task: {
          payload: {
            ipfsUri: 'ipfs://cid',
            recordId: 'rec-1',
            tableCode: 'A-1',
            dni: '123',
            electionId: 'e1',
          },
        },
      },
      {did: 'did:1', privKey: '0xpriv', account: '0xacc'},
    );

    expect(result).toEqual({success: true, backendBallotId: 'ballot2'});
  });
});

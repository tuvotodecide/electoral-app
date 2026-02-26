jest.mock('../../../src/utils/pinataService', () => ({
  uploadElectoralActComplete: jest.fn(),
}));
jest.mock('../../../src/api/oracle', () => ({oracleCalls: {}, oracleReads: {}}));
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
  WorksheetStatus: {PENDING: 'PENDING', FAILED: 'FAILED', UPLOADED: 'UPLOADED'},
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
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(async () => true),
}));

import axios from 'axios';
import pinataService from '../../../src/utils/pinataService';
import {removePersistedImage} from '../../../src/utils/persistLocalImage';
import {showLocalNotification} from '../../../src/notifications';
import {upsertWorksheetLocalStatus} from '../../../src/utils/worksheetLocalStatus';
import {publishWorksheetHandler} from '../../../src/utils/offlineQueueHandler';

const basePayload = {
  imageUri: 'file:///tmp/worksheet.jpg',
  electoralData: {
    partyResults: [{partido: 'A', presidente: 1}],
    voteSummaryResults: [
      {id: 'validos', value1: 1},
      {id: 'blancos', value1: 0},
      {id: 'nulos', value1: 0},
    ],
  },
  additionalData: {
    dni: '123',
    electionId: 'e1',
    tableCode: 'A-1',
    tableNumber: '1',
    locationId: 'loc-1',
  },
  tableData: {codigo: 'A-1', tableNumber: '1'},
};

const baseUser = {did: 'did:1', privKey: '0xpriv', dni: '123'};

const setupAxiosForWorksheet = ({ballots = [], postError = null} = {}) => {
  axios.get.mockImplementation(url => {
    if (String(url).includes('verifier.example')) {
      return Promise.resolve({data: {apiKey: 'k1', request: {nonce: 'n1'}}});
    }
    if (String(url).includes('/ballots/by-table/')) {
      return Promise.resolve({data: ballots});
    }
    return Promise.resolve({data: []});
  });

  if (postError) {
    axios.post.mockRejectedValueOnce(postError);
    return;
  }

  axios.post.mockResolvedValueOnce({
    data: {ipfsUri: 'ipfs://json', nftLink: 'ipfs://nft'},
  });
};

describe('offlineQueueHandler publishWorksheetHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lanza error y registra estado si faltan campos', async () => {
    const item = {
      task: {
        payload: {
          additionalData: {electionId: 'e1', tableCode: 'A-1'},
        },
      },
    };
    await expect(publishWorksheetHandler(item, {dni: '123'})).rejects.toThrow(
      'Faltan datos obligatorios',
    );
    expect(upsertWorksheetLocalStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        dni: '123',
        electionId: 'e1',
        tableCode: 'A-1',
      }),
      expect.objectContaining({
        status: 'FAILED',
      }),
    );
  });

  it('sube hoja de trabajo y actualiza estado', async () => {
    setupAxiosForWorksheet({ballots: []});
    pinataService.uploadElectoralActComplete.mockResolvedValueOnce({
      success: true,
      data: {jsonUrl: 'ipfs://json', imageUrl: 'ipfs://img'},
    });

    const result = await publishWorksheetHandler(
      {task: {payload: basePayload}},
      baseUser,
    );

    expect(result.success).toBe(true);
    expect(upsertWorksheetLocalStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        dni: '123',
        electionId: 'e1',
        tableCode: 'A-1',
      }),
      expect.objectContaining({status: 'UPLOADED'}),
    );
    expect(showLocalNotification).toHaveBeenCalled();
    expect(removePersistedImage).toHaveBeenCalled();
  });

  it('marca como subida si backend responde 409 ya fue subida', async () => {
    setupAxiosForWorksheet({
      ballots: [],
      postError: {response: {status: 409, data: 'ya fue subida'}},
    });
    pinataService.uploadElectoralActComplete.mockResolvedValueOnce({
      success: true,
      data: {jsonUrl: 'ipfs://json', imageUrl: 'ipfs://img'},
    });

    const result = await publishWorksheetHandler(
      {task: {payload: basePayload}},
      baseUser,
    );

    expect(result).toEqual({success: true, alreadyUploaded: true});
  });

  it('marca como pendiente si backend responde 409 pendiente', async () => {
    setupAxiosForWorksheet({
      ballots: [],
      postError: {response: {status: 409, data: 'pendiente'}},
    });
    pinataService.uploadElectoralActComplete.mockResolvedValueOnce({
      success: true,
      data: {jsonUrl: 'ipfs://json', imageUrl: 'ipfs://img'},
    });

    const result = await publishWorksheetHandler(
      {task: {payload: basePayload}},
      baseUser,
    );

    expect(result).toEqual({success: true, alreadyPending: true});
  });

  it('bloquea si ya existe acta en la mesa', async () => {
    setupAxiosForWorksheet({ballots: [{_id: 'b1', createdAt: '2024-01-01'}]});

    await expect(
      publishWorksheetHandler({task: {payload: basePayload}}, baseUser),
    ).rejects.toThrow('mesa ya tiene acta');
  });
});

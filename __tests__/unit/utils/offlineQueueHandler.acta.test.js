const oracleCalls = {
  requestRegister: jest.fn(() => 'req-register'),
  attest: jest.fn(() => 'attest'),
  createAttestation: jest.fn(() => 'create-attestation'),
};
const oracleReads = {
  isRegistered: jest.fn(async () => true),
  isUserJury: jest.fn(async () => false),
  waitForOracleEvent: jest.fn(),
};
const availableNetworks = {
  testnet: {
    explorer: 'https://explorer.example/',
    nftExplorer: 'https://nft.example',
    attestationNft: '0xabc',
  },
};

jest.mock('../../../src/utils/pinataService', () => ({
  uploadImageToIPFS: jest.fn(),
  uploadJSONToIPFS: jest.fn(),
  uploadElectoralActComplete: jest.fn(),
  uploadCertificateNFT: jest.fn(),
  checkDuplicateBallot: jest.fn(),
}));
jest.mock('../../../src/api/oracle', () => ({oracleCalls, oracleReads}));
jest.mock('../../../src/api/params', () => ({availableNetworks}));
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
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(async () => true),
}));

import axios from 'axios';
import pinataService from '../../../src/utils/pinataService';
import {executeOperation} from '../../../src/api/account';
import {removePersistedImage} from '../../../src/utils/persistLocalImage';
import {requestPushPermissionExplicit} from '../../../src/services/pushPermission';
import {showActaDuplicateNotification} from '../../../src/notifications';
import {publishActaHandler} from '../../../src/utils/offlineQueueHandler';

const basePayload = {
  imageUri: 'file:///tmp/acta.jpg',
  aiAnalysis: {},
  electoralData: {
    partyResults: [{partido: 'A', presidente: 1}],
    voteSummaryResults: [
      {id: 'validos', value1: 1},
      {id: 'blancos', value1: 0},
      {id: 'nulos', value1: 0},
    ],
  },
  additionalData: {
    tableCode: 'A-1',
    tableNumber: '1',
    locationId: 'loc-1',
    electionId: 'e1',
  },
  tableData: {codigo: 'A-1', tableNumber: '1'},
};

const baseUser = {
  did: 'did:1',
  privKey: '0xpriv',
  account: '0xacc',
  dni: '123',
};

const setupAxiosForActa = ({ballots = [], attestations = []} = {}) => {
  axios.get.mockImplementation(url => {
    if (String(url).includes('verifier.example')) {
      return Promise.resolve({data: {apiKey: 'k1', request: {nonce: 'n1'}}});
    }
    if (String(url).includes('/attestations/by-user/')) {
      return Promise.resolve({data: {data: attestations}});
    }
    if (String(url).includes('/ballots/by-table/')) {
      return Promise.resolve({data: ballots});
    }
    return Promise.resolve({data: []});
  });

  axios.post.mockImplementation(url => {
    if (String(url).includes('/attestations')) {
      return Promise.resolve({data: {ok: true}});
    }
    if (String(url).includes('/participation-nft')) {
      return Promise.resolve({data: {ok: true}});
    }
    if (String(url).includes('/ballots/validate-ballot-data')) {
      return Promise.resolve({data: {ok: true}});
    }
    if (String(url).includes('/ballots/from-ipfs')) {
      return Promise.resolve({data: {_id: 'backend-1'}});
    }
    return Promise.resolve({data: {ok: true}});
  });
};

describe('offlineQueueHandler publishActaHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    oracleReads.isRegistered.mockResolvedValue(true);
    oracleReads.isUserJury.mockResolvedValue(false);
    executeOperation.mockResolvedValue({
      returnData: {recordId: {toString: () => '1'}},
      receipt: {transactionHash: '0xtx'},
    });
  });

  it('lanza error cuando falta tableCode', async () => {
    axios.get.mockResolvedValueOnce({
      data: {apiKey: 'k1', request: {nonce: 'n1'}},
    });

    await expect(
      publishActaHandler(
        {
          task: {payload: {tableData: {tableNumber: '1'}}},
        },
        {did: 'did:1', privKey: '0xpriv'},
      ),
    ).rejects.toThrow('RETRY_LATER_MISSING_TABLECODE');
  });

  it('procesa acta duplicada y sube certificado', async () => {
    setupAxiosForActa();
    pinataService.checkDuplicateBallot.mockResolvedValueOnce({
      exists: true,
      ballot: {_id: 'b1', ipfsUri: 'ipfs://json', image: 'ipfs://img'},
    });
    pinataService.uploadCertificateNFT.mockResolvedValueOnce({
      success: true,
      data: {jsonUrl: 'ipfs://cert-json', imageUrl: 'ipfs://cert-img'},
    });

    const result = await publishActaHandler(
      {
        task: {
          payload: {
            ...basePayload,
            certificateImageUri: 'file:///tmp/cert.png',
          },
        },
      },
      baseUser,
    );

    expect(result.success).toBe(true);
    expect(pinataService.checkDuplicateBallot).toHaveBeenCalled();
    expect(pinataService.uploadCertificateNFT).toHaveBeenCalled();
    expect(removePersistedImage).toHaveBeenCalled();
    expect(requestPushPermissionExplicit).toHaveBeenCalled();
    expect(showActaDuplicateNotification).not.toHaveBeenCalled();
  });

  it('procesa acta con otra existente en la mesa', async () => {
    setupAxiosForActa({
      ballots: [{_id: 'b2', createdAt: '2024-01-01', ipfsUri: 'ipfs://old'}],
    });
    pinataService.checkDuplicateBallot.mockResolvedValueOnce({exists: false});
    pinataService.uploadElectoralActComplete.mockResolvedValueOnce({
      success: true,
      data: {jsonUrl: 'ipfs://json-new', imageUrl: 'ipfs://img-new'},
    });

    const result = await publishActaHandler(
      {task: {payload: basePayload}},
      baseUser,
    );

    expect(result.success).toBe(true);
    expect(pinataService.uploadElectoralActComplete).toHaveBeenCalled();
  });

  it('crea acta nueva cuando no existe en backend', async () => {
    setupAxiosForActa({ballots: []});
    pinataService.checkDuplicateBallot.mockResolvedValueOnce({exists: false});
    pinataService.uploadElectoralActComplete.mockResolvedValueOnce({
      success: true,
      data: {jsonUrl: 'ipfs://json-create', imageUrl: 'ipfs://img-create'},
    });

    const result = await publishActaHandler(
      {task: {payload: basePayload}},
      baseUser,
    );

    expect(result.success).toBe(true);
    expect(oracleCalls.createAttestation).toHaveBeenCalled();
  });
});

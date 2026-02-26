jest.mock('@env', () => ({
  PINATA_API: 'https://pinata.example',
  PINATA_API_KEY: 'k',
  PINATA_API_SECRET: 's',
  PINATA_JWT: 'jwt',
  BACKEND_RESULT: 'https://backend.example',
}));

global.FormData = class FormDataMock {
  constructor() {
    this.parts = [];
  }
  append(key, value) {
    this.parts.push({key, value});
  }
};

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({statusCode: 200}),
  })),
  exists: jest.fn(() => Promise.resolve(true)),
  stat: jest.fn(() => Promise.resolve({size: 123})),
  unlink: jest.fn(() => Promise.resolve()),
}));

import axios from 'axios';
import RNFS from 'react-native-fs';
import pinataService from '../../../src/utils/pinataService';

describe('pinataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  it('checkDuplicateBallot detecta duplicado', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          votes: {
            parties: {
              validVotes: 1,
              nullVotes: 0,
              blankVotes: 0,
              totalVotes: 1,
              partyVotes: [{partyId: 'a', votes: 1}],
            },
          },
        },
      ],
    });

    const voteData = {
      tableNumber: '1',
      votes: {
        parties: {
          validVotes: 1,
          nullVotes: 0,
          blankVotes: 0,
          totalVotes: 1,
          partyVotes: [{partyId: 'a', votes: 1}],
        },
      },
    };

    const result = await pinataService.checkDuplicateBallot(voteData, 'e1');
    expect(result.exists).toBe(true);
    expect(result.ballot).toBeTruthy();
  });

  it('checkDuplicateBallot retorna false en 404', async () => {
    axios.get.mockRejectedValueOnce({response: {status: 404}});
    const result = await pinataService.checkDuplicateBallot({tableNumber: '1', votes: {parties: {partyVotes: []}}});
    expect(result.exists).toBe(false);
  });

  it('uploadImageToIPFS sube y limpia cache cuando es url', async () => {
    axios.post.mockResolvedValueOnce({
      data: {IpfsHash: 'Qm1', PinSize: 10, Timestamp: 'now'},
    });

    const out = await pinataService.uploadImageToIPFS(
      'https://example.com/photo.jpg',
      'photo.jpg',
    );

    expect(RNFS.downloadFile).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      'https://pinata.example/pinning/pinFileToIPFS',
      expect.any(FormData),
      expect.any(Object),
    );
    expect(out.success).toBe(true);
    expect(out.data.gatewayUrl).toContain('https://gateway.pinata.cloud/ipfs/');
    expect(RNFS.unlink).toHaveBeenCalled();
  });

  it('uploadJSONToIPFS retorna error si falla', async () => {
    axios.post.mockRejectedValueOnce({response: {data: {error: 'boom'}}});
    const out = await pinataService.uploadJSONToIPFS({a: 1}, 'a.json');
    expect(out.success).toBe(false);
    expect(out.error).toBe('boom');
  });

  it('uploadElectoralActComplete arma metadata y sube json', async () => {
    jest.spyOn(pinataService, 'uploadImageToIPFS').mockResolvedValueOnce({
      success: true,
      data: {
        ipfsHash: 'QmImg',
        size: 10,
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmImg',
      },
    });
    jest.spyOn(pinataService, 'uploadJSONToIPFS').mockResolvedValueOnce({
      success: true,
      data: {ipfsHash: 'QmJson', gatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmJson'},
    });

    const result = await pinataService.uploadElectoralActComplete(
      'file:///tmp.jpg',
      {table_number: '1'},
      {
        partyResults: [{partido: 'A', presidente: 1}],
        voteSummaryResults: [
          {label: 'Votos VÃ¡lidos', value1: 1},
          {label: 'Votos en Blanco', value1: 0},
          {label: 'Votos Nulos', value1: 0},
        ],
      },
      {tableNumber: '1', tableCode: 'A-1', locationId: 'loc-1'},
    );

    expect(result.success).toBe(true);
    expect(result.data.jsonCID).toBe('QmJson');
  });

  it('downloadToCache falla si status HTTP no es 2xx', async () => {
    RNFS.downloadFile.mockReturnValueOnce({
      promise: Promise.resolve({statusCode: 404}),
    });

    await expect(
      pinataService.downloadToCache('https://example.com/img.jpg', 'img.jpg'),
    ).rejects.toThrow('HTTP 404');
  });

  it('uploadImageToIPFS falla si el archivo no existe', async () => {
    RNFS.exists.mockResolvedValueOnce(false);
    const out = await pinataService.uploadImageToIPFS('/tmp/missing.jpg');
    expect(out.success).toBe(false);
    expect(out.error).toMatch(/no existe/i);
  });

  it('uploadImageToIPFS usa archivo local sin descargar', async () => {
    axios.post.mockResolvedValueOnce({
      data: {IpfsHash: 'Qm2', PinSize: 20, Timestamp: 'now'},
    });

    const out = await pinataService.uploadImageToIPFS('/tmp/local.jpg');
    expect(RNFS.downloadFile).not.toHaveBeenCalled();
    expect(out.success).toBe(true);
  });

  it('checkIPFSStatus devuelve data', async () => {
    axios.get.mockResolvedValueOnce({data: {rows: []}});
    const out = await pinataService.checkIPFSStatus('QmHash');
    expect(out.success).toBe(true);
    expect(out.data).toEqual({rows: []});
  });

  it('checkIPFSStatus devuelve error', async () => {
    axios.get.mockRejectedValueOnce({response: {data: {error: 'boom'}}});
    const out = await pinataService.checkIPFSStatus('QmHash');
    expect(out.success).toBe(false);
    expect(out.error).toBe('boom');
  });

  it('uploadCertificateNFT sube imagen y metadata', async () => {
    jest.spyOn(pinataService, 'uploadImageToIPFS').mockResolvedValueOnce({
      success: true,
      data: {
        ipfsHash: 'QmImg',
        size: 10,
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmImg',
      },
    });
    jest.spyOn(pinataService, 'uploadJSONToIPFS').mockResolvedValueOnce({
      success: true,
      data: {ipfsHash: 'QmJson', gatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmJson'},
    });

    const out = await pinataService.uploadCertificateNFT('/tmp/cert.png', {
      userName: 'Ana',
      tableNumber: '1',
      tableCode: 'A-1',
      location: 'Bolivia',
    });

    expect(out.success).toBe(true);
    expect(out.data.jsonCID).toBe('QmJson');
  });

  it('uploadElectoralActComplete devuelve error si faltan campos', async () => {
    jest.spyOn(pinataService, 'uploadImageToIPFS').mockResolvedValueOnce({
      success: true,
      data: {ipfsHash: 'QmImg', size: 10, gatewayUrl: 'https://gateway/ipfs/QmImg'},
    });

    const out = await pinataService.uploadElectoralActComplete(
      '/tmp/img.jpg',
      {},
      {partyResults: [], voteSummaryResults: []},
      {tableNumber: '1'},
    );

    expect(out.success).toBe(false);
    expect(out.error).toMatch(/tableCode|locationId/i);
  });

  it('helpers de url normalizan', () => {
    expect(pinataService.isHttpUrl('https://a.com')).toBe(true);
    expect(pinataService.isIpfsUrl('ipfs://cid')).toBe(true);
    expect(pinataService.toHttpFromIpfs('ipfs://cid')).toContain('gateway.pinata.cloud/ipfs/cid');
  });
});

import axios from 'axios';
import {
  claimVoteReward,
  fetchVoteRewards,
} from '../../../../src/features/rewards/data/rewardsApi';
import {
  getCredentialForVote,
  listVoteCredentials,
} from '../../../../src/data/credentials';
import {answerVerifierRequest} from '../../../../src/services/privado/verifierProof';
import {
  getOwnVoteInfo,
  getRewardHash,
  getVoteInfo,
  getVoteReward,
  hasReceivedReward,
} from '../../../../src/api/vote';
import {captureError} from '../../../../src/config/sentry';

jest.mock('axios', () => ({get: jest.fn()}));
jest.mock('../../../../src/data/credentials', () => ({
  getCredentialForVote: jest.fn(),
  listVoteCredentials: jest.fn(),
}));
jest.mock('../../../../src/services/privado/verifierProof', () => ({
  answerVerifierRequest: jest.fn(async () => ({httpStatus: 200})),
}));
jest.mock('../../../../src/api/vote', () => ({
  getOwnVoteInfo: jest.fn(),
  getRewardHash: jest.fn((eventId, secret) => `reward:${eventId}:${secret}`),
  getVoteInfo: jest.fn(),
  getVoteReward: jest.fn(),
  hasReceivedReward: jest.fn(),
}));
jest.mock('../../../../src/config/sentry', () => ({captureError: jest.fn()}));
jest.mock('../../../../src/features/demo/demoSession', () => ({
  isDemoActive: jest.fn(() => false),
}));

const ACCOUNT = '0x00000000000000000000000000000000000000aa';
const voteCredential = (eventId, nullifier) => ({
  id: `storage-${eventId}`,
  type: ['VerifiableCredential', 'SelectedVoter'],
  info: {credentialSubject: {eventId, nullifier}},
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('claimVoteReward', () => {
  beforeEach(() => {
    getCredentialForVote.mockResolvedValue(voteCredential('abc1', '7'));
    hasReceivedReward.mockResolvedValue(false);
    axios.get.mockResolvedValue({
      data: {request: {body: {callbackUrl: 'https://verifier.example/claim-reward'}}},
    });
  });

  it('responde al verificador con la credencial de voto y la cuenta como destinataria', async () => {
    await claimVoteReward('abc1', ACCOUNT);

    expect(getCredentialForVote).toHaveBeenCalledWith('abc1');
    expect(getRewardHash).toHaveBeenCalledWith('abc1', '7');
    expect(hasReceivedReward).toHaveBeenCalledWith('abc1', 'reward:abc1:7');
    expect(axios.get).toHaveBeenCalledWith('https://verifier.example/request/claim-reward');
    expect(answerVerifierRequest).toHaveBeenCalledWith(
      {body: {callbackUrl: `https://verifier.example/claim-reward?recipient=${ACCOUNT}`}},
      {credentialId: 'storage-abc1', reason: expect.any(String)},
    );
  });

  it('no vuelve a reclamar una recompensa ya recibida', async () => {
    hasReceivedReward.mockResolvedValue(true);

    await claimVoteReward('abc1', ACCOUNT);

    expect(axios.get).not.toHaveBeenCalled();
    expect(answerVerifierRequest).not.toHaveBeenCalled();
  });

  it('sin credencial de voto falla y lo informa', async () => {
    getCredentialForVote.mockResolvedValue(undefined);

    await expect(claimVoteReward('abc1', ACCOUNT)).rejects.toThrow();
    expect(answerVerifierRequest).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalled();
  });

  it('propaga el rechazo del verificador', async () => {
    const error = new Error('Verifier rejected the response with HTTP 400');
    answerVerifierRequest.mockRejectedValueOnce(error);

    await expect(claimVoteReward('abc1', ACCOUNT)).rejects.toBe(error);
  });
});

describe('fetchVoteRewards', () => {
  const NOW = 2_000_000_000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW * 1000);
    getVoteReward.mockResolvedValue({raw: 10n, formatted: '10'});
    getVoteInfo.mockImplementation(async eventId => ({
      name: `Elección ${eventId}`,
      endDate: eventId === 'abc1' ? NOW - 60 : NOW + 60,
    }));
    getOwnVoteInfo.mockResolvedValue([true, 'option']);
    hasReceivedReward.mockResolvedValue(false);
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  it('arma las recompensas a partir de las credenciales de voto guardadas', async () => {
    listVoteCredentials.mockResolvedValue([
      voteCredential('abc1', '7'),
      voteCredential('abc2', '8'),
    ]);

    const result = await fetchVoteRewards();

    expect(listVoteCredentials).toHaveBeenCalledWith({reason: expect.any(String)});
    expect(result.rewardsAvailable).toBe(true);
    expect(result.data.map(item => [item.id, item.status])).toEqual([
      ['abc1', 'available'],
      ['abc2', 'pending'],
    ]);
  });

  it('ignora credenciales sin eventId o nullifier', async () => {
    listVoteCredentials.mockResolvedValue([
      voteCredential('abc1', '7'),
      {id: 'broken', type: [], info: {credentialSubject: {eventId: 'abc3'}}},
    ]);

    const result = await fetchVoteRewards();

    expect(result.data.map(item => item.id)).toEqual(['abc1']);
    expect(getVoteInfo).not.toHaveBeenCalledWith('abc3');
  });

  it('sin credenciales de voto no hay recompensas', async () => {
    listVoteCredentials.mockResolvedValue([]);

    await expect(fetchVoteRewards()).resolves.toEqual({rewardsAvailable: true, data: []});
  });
});

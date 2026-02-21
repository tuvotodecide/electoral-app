import './jestMocks';

import {
  renderPhotoConfirmation,
  resetMocks,
  pinataService,
  NetInfo,
  validateBallotLocally,
  persistLocalImage,
  enqueue,
  flushPromises,
  act,
  axios,
  executeOperation,
  oracleCalls,
  oracleReads,
  availableNetworks,
  String,
} from './testUtils';
import {fireEvent} from '@testing-library/react-native';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

describe('PhotoConfirmationScreen - Interacciones de Usuario', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMocks();
    validateBallotLocally.mockReturnValue({ok: true});
    pinataService.checkDuplicateBallot.mockResolvedValue({exists: false});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('cuando no hay conexión encola la publicación y muestra finalización local', async () => {
    NetInfo.fetch.mockResolvedValue({isConnected: false, isInternetReachable: false});
    persistLocalImage.mockResolvedValue('file:///persisted.jpg');
    enqueue.mockResolvedValue(undefined);

    const {getAllByText, getByTestId, navigation} = renderPhotoConfirmation();

    await runAutoVerification();

    await act(async () => {
      firePressOnConfirm(getAllByText(String.publishAndCertify));
      await flushPromises();
    });

    await act(async () => {
      jest.runAllTimers();
    });

    await act(async () => {
      await flushPromises();
    });

    expect(persistLocalImage).toHaveBeenCalledWith('file:///acta.jpg');
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'publishActa',
      }),
    );
    expect(getByTestId('photoConfirmationModalFinishedSubtext')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  test('con conexión completa ejecuta el flujo de publicación y certificación', async () => {
    NetInfo.fetch.mockResolvedValue({isConnected: true, isInternetReachable: true});
    pinataService.uploadElectoralActComplete.mockResolvedValue({
      success: true,
      data: {
        jsonUrl: 'https://ipfs/json',
        imageUrl: 'https://ipfs/image',
      },
    });

    axios.post.mockImplementation(async url => {
      if (url.endsWith('/validate-ballot-data')) {
        return {data: true};
      }
      if (url.endsWith('/from-ipfs')) {
        return {data: {_id: 'backend-id'}};
      }
      if (url.endsWith('/attestations')) {
        return {data: {success: true}};
      }
      return {data: {}};
    });

    oracleReads.isUserJury.mockResolvedValue(true);
    oracleReads.isRegistered
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    oracleCalls.requestRegister.mockReturnValue('request-register');
    oracleCalls.createAttestation.mockReturnValue('create-attestation');
    oracleCalls.attest.mockReturnValue('attest');
    oracleReads.waitForOracleEvent.mockResolvedValue(true);
    executeOperation
      .mockResolvedValueOnce({receipt: {transactionHash: '0xreg'}})
      .mockResolvedValueOnce({
        receipt: {transactionHash: '0xatt'},
        returnData: {
          recordId: {
            toString: () => '55',
          },
        },
      });

    const {getAllByText, navigation} = renderPhotoConfirmation();

    await runAutoVerification();

    await act(async () => {
      firePressOnConfirm(getAllByText(String.publishAndCertify));
      await flushPromises();
    });

    const uploadArgs = pinataService.uploadElectoralActComplete.mock.calls[0];
    expect(uploadArgs[0]).toContain('acta.jpg');
    expect(uploadArgs[1]).toEqual(expect.any(Object));
    expect(uploadArgs[2]).toMatchObject({
      partyResults: expect.any(Array),
      voteSummaryResults: expect.any(Array),
    });
  expect(typeof uploadArgs[3].userId).toBe('string');
  expect(typeof uploadArgs[3].userName).toBe('string');

    const validateCall = axios.post.mock.calls.find(([url]) =>
      url.includes('/validate-ballot-data'),
    );
    expect(validateCall).toBeDefined();
    expect(validateCall[1]).toEqual(
      expect.objectContaining({
        ipfsUri: 'https://ipfs/json',
      }),
    );

    expect(executeOperation).toHaveBeenCalledTimes(2);
    expect(executeOperation.mock.calls[1][3]).toBe('create-attestation');
  });
});

const runAutoVerification = async () => {
  await act(async () => {
    jest.runAllTimers();
  });
  await act(async () => {
    await flushPromises();
  });
};

const firePressOnConfirm = buttons => {
  const modalButton = buttons[buttons.length - 1];
  fireEvent.press(modalButton);
};

import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import Splash from '../../../src/container/Splash';

const mockReplace = jest.fn();
const mockNavigate = jest.fn();

const mockWira = {
  initWiraSdk: jest.fn(() => Promise.resolve()),
  provision: {
    ensureProvisioned: jest.fn(() => Promise.resolve()),
  },
};

const mockConfig = {
  CircuitDownloadStatus: {
    DOWNLOADING: 'DOWNLOADING',
    DONE: 'DONE',
    ERROR: 'ERROR',
  },
  initDownloadCircuits: jest.fn(() => Promise.resolve()),
};

jest.mock('wira-sdk', () => ({
  __esModule: true,
  default: mockWira,
  config: mockConfig,
}));

jest.mock('@env', () => ({
  CIRCUITS_URL: 'https://circuits.example',
  GATEWAY_BASE: 'https://gateway.example',
  BACKEND_IDENTITY: 'https://identity.example',
}));

jest.mock('../../../src/utils/AsyncStorage', () => ({
  initialStorageValueGet: jest.fn(async () => null),
}));

jest.mock('../../../src/utils/RegisterDraft', () => ({
  getDraft: jest.fn(async () => null),
}));

describe('Splash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('muestra botÃ³n de retry cuando falla descarga', async () => {
    const {DeviceEventEmitter} = require('react-native');
    const listeners = [];
    DeviceEventEmitter.addListener.mockImplementation((evt, cb) => {
      listeners.push(cb);
      return {remove: jest.fn()};
    });

    const {getByTestId, queryByTestId} = render(
      <Splash navigation={{replace: mockReplace, navigate: mockNavigate}} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(1600);
    });

    await act(async () => {
      const errorPayload = JSON.stringify({
        status: mockConfig.CircuitDownloadStatus.ERROR,
        info: 'fail',
      });
      listeners[listeners.length - 1]?.(errorPayload);
    });

    await waitFor(() =>
      expect(getByTestId('retryDownloadButton')).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(getByTestId('retryDownloadButton'));
    });
    expect(queryByTestId('downloadMessage')).toBeTruthy();
  });
});

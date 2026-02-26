import React from 'react';
import {Text} from 'react-native';
import {render} from '@testing-library/react-native';

jest.mock('../../src/services/notifications', () => ({
  registerBackgroundHandler: jest.fn(),
}));

jest.mock('../../src/redux/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
  persistor: {
    subscribe: jest.fn(),
    getState: jest.fn(),
    dispatch: jest.fn(),
    purge: jest.fn(),
    flush: jest.fn(),
  },
}));

jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({children}) => children,
}));

jest.mock('react-native-paper', () => ({
  PaperProvider: ({children}) => children,
}));

jest.mock('../../src/App', () => {
  const ReactLocal = require('react');
  const {Text: RNText} = require('react-native');
  return () => ReactLocal.createElement(RNText, {testID: 'appRoot'}, 'AppRoot');
});

describe('App.js root wrapper', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('registra el handler en background y renderiza el App', () => {
    const {registerBackgroundHandler} = require('../../src/services/notifications');
    const RNRoot = require('../../App').default;

    const {getByTestId} = render(<RNRoot />);

    expect(registerBackgroundHandler).toHaveBeenCalledTimes(1);
    expect(getByTestId('appRoot')).toBeTruthy();
  });
});

/**
 * Salida del modo demostración desde el perfil.
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';

import Profile from '../../../../../src/container/TabBar/Profile/Profile';
import {exitDemoSession} from '../../../../../src/features/demo/demoLifecycle';
import {
  __resetDemoSessionForTests,
  startDemoSession,
} from '../../../../../src/features/demo/demoSession';
import {mockNavigation, renderWithProviders} from '../../../../setup/test-utils';

jest.mock('../../../../../src/features/demo/demoLifecycle', () => ({
  exitDemoSession: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/Cifrate', () => ({
  getCredentialSubjectFromPayload: jest.fn(() => ({
    fullName: 'Cuenta de demostración',
    nationalIdNumber: '99999999',
  })),
}));

jest.mock('../../../../../src/utils/AsyncStorage', () => ({
  setAsyncStorageData: jest.fn(),
}));

jest.mock('../../../../../src/api/constant', () => ({
  ProfileDataV2: [{section: 'General', data: []}],
}));

// CHash arrastra expo-clipboard, que no está transformado en Jest.
jest.mock('../../../../../src/components/common/CHash', () => {
  const React = require('react');
  const {View} = require('react-native');
  return function MockCHash() {
    return React.createElement(View);
  };
});

// El LogOutModal real fija sus testID, así que las dos instancias del perfil
// colisionarían. El mock los deriva del testID recibido.
jest.mock('../../../../../src/components/modal/LogOutModal', () => {
  const React = require('react');
  const {TouchableOpacity, View} = require('react-native');
  return function MockLogOutModal({testID, visible, onPressLogOut, onPressCancel}) {
    return React.createElement(
      View,
      {testID, visible},
      React.createElement(TouchableOpacity, {
        testID: `${testID}ConfirmButton`,
        onPress: onPressLogOut,
      }),
      React.createElement(TouchableOpacity, {
        testID: `${testID}CancelButton`,
        onPress: onPressCancel,
      }),
    );
  };
});

const renderProfile = () => {
  const navigation = {...mockNavigation, navigate: jest.fn(), reset: jest.fn()};
  const utils = renderWithProviders(<Profile navigation={navigation} />);
  return {navigation, ...utils};
};

describe('Profile · modo demostración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDemoSessionForTests();
  });

  it('no muestra la opción de salir fuera del modo demostración', () => {
    const {queryByTestId} = renderProfile();

    expect(queryByTestId('profileExitDemoItem')).toBeNull();
  });

  it('muestra la opción de salir con el modo demostración activo', async () => {
    await startDemoSession();
    const {getByTestId} = renderProfile();

    expect(getByTestId('profileExitDemoItem')).toBeTruthy();
  });

  it('pide confirmación antes de salir', async () => {
    await startDemoSession();
    const {getByTestId} = renderProfile();

    fireEvent.press(getByTestId('profileExitDemoItem'));

    expect(getByTestId('profileExitDemoModal').props.visible).toBe(true);
    expect(exitDemoSession).not.toHaveBeenCalled();
  });

  it('al confirmar llama a exitDemoSession con la navegación', async () => {
    await startDemoSession();
    const {getByTestId, navigation} = renderProfile();

    fireEvent.press(getByTestId('profileExitDemoItem'));
    fireEvent.press(getByTestId('profileExitDemoModalConfirmButton'));

    await waitFor(() => {
      expect(exitDemoSession).toHaveBeenCalledWith(navigation);
    });
  });
});

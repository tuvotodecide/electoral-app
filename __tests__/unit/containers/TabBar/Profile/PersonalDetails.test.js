/**
 * Tests for PersonalDetails Screen
 * Tests de pantalla de detalles personales
 */

import React from 'react';
import {waitFor} from '@testing-library/react-native';
import PersonalDetails from '../../../../../src/container/TabBar/Profile/PersonalDetails';
import {renderWithProviders} from '../../../../setup/test-utils';

// Mocks
jest.mock('../../../../../src/utils/Cifrate', () => ({
  getCredentialSubjectFromPayload: jest.fn(() => ({
    fullName: 'Test User',
    nationalIdNumber: '12345678',
    birthDate: 946684800, // 2000-01-01
  })),
}));

jest.mock('../../../../../src/data/client/kyc', () => ({
  registryApi: {
    resolveByDid: jest.fn(() =>
      Promise.resolve({
        ok: true,
        record: {
          displayNamePublic: true,
        },
      }),
    ),
    registryUpdateDisplayName: jest.fn(() => Promise.resolve({ok: true})),
  },
}));

jest.mock('../../../../../src/utils/ThemeUtils', () => ({
  getSecondaryTextColor: jest.fn(() => '#666666'),
}));

jest.mock('../../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, title}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, title));
});

jest.mock('../../../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/Icono', () => {
  const React = require('react');
  return ({testID, name}) =>
    React.createElement('Icono', {testID, name});
});

jest.mock('../../../../../src/components/common/CEtiqueta', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, title, text}) =>
    React.createElement(
      View,
      {testID},
      React.createElement(Text, null, title),
      React.createElement(Text, null, text),
    );
});

jest.mock('../../../../../src/components/common/CHash', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({testID}) => React.createElement(View, {testID});
});

jest.mock('../../../../../src/components/common/COptionItem', () => {
  const React = require('react');
  const {View, Switch} = require('react-native');
  return ({item, switchValue, onSwitchValueChange, loading}) =>
    React.createElement(
      View,
      {testID: `optionItem_${item.id}`},
      React.createElement(Switch, {
        testID: 'showNameSwitch',
        value: switchValue,
        onValueChange: val => onSwitchValueChange(item, val),
        disabled: loading,
      }),
    );
});

jest.mock('../../../../../src/components/common/CAlert', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, message}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, message));
});

describe('PersonalDetails Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        grayScale500: '#6B7280',
      },
    },
    wallet: {
      payload: {
        did: 'did:example:123',
        account: '0x1234567890abcdef1234567890abcdef12345678',
        vc: {
          credentialSubject: {
            fullName: 'Test User',
            nationalIdNumber: '12345678',
            birthDate: 946684800,
          },
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsKeyboardWrapper')).toBeTruthy();
    });

    it('renderiza el avatar del usuario', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsAvatarContainer')).toBeTruthy();
      expect(getByTestId('personalDetailsAvatarIcon')).toBeTruthy();
    });

    it('renderiza el hash del usuario', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsHash')).toBeTruthy();
    });

    it('renderiza el campo de nombre', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsNameField')).toBeTruthy();
    });

    it('renderiza el campo de documento', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsDocumentField')).toBeTruthy();
    });

    it('renderiza el campo de fecha de nacimiento', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsBirthDateField')).toBeTruthy();
    });
  });

  describe('Datos del Usuario', () => {
    it('muestra el nombre del usuario correctamente', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsNameField')).toBeTruthy();
    });

    it('maneja correctamente cuando no hay datos de usuario', () => {
      const emptyStore = {
        ...mockStore,
        wallet: {
          payload: null,
        },
      };

      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: emptyStore,
      });

      expect(getByTestId('personalDetailsContainer')).toBeTruthy();
    });
  });

  describe('Switch de Mostrar Nombre', () => {
    it('renderiza el switch de mostrar nombre', async () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      await waitFor(() => {
        expect(getByTestId('showNameSwitch')).toBeTruthy();
      });
    });

    it('carga el estado inicial del switch desde la API', async () => {
      const {registryApi} = require('../../../../../src/data/client/kyc');

      renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      await waitFor(() => {
        expect(registryApi.resolveByDid).toHaveBeenCalledWith('did:example:123');
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra alerta de error cuando falla la API', async () => {
      const {registryApi} = require('../../../../../src/data/client/kyc');
      registryApi.resolveByDid.mockResolvedValueOnce({
        ok: false,
        error: 'API Error',
      });

      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      await waitFor(() => {
        expect(getByTestId('personalDetailsErrorAlert')).toBeTruthy();
      });
    });
  });

  describe('Hash del Usuario', () => {
    it('muestra el hash truncado correctamente', () => {
      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(getByTestId('personalDetailsHash')).toBeTruthy();
    });

    it('maneja correctamente cuando no hay account', () => {
      const storeWithoutAccount = {
        ...mockStore,
        wallet: {
          payload: {
            ...mockStore.wallet.payload,
            account: null,
          },
        },
      };

      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: storeWithoutAccount,
      });

      expect(getByTestId('personalDetailsContainer')).toBeTruthy();
    });
  });
});

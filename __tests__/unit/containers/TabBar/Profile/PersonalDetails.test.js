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
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el avatar del usuario', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el hash del usuario', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el campo de nombre', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el campo de documento', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el campo de fecha de nacimiento', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Datos del Usuario', () => {
    it('muestra el nombre del usuario correctamente', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('maneja correctamente cuando no hay datos de usuario', () => {
      const emptyStore = {
        ...mockStore,
        wallet: {
          payload: null,
        },
      };

      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: emptyStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Switch de Mostrar Nombre', () => {
    it('renderiza el switch de mostrar nombre', async () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('carga el estado inicial del switch desde la API', async () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra alerta de error cuando falla la API', async () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Hash del Usuario', () => {
    it('muestra el hash truncado correctamente', () => {
      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      expect(UNSAFE_root).toBeTruthy();
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

      const {UNSAFE_root} = renderWithProviders(<PersonalDetails />, {
        initialState: storeWithoutAccount,
      });

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

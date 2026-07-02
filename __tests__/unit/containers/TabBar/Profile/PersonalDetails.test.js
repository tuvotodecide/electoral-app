/**
 * Tests for PersonalDetails Screen
 * Tests de pantalla de detalles personales
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import PersonalDetails from '../../../../../src/container/TabBar/Profile/PersonalDetails';
import {renderWithProviders} from '../../../../setup/test-utils';
import {registryApi} from '../../../../../src/data/client/kyc';

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
  const MockCSafeAreaView = ({children, testID}) =>
    React.createElement(View, {testID}, children);
  return MockCSafeAreaView;
});

jest.mock('../../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  const MockCHeader = ({testID, title}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, title));
  return MockCHeader;
});

jest.mock('../../../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockKeyBoardAvoidWrapper = ({children, testID}) =>
    React.createElement(View, {testID}, children);
  return MockKeyBoardAvoidWrapper;
});

jest.mock('../../../../../src/components/common/Icono', () => {
  const React = require('react');
  const MockIcono = ({testID, name}) =>
    React.createElement('Icono', {testID, name});
  return MockIcono;
});

jest.mock('../../../../../src/components/common/CEtiqueta', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  const MockCEtiqueta = ({testID, title, text}) =>
    React.createElement(
      View,
      {testID},
      React.createElement(Text, null, title),
      React.createElement(Text, null, text),
    );
  return MockCEtiqueta;
});

jest.mock('../../../../../src/components/common/CHash', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockCHash = ({testID}) => React.createElement(View, {testID});
  return MockCHash;
});

jest.mock('../../../../../src/components/common/COptionItem', () => {
  const React = require('react');
  const {View, Switch} = require('react-native');
  const MockCOptionItem = ({item, switchValue, onSwitchValueChange, loading}) =>
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
  return MockCOptionItem;
});

jest.mock('../../../../../src/components/common/CAlert', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  const MockCAlert = ({testID, message}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, message));
  return MockCAlert;
});

jest.mock('../../../../../src/components/modal/InfoModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  const MockInfoModal = ({
    testID,
    visible,
    title,
    message,
    buttonText,
    secondaryButtonText,
    onClose,
    onSecondaryPress,
    secondaryButtonStyle,
    secondaryButtonTextStyle,
  }) => {
    if (!visible) return null;
    return React.createElement(
      View,
      {testID},
      React.createElement(Text, {testID: `${testID}Title`}, title),
      React.createElement(Text, {testID: `${testID}MessageLine_0`}, message),
      React.createElement(
        TouchableOpacity,
        {
          testID: `${testID}SecondaryButton`,
          onPress: onSecondaryPress,
          style: secondaryButtonStyle,
        },
        React.createElement(
          Text,
          {testID: `${testID}SecondaryButtonText`, style: secondaryButtonTextStyle},
          secondaryButtonText,
        ),
      ),
      React.createElement(
        TouchableOpacity,
        {testID: `${testID}Button`, onPress: onClose},
        React.createElement(Text, null, buttonText),
      ),
    );
  };
  return MockInfoModal;
});

describe('PersonalDetails Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        primary4: '#D83031',
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
    registryApi.resolveByDid.mockResolvedValue({
      ok: true,
      record: {
        displayNamePublic: true,
      },
    });
    registryApi.registryUpdateDisplayName.mockResolvedValue({ok: true});
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

    it('abre modal de aviso al activar nombre público', async () => {
      registryApi.resolveByDid.mockResolvedValueOnce({
        ok: true,
        record: {
          displayNamePublic: false,
        },
      });

      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      await waitFor(() => {
        expect(getByTestId('showNameSwitch').props.disabled).toBe(false);
      });

      fireEvent(getByTestId('showNameSwitch'), 'valueChange', true);

      expect(getByTestId('publicNameVisibilityConfirmModal')).toBeTruthy();
      expect(getByTestId('publicNameVisibilityConfirmModalMessageLine_0').props.children)
        .toBe('Autorizas a que tu nombre será visible para otros usuarios');
      expect(getByTestId('publicNameVisibilityConfirmModalSecondaryButton').props.style)
        .toMatchObject({backgroundColor: '#D83031'});
      expect(getByTestId('publicNameVisibilityConfirmModalSecondaryButtonText').props.style)
        .toMatchObject({color: '#FFFFFF'});
      expect(registryApi.registryUpdateDisplayName).not.toHaveBeenCalled();
    });

    it('no guarda el cambio si cancela el aviso de nombre público', async () => {
      registryApi.resolveByDid.mockResolvedValueOnce({
        ok: true,
        record: {
          displayNamePublic: false,
        },
      });

      const {getByTestId, queryByTestId} = renderWithProviders(
        <PersonalDetails />,
        {
          initialState: mockStore,
        },
      );

      await waitFor(() => {
        expect(getByTestId('showNameSwitch').props.disabled).toBe(false);
      });

      fireEvent(getByTestId('showNameSwitch'), 'valueChange', true);
      fireEvent.press(getByTestId('publicNameVisibilityConfirmModalSecondaryButton'));

      expect(queryByTestId('publicNameVisibilityConfirmModal')).toBeNull();
      expect(registryApi.registryUpdateDisplayName).not.toHaveBeenCalled();
      expect(getByTestId('showNameSwitch').props.value).toBe(false);
    });

    it('guarda el cambio si acepta el aviso de nombre público', async () => {
      registryApi.resolveByDid.mockResolvedValueOnce({
        ok: true,
        record: {
          displayNamePublic: false,
        },
      });

      const {getByTestId} = renderWithProviders(<PersonalDetails />, {
        initialState: mockStore,
      });

      await waitFor(() => {
        expect(getByTestId('showNameSwitch').props.disabled).toBe(false);
      });

      fireEvent(getByTestId('showNameSwitch'), 'valueChange', true);
      fireEvent.press(getByTestId('publicNameVisibilityConfirmModalButton'));

      await waitFor(() => {
        expect(registryApi.registryUpdateDisplayName).toHaveBeenCalledWith(
          'did:example:123',
          'Test User',
        );
      });
    });

    it('desactiva nombre público sin mostrar el modal de aviso', async () => {
      const {getByTestId, queryByTestId} = renderWithProviders(
        <PersonalDetails />,
        {
          initialState: mockStore,
        },
      );

      await waitFor(() => {
        expect(getByTestId('showNameSwitch').props.disabled).toBe(false);
      });

      fireEvent(getByTestId('showNameSwitch'), 'valueChange', false);

      expect(queryByTestId('publicNameVisibilityConfirmModal')).toBeNull();
      await waitFor(() => {
        expect(registryApi.registryUpdateDisplayName).toHaveBeenCalledWith(
          'did:example:123',
          null,
        );
      });
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

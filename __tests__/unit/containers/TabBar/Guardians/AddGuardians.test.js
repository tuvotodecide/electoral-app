/**
 * Tests for AddGuardians Screen
 * Tests de pantalla para agregar guardianes
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import AddGuardians from '../../../../../src/container/TabBar/Guardians/AddGuardians';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';

// Mocks
jest.mock('../../../../../src/data/guardians', () => ({
  useKycFindPublicQuery: jest.fn(() => ({
    mutateAsync: jest.fn(() =>
      Promise.resolve({
        ok: true,
        data: {
          did: 'did:example:guardian123',
          fullName: 'Guardian Test',
          accountAddress: '0x123456789',
          guardianAddress: '0x987654321',
        },
      }),
    ),
    isLoading: false,
  })),
  useGuardiansInviteQuery: jest.fn(() => ({
    mutateAsync: jest.fn(() => Promise.resolve({ok: true})),
    isLoading: false,
  })),
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

jest.mock('../../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID}) =>
    React.createElement(Text, {testID}, children);
});

jest.mock('../../../../../src/components/common/CInput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');
  return ({testID, _value, toGetTextFieldValue, editable}) =>
    React.createElement(TextInput, {
      testID,
      value: _value,
      onChangeText: toGetTextFieldValue,
      editable: editable !== false,
    });
});

jest.mock('../../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  return ({testID, title, onPress, disabled}) =>
    React.createElement(
      TouchableOpacity,
      {testID, onPress, disabled},
      React.createElement(Text, null, title),
    );
});

jest.mock('../../../../../src/components/common/CAlert', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, message, status}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, message));
});

jest.mock('../../../../../src/components/common/Icono', () => {
  const React = require('react');
  return ({testID, name}) =>
    React.createElement('Icono', {testID, name});
});

jest.mock('../../../../../src/components/modal/InfoModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, visible, message, onClose}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(Text, null, message),
          React.createElement(
            TouchableOpacity,
            {testID: 'successModalCloseBtn', onPress: onClose},
            React.createElement(Text, null, 'Close'),
          ),
        )
      : null;
});

jest.mock('react-native-paper', () => ({
  ActivityIndicator: ({testID}) => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, {testID});
  },
}));

describe('AddGuardians Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        primaryColor: '#459151',
        dark: false,
        backgroundColor: '#FFFFFF',
        grayScale200: '#E5E7EB',
        grayScale500: '#6B7280',
        grayScale700: '#374151',
        white: '#FFFFFF',
        textColor: '#2F2F2F',
      },
    },
    wallet: {
      payload: {
        did: 'did:example:123',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansKeyboardWrapper')).toBeTruthy();
    });

    it('renderiza el título', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansTitle')).toBeTruthy();
    });

    it('renderiza el input de carnet', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansCarnetInput')).toBeTruthy();
    });

    it('renderiza el botón de búsqueda', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansSearchButton')).toBeTruthy();
    });

    it('renderiza el input de nombre (deshabilitado)', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansNameInput')).toBeTruthy();
    });

    it('renderiza el input de apodo', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansNicknameInput')).toBeTruthy();
    });

    it('renderiza el botón de enviar', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansSendButton')).toBeTruthy();
    });

    it('renderiza la alerta de información', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansInfoAlert')).toBeTruthy();
    });
  });

  describe('Búsqueda de Guardián', () => {
    it('busca guardián al presionar el botón de búsqueda', async () => {
      const {useKycFindPublicQuery} = require('../../../../../src/data/guardians');
      const mockMutateAsync = jest.fn(() =>
        Promise.resolve({
          ok: true,
          data: {
            did: 'did:example:guardian123',
            fullName: 'Guardian Test',
          },
        }),
      );
      useKycFindPublicQuery.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const carnetInput = getByTestId('addGuardiansCarnetInput');
      fireEvent.changeText(carnetInput, '12345678');

      const searchButton = getByTestId('addGuardiansSearchButton');
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('12345678');
      });
    });

    it('muestra el nombre del guardián encontrado', async () => {
      const {useKycFindPublicQuery} = require('../../../../../src/data/guardians');
      const mockMutateAsync = jest.fn(() =>
        Promise.resolve({
          ok: true,
          data: {
            did: 'did:example:guardian123',
            fullName: 'Guardian Test',
          },
        }),
      );
      useKycFindPublicQuery.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const carnetInput = getByTestId('addGuardiansCarnetInput');
      fireEvent.changeText(carnetInput, '12345678');

      const searchButton = getByTestId('addGuardiansSearchButton');
      fireEvent.press(searchButton);

      await waitFor(() => {
        const nameInput = getByTestId('addGuardiansNameInput');
        expect(nameInput.props.value).toBe('Guardian Test');
      });
    });

    it('muestra error cuando no se encuentra el guardián', async () => {
      const {useKycFindPublicQuery} = require('../../../../../src/data/guardians');
      const mockMutateAsync = jest.fn(() =>
        Promise.resolve({
          ok: false,
          error: 'Usuario no encontrado',
        }),
      );
      useKycFindPublicQuery.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const carnetInput = getByTestId('addGuardiansCarnetInput');
      fireEvent.changeText(carnetInput, '00000000');

      const searchButton = getByTestId('addGuardiansSearchButton');
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(getByTestId('addGuardiansErrorAlert')).toBeTruthy();
      });
    });
  });

  describe('Envío de Invitación', () => {
    it('envía invitación al presionar el botón de enviar', async () => {
      const {useGuardiansInviteQuery} = require('../../../../../src/data/guardians');
      const mockMutateAsync = jest.fn(() => Promise.resolve({ok: true}));
      useGuardiansInviteQuery.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      // Primero simular que se encontró un guardián
      const carnetInput = getByTestId('addGuardiansCarnetInput');
      fireEvent.changeText(carnetInput, '12345678');

      const nicknameInput = getByTestId('addGuardiansNicknameInput');
      fireEvent.changeText(nicknameInput, 'Mi Guardián');

      const sendButton = getByTestId('addGuardiansSendButton');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('muestra modal de éxito después de enviar invitación', async () => {
      const {useGuardiansInviteQuery} = require('../../../../../src/data/guardians');
      const mockMutateAsync = jest.fn(() => Promise.resolve({ok: true}));
      useGuardiansInviteQuery.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const carnetInput = getByTestId('addGuardiansCarnetInput');
      fireEvent.changeText(carnetInput, '12345678');

      const nicknameInput = getByTestId('addGuardiansNicknameInput');
      fireEvent.changeText(nicknameInput, 'Mi Guardián');

      const sendButton = getByTestId('addGuardiansSendButton');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByTestId('addGuardiansSuccessModal')).toBeTruthy();
      });
    });
  });

  describe('Validaciones', () => {
    it('no busca si el carnet está vacío', () => {
      const {useKycFindPublicQuery} = require('../../../../../src/data/guardians');
      const mockMutateAsync = jest.fn();
      useKycFindPublicQuery.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const searchButton = getByTestId('addGuardiansSearchButton');
      fireEvent.press(searchButton);

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('el botón de enviar está deshabilitado sin guardián seleccionado', () => {
      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const sendButton = getByTestId('addGuardiansSendButton');
      expect(sendButton.props.disabled).toBeTruthy();
    });
  });

  describe('Estado de Carga', () => {
    it('muestra indicador de carga durante la búsqueda', () => {
      const {useKycFindPublicQuery} = require('../../../../../src/data/guardians');
      useKycFindPublicQuery.mockReturnValue({
        mutateAsync: jest.fn(),
        isLoading: true,
      });

      const {getByTestId} = renderWithProviders(
        <AddGuardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('addGuardiansSearchLoading')).toBeTruthy();
    });
  });
});

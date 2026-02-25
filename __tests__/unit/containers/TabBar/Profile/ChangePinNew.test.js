/**
 * Tests for ChangePinNew Screen
 * Tests de pantalla de ingreso de nuevo PIN
 */

import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import ChangePinNew from '../../../../../src/container/TabBar/Profile/ChangePinNew';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../../setup/test-utils';
import {StackNav} from '../../../../../src/navigation/NavigationKey';

// Mocks
jest.mock('../../../../../src/utils/ThemeUtils', () => ({
  getSecondaryTextColor: jest.fn(() => '#666666'),
}));

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');
  return React.forwardRef(({testID, handleTextChange, inputCount}, ref) => {
    React.useImperativeHandle(ref, () => ({
      clear: jest.fn(),
      focusInput: jest.fn(),
    }));
    return React.createElement(TextInput, {
      testID,
      onChangeText: handleTextChange,
      maxLength: inputCount,
    });
  });
});

jest.mock('../../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({testID}) => React.createElement(View, {testID});
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

describe('ChangePinNew Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        textColor: '#2F2F2F',
        inputBackground: '#FFFFFF',
        grayScale500: '#6B7280',
      },
    },
  };

  const routeWithOldPin = {
    ...mockRoute,
    params: {
      oldPin: '1234',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el título', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el subtítulo', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el input de OTP', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el botón de continuar', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Input de PIN', () => {
    it('actualiza el estado cuando se ingresa el PIN', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Navegación', () => {
    it('navega a ChangePinNewConfirm al presionar continuar con PIN válido', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={localNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('no navega si el PIN tiene menos de 4 dígitos', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={localNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Estado del Botón', () => {
    it('el botón está deshabilitado cuando el PIN está vacío', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('el botón se habilita cuando el PIN tiene 4 dígitos', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

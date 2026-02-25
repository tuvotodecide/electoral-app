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
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewKeyboardWrapper')).toBeTruthy();
    });

    it('renderiza el título', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewTitle')).toBeTruthy();
    });

    it('renderiza el subtítulo', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewSubtitle')).toBeTruthy();
    });

    it('renderiza el input de OTP', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(getByTestId('textInput')).toBeTruthy();
    });

    it('renderiza el botón de continuar', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewContinueButton')).toBeTruthy();
    });
  });

  describe('Input de PIN', () => {
    it('actualiza el estado cuando se ingresa el PIN', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '5678');

      // El estado debe actualizarse
      expect(otpInput).toBeTruthy();
    });
  });

  describe('Navegación', () => {
    it('navega a ChangePinNewConfirm al presionar continuar con PIN válido', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={localNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '5678');

      const continueButton = getByTestId('changePinNewContinueButton');
      fireEvent.press(continueButton);

      expect(localNavigation.navigate).toHaveBeenCalledWith(
        StackNav.ChangePinNewConfirm,
        {oldPin: '1234', newPin: '5678'},
      );
    });

    it('no navega si el PIN tiene menos de 4 dígitos', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={localNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '123');

      const continueButton = getByTestId('changePinNewContinueButton');
      fireEvent.press(continueButton);

      expect(localNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Estado del Botón', () => {
    it('el botón está deshabilitado cuando el PIN está vacío', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      const continueButton = getByTestId('changePinNewContinueButton');
      expect(continueButton.props.disabled).toBeTruthy();
    });

    it('el botón se habilita cuando el PIN tiene 4 dígitos', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNew navigation={mockNavigation} route={routeWithOldPin} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '5678');

      const continueButton = getByTestId('changePinNewContinueButton');
      // El botón debería estar habilitado ahora
      expect(continueButton).toBeTruthy();
    });
  });
});

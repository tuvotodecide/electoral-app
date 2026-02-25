/**
 * Tests for ChangePinVerify Screen
 * Tests de pantalla de verificación de PIN para cambio
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import ChangePinVerify from '../../../../../src/container/TabBar/Profile/ChangePinVerify';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';
import {StackNav} from '../../../../../src/navigation/NavigationKey';

// Mocks
jest.mock('wira-sdk', () => ({
  checkPin: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../../../../src/utils/ThemeUtils', () => ({
  getSecondaryTextColor: jest.fn(() => '#666666'),
}));

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');
  return React.forwardRef(({testID, handleTextChange, inputCount}, ref) => {
    React.useImperativeHandle(ref, () => ({
      clear: jest.fn(),
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

jest.mock('../../../../../src/components/common/CLoaderOverlay', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({message}) =>
    React.createElement(
      View,
      {testID: 'loaderOverlay'},
      React.createElement(Text, null, message),
    );
});

jest.mock('../../../../../src/components/modal/InfoModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, visible, title, message, onClose}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(Text, {testID: 'errorModalTitle'}, title),
          React.createElement(Text, {testID: 'errorModalMessage'}, message),
          React.createElement(
            TouchableOpacity,
            {testID: 'errorModalCloseBtn', onPress: onClose},
            React.createElement(Text, null, 'Close'),
          ),
        )
      : null;
});

describe('ChangePinVerify Screen', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinVerifyContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinVerifyHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinVerifyKeyboardWrapper')).toBeTruthy();
    });

    it('renderiza el título', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinVerifyTitle')).toBeTruthy();
    });

    it('renderiza el subtítulo', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinVerifySubtitle')).toBeTruthy();
    });

    it('renderiza el input de OTP', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('textInput')).toBeTruthy();
    });
  });

  describe('Verificación de PIN', () => {
    it('navega a ChangePinNew cuando el PIN es correcto', async () => {
      const wira = require('wira-sdk');
      wira.checkPin.mockResolvedValueOnce(true);

      const localNavigation = {...mockNavigation, replace: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={localNavigation} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '1234');

      await waitFor(() => {
        expect(localNavigation.replace).toHaveBeenCalledWith(
          StackNav.ChangePinNew,
          {oldPin: '1234'},
        );
      });
    });

    it('muestra error cuando el PIN es incorrecto', async () => {
      const wira = require('wira-sdk');
      wira.checkPin.mockResolvedValueOnce(false);

      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '1234');

      await waitFor(() => {
        expect(getByTestId('changePinVerifyErrorModal')).toBeTruthy();
      });
    });

    it('muestra mensaje de PIN incorrecto en el modal de error', async () => {
      const wira = require('wira-sdk');
      wira.checkPin.mockResolvedValueOnce(false);

      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '1234');

      await waitFor(() => {
        expect(getByTestId('errorModalMessage')).toBeTruthy();
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra error cuando checkPin lanza excepción', async () => {
      const wira = require('wira-sdk');
      wira.checkPin.mockRejectedValueOnce(new Error('Check failed'));

      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '1234');

      await waitFor(() => {
        expect(getByTestId('changePinVerifyErrorModal')).toBeTruthy();
      });
    });

    it('cierra el modal de error al presionar el botón de cerrar', async () => {
      const wira = require('wira-sdk');
      wira.checkPin.mockResolvedValueOnce(false);

      const {getByTestId, queryByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '1234');

      await waitFor(() => {
        expect(getByTestId('changePinVerifyErrorModal')).toBeTruthy();
      });

      fireEvent.press(getByTestId('errorModalCloseBtn'));

      await waitFor(() => {
        expect(queryByTestId('changePinVerifyErrorModal')).toBeNull();
      });
    });
  });

  describe('Estados de Carga', () => {
    it('no muestra el loader inicialmente', () => {
      const {queryByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(queryByTestId('loaderOverlay')).toBeNull();
    });
  });

  describe('Input de PIN', () => {
    it('no verifica el PIN si tiene menos de 4 dígitos', async () => {
      const wira = require('wira-sdk');

      const {getByTestId} = renderWithProviders(
        <ChangePinVerify navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '123');

      await waitFor(() => {
        expect(wira.checkPin).not.toHaveBeenCalled();
      });
    });
  });
});

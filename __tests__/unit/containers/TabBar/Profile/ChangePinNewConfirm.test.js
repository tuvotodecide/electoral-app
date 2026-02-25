/**
 * Tests for ChangePinNewConfirm Screen
 * Tests de pantalla de confirmación de nuevo PIN
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import ChangePinNewConfirm from '../../../../../src/container/TabBar/Profile/ChangePinNewConfirm';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../../setup/test-utils';
import {StackNav} from '../../../../../src/navigation/NavigationKey';

// Mocks
jest.mock('wira-sdk', () => ({
  updatePin: jest.fn(() => Promise.resolve()),
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

jest.mock('../../../../../src/components/modal/LoadingModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, visible, message, isLoading, success, onClose}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(Text, {testID: 'modalMessage'}, message),
          !isLoading &&
            React.createElement(
              TouchableOpacity,
              {testID: 'modalCloseBtn', onPress: onClose},
              React.createElement(Text, null, 'Close'),
            ),
        )
      : null;
});

describe('ChangePinNewConfirm Screen', () => {
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

  const routeWithPins = {
    ...mockRoute,
    params: {
      oldPin: '1234',
      newPin: '5678',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewConfirmContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewConfirmHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewConfirmKeyboardWrapper')).toBeTruthy();
    });

    it('renderiza el título', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewConfirmTitle')).toBeTruthy();
    });

    it('renderiza el subtítulo', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewConfirmSubtitle')).toBeTruthy();
    });

    it('renderiza el input de OTP', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(getByTestId('textInput')).toBeTruthy();
    });

    it('renderiza el botón de finalizar', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(getByTestId('changePinNewConfirmFinishButton')).toBeTruthy();
    });
  });

  describe('Confirmación de PIN', () => {
    it('actualiza el PIN exitosamente cuando coinciden', async () => {
      const wira = require('wira-sdk');
      wira.updatePin.mockResolvedValueOnce();

      const localNavigation = {...mockNavigation, popToTop: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={localNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '5678');

      const finishButton = getByTestId('changePinNewConfirmFinishButton');
      fireEvent.press(finishButton);

      await waitFor(() => {
        expect(wira.updatePin).toHaveBeenCalledWith('1234', '5678');
      });
    });

    it('muestra modal de éxito después de actualizar PIN', async () => {
      const wira = require('wira-sdk');
      wira.updatePin.mockResolvedValueOnce();

      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '5678');

      const finishButton = getByTestId('changePinNewConfirmFinishButton');
      fireEvent.press(finishButton);

      await waitFor(() => {
        expect(getByTestId('changePinNewConfirmResultModal')).toBeTruthy();
      });
    });

    it('muestra error cuando los PINs no coinciden', async () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '9999'); // PIN diferente

      const finishButton = getByTestId('changePinNewConfirmFinishButton');
      fireEvent.press(finishButton);

      await waitFor(() => {
        expect(getByTestId('changePinNewConfirmResultModal')).toBeTruthy();
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra error cuando updatePin falla', async () => {
      const wira = require('wira-sdk');
      wira.updatePin.mockRejectedValueOnce(new Error('Update failed'));

      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '5678');

      const finishButton = getByTestId('changePinNewConfirmFinishButton');
      fireEvent.press(finishButton);

      await waitFor(() => {
        expect(getByTestId('changePinNewConfirmResultModal')).toBeTruthy();
      });
    });
  });

  describe('Modal de Resultado', () => {
    it('cierra el modal y navega al presionar cerrar', async () => {
      const wira = require('wira-sdk');
      wira.updatePin.mockResolvedValueOnce();

      const localNavigation = {...mockNavigation, popToTop: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={localNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      const otpInput = getByTestId('textInput');
      fireEvent.changeText(otpInput, '5678');

      const finishButton = getByTestId('changePinNewConfirmFinishButton');
      fireEvent.press(finishButton);

      await waitFor(() => {
        expect(getByTestId('changePinNewConfirmResultModal')).toBeTruthy();
      });

      const closeBtn = getByTestId('modalCloseBtn');
      fireEvent.press(closeBtn);

      await waitFor(() => {
        expect(localNavigation.popToTop).toHaveBeenCalled();
      });
    });
  });

  describe('Estado del Botón', () => {
    it('el botón está deshabilitado cuando el PIN de confirmación está vacío', () => {
      const {getByTestId} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      const finishButton = getByTestId('changePinNewConfirmFinishButton');
      expect(finishButton.props.disabled).toBeTruthy();
    });
  });
});

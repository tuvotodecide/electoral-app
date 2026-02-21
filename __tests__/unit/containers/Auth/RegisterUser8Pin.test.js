import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import RegisterUser8Pin from '../../../../src/container/Auth/RegisterUser8Pin';

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');

  return ({testID, handleTextChange, inputCount, secureTextEntry}) =>
    React.createElement(TextInput, {
      testID: testID || 'registerUser8PinInput',
      onChangeText: handleTextChange,
      maxLength: inputCount,
      secureTextEntry,
    });
});

describe('RegisterUser8Pin', () => {
  const route = {
    params: {
      ocrData: {dni: '12345678A'},
      useBiometry: true,
      dni: '12345678A',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inicia con continuar deshabilitado y lo habilita con 4 dígitos', () => {
    const {getByTestId} = renderWithProviders(
      <RegisterUser8Pin navigation={mockNavigation} route={route} />,
    );

    const input = getByTestId('registerUser8PinInput');
    const button = getByTestId('registerUser8PinContinueButton');

    expect(button.props.disabled).toBe(true);

    fireEvent.changeText(input, '123');
    expect(getByTestId('registerUser8PinContinueButton').props.disabled).toBe(true);

    fireEvent.changeText(input, '1234');
    expect(getByTestId('registerUser8PinContinueButton').props.disabled).toBe(false);
  });

  it('navega respetando el contrato de parámetros actuales de la ruta', () => {
    const {getByTestId} = renderWithProviders(
      <RegisterUser8Pin navigation={mockNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('registerUser8PinInput'), '1234');
    fireEvent.press(getByTestId('registerUser8PinContinueButton'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
      originalPin: '1234',
      ocrData: route.params.ocrData,
      useBiometry: true,
      dni: '12345678A',
    });
  });

  it('maneja correctamente la ausencia de parámetros en route', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser8Pin navigation={localNavigation} route={{}} />,
    );

    fireEvent.changeText(getByTestId('registerUser8PinInput'), '9999');
    fireEvent.press(getByTestId('registerUser8PinContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
      originalPin: '9999',
      ocrData: undefined,
      useBiometry: undefined,
      dni: undefined,
    });
  });
});

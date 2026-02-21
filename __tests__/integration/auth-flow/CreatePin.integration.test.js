import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import CreatePin from '../../../src/container/Auth/CreatePin';
import {AuthNav} from '../../../src/navigation/NavigationKey';
import {mockNavigation, renderWithProviders} from '../../setup/test-utils';

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');

  return ({testID, handleTextChange, inputCount}) =>
    React.createElement(TextInput, {
      testID: testID || 'pinCreationInput',
      onChangeText: handleTextChange,
      maxLength: inputCount,
    });
});

describe('Flujo de integración de CreatePin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sigue la ruta de creación de PIN hacia UploadDocument', () => {
    const {getByTestId} = renderWithProviders(
      <CreatePin navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByTestId('pinCreationInput'), '12345');
    fireEvent.press(getByTestId('createPinButton'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
  });

  it('sigue la ruta de omitir hacia UploadDocument', () => {
    const {getByTestId} = renderWithProviders(
      <CreatePin navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('skipForNowButton'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
  });

  it('maneja excepción de navegación y registra advertencia', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const navigation = {
      ...mockNavigation,
      navigate: jest.fn(() => {
        throw new Error('Navigation failed');
      }),
    };

    const {getByTestId} = renderWithProviders(
      <CreatePin navigation={navigation} />,
    );

    expect(() => fireEvent.press(getByTestId('createPinButton'))).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[CreatePin] Navigation failed', expect.any(Error));

    warnSpy.mockRestore();
  });
});

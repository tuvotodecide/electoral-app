import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import CreatePin from '../../../../src/container/Auth/CreatePin';

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');

  return ({testID, handleTextChange, inputCount, secureTextEntry}) =>
    React.createElement(TextInput, {
      testID: testID || 'pinCreationInput',
      onChangeText: handleTextChange,
      maxLength: inputCount,
      secureTextEntry,
    });
});

describe('CreatePin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza los elementos principales', () => {
    const {getByTestId} = renderWithProviders(<CreatePin navigation={mockNavigation} />);

    expect(getByTestId('createPinContainer')).toBeTruthy();
    expect(getByTestId('pinCreationInput')).toBeTruthy();
    expect(getByTestId('createPinButton')).toBeTruthy();
    expect(getByTestId('skipForNowButton')).toBeTruthy();
  });

  it('navega a UploadDocument con ambos botones', () => {
    const {getByTestId} = renderWithProviders(<CreatePin navigation={mockNavigation} />);

    fireEvent.press(getByTestId('createPinButton'));
    fireEvent.press(getByTestId('skipForNowButton'));

    expect(mockNavigation.navigate).toHaveBeenNthCalledWith(1, AuthNav.UploadDocument);
    expect(mockNavigation.navigate).toHaveBeenNthCalledWith(2, AuthNav.UploadDocument);
  });

  it('no rompe la UI si navigate falla', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const navigation = {
      ...mockNavigation,
      navigate: jest.fn(() => {
        throw new Error('Navigation failed');
      }),
    };

    const {getByTestId} = renderWithProviders(<CreatePin navigation={navigation} />);

    expect(() => fireEvent.press(getByTestId('createPinButton'))).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[CreatePin] Navigation failed', expect.any(Error));

    warnSpy.mockRestore();
  });
});

import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import UploadDocument from '../../../../src/container/Auth/UploadDocument';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/api/constant', () => ({
  UploadDocumentData: [
    {id: 1, isSelectIcon: null, notSelectIcon: null, name: 'ID'},
    {id: 2, isSelectIcon: null, notSelectIcon: null, name: 'Digital'},
    {id: 3, isSelectIcon: null, notSelectIcon: null, name: 'Passport'},
  ],
}));

jest.mock('../../../../src/components/common/CSafeAreaViewAuth', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockCSafeAreaViewAuth = ({children, testID}) =>
    React.createElement(View, {testID}, children);
  return MockCSafeAreaViewAuth;
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockCHeader = ({testID}) => React.createElement(View, {testID});
  return MockCHeader;
});

jest.mock('../../../../src/components/authComponents/StepIndicator', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockStepIndicator = ({testID}) => React.createElement(View, {testID});
  return MockStepIndicator;
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCText = ({children, testID}) =>
    React.createElement(Text, {testID}, children);
  return MockCText;
});

jest.mock('../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  const MockCButton = ({testID, title, onPress}) =>
    React.createElement(
      TouchableOpacity,
      {testID, onPress},
      React.createElement(Text, null, title),
    );
  return MockCButton;
});

describe('UploadDocument', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('renderiza lista de tipos de documento y controles principales', () => {
    const {getByTestId} = renderWithProviders(<UploadDocument navigation={mockNavigation} />);

    expect(getByTestId('uploadDocumentContainer')).toBeTruthy();
    expect(getByTestId('uploadDocumentTitle')).toBeTruthy();
    expect(getByTestId('uploadDocumentDescription')).toBeTruthy();
    expect(getByTestId('uploadDocumentOptionsList')).toBeTruthy();
    expect(getByTestId('uploadDocumentOption_1')).toBeTruthy();
    expect(getByTestId('uploadDocumentOption_2')).toBeTruthy();
    expect(getByTestId('uploadDocumentOption_3')).toBeTruthy();
  });

  it('continua hacia UploadPhotoId', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<UploadDocument navigation={localNavigation} />);

    fireEvent.press(getByTestId('uploadDocumentContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadPhotoId);
  });

  it('permite seleccionar un tipo de documento antes de continuar', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<UploadDocument navigation={localNavigation} />);

    fireEvent.press(getByTestId('uploadDocumentOption_2'));

    expect(localNavigation.navigate).not.toHaveBeenCalled();
  });
});

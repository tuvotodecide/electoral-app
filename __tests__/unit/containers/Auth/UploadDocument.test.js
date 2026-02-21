import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import UploadDocument from '../../../../src/container/Auth/UploadDocument';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('UploadDocument', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('renderiza lista de tipos de documento y controles principales', () => {
    const {getByTestId} = renderWithProviders(<UploadDocument navigation={mockNavigation} />);

    const optionsList = getByTestId('uploadDocumentOptionsList');
    const firstItem = optionsList.props.renderItem({
      item: optionsList.props.data[0],
      index: 0,
    });
    const secondItem = optionsList.props.renderItem({
      item: optionsList.props.data[1],
      index: 1,
    });
    const thirdItem = optionsList.props.renderItem({
      item: optionsList.props.data[2],
      index: 2,
    });

    expect(getByTestId('uploadDocumentContainer')).toBeTruthy();
    expect(getByTestId('uploadDocumentTitle')).toBeTruthy();
    expect(getByTestId('uploadDocumentDescription')).toBeTruthy();
    expect(optionsList.props.data).toHaveLength(3);
    expect(typeof optionsList.props.renderItem).toBe('function');
    expect(firstItem.props.testID).toBe('uploadDocumentOption_1');
    expect(secondItem.props.testID).toBe('uploadDocumentOption_2');
    expect(thirdItem.props.testID).toBe('uploadDocumentOption_3');
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
    const optionsList = getByTestId('uploadDocumentOptionsList');
    const secondItem = optionsList.props.renderItem({
      item: optionsList.props.data[1],
      index: 1,
    });

    secondItem.props.onPress();

    expect(secondItem.props.testID).toBe('uploadDocumentOption_2');
    expect(localNavigation.navigate).not.toHaveBeenCalled();
  });
});

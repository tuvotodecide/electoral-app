import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import PhotoReviewScreen from '../../../../src/container/Vote/UploadRecord/PhotoReviewScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';

jest.mock(
  'react-redux',
  () => jest.requireActual('../../../__mocks__/react-redux'),
  {virtual: true},
);
jest.mock(
  '@react-navigation/native',
  () => jest.requireActual('../../../__mocks__/@react-navigation/native'),
  {virtual: true},
);

jest.mock(
  '../../../../src/components/common/BaseRecordReviewScreen',
  () => require('../../../__mocks__/components/common/BaseRecordReviewScreen').default,
);

jest.mock(
  '../../../../src/components/common/CustomModal',
  () => require('../../../__mocks__/components/common/CustomModal').default,
);

jest.mock(
  '../../../../src/i18n/String',
  () => require('../../../__mocks__/String').default,
);

const {setupPhotoReviewBaseMocks, createMockNavigation} = require('./testUtils');

describe('PhotoReviewScreen - Interacciones de Usuario', () => {
  let mockNavigation;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = createMockNavigation();
    setupPhotoReviewBaseMocks({navigation: mockNavigation});
  });

  test('debe mostrar modal al guardar cambios', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    act(() => {
      fireEvent.press(getByTestId('photoReviewScreenBaseActionButton_0'));
    });

    act(() => {
      fireEvent.press(getByTestId('photoReviewScreenBaseActionButton_0'));
    });

    const modal = getByTestId('photoReviewSuccessModal');
    expect(modal.props.visible).toBe(true);

    act(() => {
      modal.props.onClose();
    });

    const modalAfterClose = getByTestId('photoReviewSuccessModal');
    expect(modalAfterClose.props.visible).toBe(false);
  });

  test('debe navegar a la pantalla de confirmación al presionar Siguiente', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    act(() => {
      fireEvent.press(getByTestId('photoReviewScreenBaseActionButton_1'));
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      StackNav.PhotoConfirmationScreen,
      expect.objectContaining({
        photoUri: 'file:///test/photo.jpg',
        tableData: expect.objectContaining({tableNumber: '45'}),
        partyResults: expect.any(Array),
        voteSummaryResults: expect.any(Array),
      }),
    );
  });

  test('debe ejecutar navegación hacia atrás desde el encabezado', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    act(() => {
      fireEvent.press(getByTestId('photoReviewScreenBaseBackButton'));
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});

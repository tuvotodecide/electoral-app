import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import PhotoReviewScreen from '../../../../src/container/Vote/UploadRecord/PhotoReviewScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

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

const {useSelector} = require('react-redux');
const {useNavigation, useRoute} = require('@react-navigation/native');

const buildMockRoute = (overrides = {}) => ({
  params: {
    photoUri: 'file:///test/photo.jpg',
    tableData: {
      tableNumber: '45',
      numero: '45',
      number: '45',
      recinto: 'Colegio Central',
    },
    ...overrides,
  },
});

const themeState = {
  theme: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#888888',
    primary: '#4F9858',
  },
};

let mockNavigation;

describe('PhotoReviewScreen - Interacciones de Usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    useSelector.mockImplementation(selector =>
      selector({
        theme: themeState,
      }),
    );

    useNavigation.mockReturnValue(mockNavigation);
    useRoute.mockReturnValue(buildMockRoute());
  });

  test('debe mostrar modal al guardar cambios', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    // Activar edición
    act(() => {
      fireEvent.press(getByTestId('photoReviewScreenBaseActionButton_0'));
    });

    // Guardar cambios
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

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

const {
  setupPhotoReviewBaseMocks,
  createMockNavigation,
  buildMockRoute,
} = require('./testUtils');

describe('PhotoReviewScreen - Manejo de Errores y Casos Límite', () => {
  let mockNavigation;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = createMockNavigation();
  });

  test('debe manejar ausencia total de route params sin fallar', () => {
    setupPhotoReviewBaseMocks({navigation: mockNavigation});
    const {useRoute} = require('@react-navigation/native');
    useRoute.mockReturnValue({});

    const {getByTestId} = render(<PhotoReviewScreen />);
    const base = getByTestId('photoReviewScreenBase');

    expect(base.props.headerTitle).toBe('Mesa N/A');
    expect(base.props.tableData).toBeUndefined();
    expect(base.props.partyResults).toHaveLength(4);
  });

  test('debe manejar route con params vacíos y navegar con valores por defecto', () => {
    setupPhotoReviewBaseMocks({navigation: mockNavigation});
    const {useRoute} = require('@react-navigation/native');
    useRoute.mockReturnValue({params: {}});

    const {getByTestId} = render(<PhotoReviewScreen />);

    act(() => {
      fireEvent.press(getByTestId('photoReviewScreenBaseActionButton_1'));
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      StackNav.PhotoConfirmationScreen,
      expect.objectContaining({
        photoUri: undefined,
        tableData: undefined,
      }),
    );
  });

  test('debe permitir cerrar modal sin importar el estado', () => {
    setupPhotoReviewBaseMocks({navigation: mockNavigation});
    const {useRoute} = require('@react-navigation/native');
    useRoute.mockReturnValue(buildMockRoute({photoUri: undefined}));

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

    expect(getByTestId('photoReviewSuccessModal').props.visible).toBe(false);
  });
});

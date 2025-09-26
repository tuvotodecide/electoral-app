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

const themeState = {
  theme: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#888888',
    primary: '#4F9858',
  },
};

let mockNavigation;

describe('PhotoReviewScreen - Manejo de Errores y Casos Límite', () => {
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
  });

  test('debe manejar ausencia total de route params sin fallar', () => {
    useRoute.mockReturnValue({});
    useNavigation.mockReturnValue(mockNavigation);

    const {getByTestId} = render(<PhotoReviewScreen />);
    const base = getByTestId('photoReviewScreenBase');

    expect(base.props.headerTitle).toBe('Mesa N/A');
    expect(base.props.tableData).toBeUndefined();
    expect(base.props.partyResults).toHaveLength(4);
  });

  test('debe manejar route con params vacíos y navegar con valores por defecto', () => {
    useRoute.mockReturnValue({params: {}});
    useNavigation.mockReturnValue(mockNavigation);

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
    useRoute.mockReturnValue({params: {}});
    useNavigation.mockReturnValue(mockNavigation);

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

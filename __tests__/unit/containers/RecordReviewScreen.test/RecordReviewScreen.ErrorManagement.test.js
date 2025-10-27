import './jestMocks';

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import RecordReviewScreen from '../../../../src/container/Vote/WitnessRecord/RecordReviewScreen';

const {useRoute} = require('@react-navigation/native');

const {
  mockThemeSelector,
  resetNavigationMocks,
} = require('./testUtils');

describe('RecordReviewScreen - Manejo de Errores y Casos Límite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockThemeSelector({background: '#111111'});
    resetNavigationMocks();
  });

  const renderScreenWithRoute = routeValue => {
    useRoute.mockReturnValue(routeValue);
    const navigation = resetNavigationMocks();
    return {
      navigation,
      ...render(<RecordReviewScreen />),
    };
  };

  test('tolera ausencia total de parámetros presentando valores predeterminados', () => {
    const {getByTestId} = renderScreenWithRoute({});
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.headerTitle).toBe('Mesa N/A');
    expect(baseScreen.props.partyResults).toHaveLength(4);
    expect(baseScreen.props.voteSummaryResults).toHaveLength(3);
  });

  test('usa fallback "N/A" cuando tableData no provee identificadores', () => {
    const {getByTestId} = renderScreenWithRoute({params: {tableData: {}}});
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.headerTitle).toBe('Mesa N/A');
  });

  test('navega con estructuras seguras aun cuando faltan datos críticos', () => {
    const {getByTestId, navigation} = renderScreenWithRoute({params: {}});

    fireEvent.press(getByTestId('recordReviewBaseScreenActionButton_1'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'RecordCertificationScreen',
      expect.objectContaining({
        recordId: undefined,
        photoUri: undefined,
        tableData: undefined,
        mesaInfo: undefined,
        partyResults: expect.any(Array),
        voteSummaryResults: expect.any(Array),
      }),
    );
  });
});

import './jestMocks';

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import RecordReviewScreen from '../../../../src/container/Vote/WitnessRecord/RecordReviewScreen';

const {
  buildRouteParams,
  mockRoute,
  mockThemeSelector,
  resetNavigationMocks,
} = require('./testUtils');

describe('RecordReviewScreen - Interacciones de Usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockThemeSelector();
    mockRoute(buildRouteParams());
    resetNavigationMocks();
  });

  const renderScreen = routeParams => {
    const params = routeParams ?? buildRouteParams();
    mockRoute(params);
    const navigation = resetNavigationMocks();
    return {
      params,
      navigation,
      ...render(<RecordReviewScreen />),
    };
  };

  test('el botón Atrás invoca navigation.goBack desde múltiples accesos', () => {
    const {getByTestId, navigation} = renderScreen();

    fireEvent.press(getByTestId('recordReviewBaseScreenActionButton_0'));
    fireEvent.press(getByTestId('recordReviewBaseScreenBackButton'));

    expect(navigation.goBack).toHaveBeenCalledTimes(2);
  });

  test('el botón Corregir datos navega con la información proporcionada', () => {
    const {getByTestId, navigation, params} = renderScreen();

    fireEvent.press(getByTestId('recordReviewBaseScreenActionButton_1'));

    expect(navigation.navigate).toHaveBeenCalledWith('RecordCertificationScreen', {
      recordId: params.recordId,
      photoUri: params.photoUri,
      tableData: params.tableData,
      mesaInfo: params.mesaInfo,
      partyResults: params.partyResults,
      voteSummaryResults: params.voteSummaryResults,
    });
  });

  test('usa resultados por defecto al navegar cuando faltan en la ruta', () => {
    const params = buildRouteParams({partyResults: undefined, voteSummaryResults: undefined});
    const {getByTestId, navigation} = renderScreen(params);

    fireEvent.press(getByTestId('recordReviewBaseScreenActionButton_1'));

    const payload = navigation.navigate.mock.calls[0][1];
    expect(payload.partyResults).toHaveLength(4);
    expect(payload.voteSummaryResults).toHaveLength(3);
  });

  test('el callback onBack del componente base referencia a navigation.goBack', () => {
    const {getByTestId, navigation} = renderScreen();
    const baseScreen = getByTestId('recordReviewBaseScreen');

    baseScreen.props.onBack();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});

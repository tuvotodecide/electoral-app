import './jestMocks';

import React from 'react';
import {render} from '@testing-library/react-native';
import RecordReviewScreen from '../../../../src/container/Vote/WitnessRecord/RecordReviewScreen';

const {
  baseTheme,
  mockNavigation,
  mockRoute,
  mockThemeSelector,
  resetNavigationMocks,
  buildRouteParams,
} = require('./testUtils');

describe('RecordReviewScreen - Renderizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockThemeSelector();
    resetNavigationMocks();
  });

  const renderScreen = overrides => {
    const params = mockRoute(overrides?.routeParams);
    const navigation = resetNavigationMocks(overrides?.navigation ?? mockNavigation());

    return {
      params,
      navigation,
      ...render(<RecordReviewScreen />),
    };
  };

  test('renderiza encabezado, instrucciones y colores con los datos proporcionados', () => {
    const {getByTestId, params} = renderScreen();
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.headerTitle).toBe(`Mesa ${params.tableData.tableNumber}`);
    expect(baseScreen.props.instructionsText).toBe('Revisa los datos del acta electoral');
    expect(baseScreen.props.colors).toEqual(baseTheme);
    expect(baseScreen.props.photoUri).toBe(params.photoUri);
  });

  test('propaga resultados de partidos y resumen de votos desde la ruta', () => {
    const routeParams = buildRouteParams({
      partyResults: [
        {id: 'unity', partido: 'Unity', presidente: '10', diputado: '8'},
        {id: 'alliance', partido: 'Alliance', presidente: '5', diputado: '3'},
      ],
      voteSummaryResults: [
        {id: 'validos', label: 'Válidos', value1: '120', value2: '90'},
        {id: 'nulos', label: 'Nulos', value1: '2', value2: '1'},
      ],
    });

    const {getByTestId} = renderScreen({routeParams});
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.partyResults).toEqual(routeParams.partyResults);
    expect(baseScreen.props.voteSummaryResults).toEqual(routeParams.voteSummaryResults);
  });

  test('utiliza datos por defecto cuando la ruta no provee resultados', () => {
    const {getByTestId} = renderScreen({routeParams: buildRouteParams({partyResults: null, voteSummaryResults: null})});
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.partyResults).toHaveLength(4);
    expect(baseScreen.props.voteSummaryResults).toHaveLength(3);
  });

  test('configura correctamente los botones de acción', () => {
    const {getByTestId} = renderScreen();
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.actionButtons).toHaveLength(2);
    expect(baseScreen.props.actionButtons[0]).toMatchObject({text: 'Atrás'});
    expect(baseScreen.props.actionButtons[1]).toMatchObject({text: 'Corregir datos'});
  });
});

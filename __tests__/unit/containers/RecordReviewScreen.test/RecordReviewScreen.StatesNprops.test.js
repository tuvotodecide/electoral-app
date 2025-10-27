import './jestMocks';

import React from 'react';
import {render} from '@testing-library/react-native';
import RecordReviewScreen from '../../../../src/container/Vote/WitnessRecord/RecordReviewScreen';

const {
  buildRouteParams,
  mockRoute,
  mockThemeSelector,
  resetNavigationMocks,
} = require('./testUtils');

describe('RecordReviewScreen - Estados y Props', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockThemeSelector();
    resetNavigationMocks();
  });

  const renderScreen = routeParams => {
    mockRoute(routeParams);
    resetNavigationMocks();
    return render(<RecordReviewScreen />);
  };

  test('usa resultados por defecto cuando la ruta no provee listas', () => {
    const {getByTestId} = renderScreen(
      buildRouteParams({partyResults: undefined, voteSummaryResults: undefined}),
    );
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.partyResults).toHaveLength(4);
    expect(baseScreen.props.voteSummaryResults).toHaveLength(3);
  });

  test('propaga la imagen del acta al componente base', () => {
    const params = buildRouteParams({photoUri: 'file:///custom/photo.png'});

    const {getByTestId} = renderScreen(params);
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.photoUri).toBe('file:///custom/photo.png');
  });

  test('genera el título usando fallback cuando no existe tableNumber', () => {
    const params = buildRouteParams({
      tableData: {numero: '17', recinto: 'Otro Colegio'},
    });

    const {getByTestId} = renderScreen(params);
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.headerTitle).toBe('Mesa 17');
  });

  test('propaga los colores actuales del tema redux', () => {
    const customTheme = mockThemeSelector({primary: '#112233', text: '#FAFAFA'});
    const {getByTestId} = renderScreen();
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.colors).toEqual(customTheme);
  });
});

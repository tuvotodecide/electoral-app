import React from 'react';
import {render} from '@testing-library/react-native';
import RecordReviewScreen from '../../../../src/container/Vote/WitnessRecord/RecordReviewScreen';

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

const buildRoute = overrides => ({
  params: {
    recordId: 'record-01',
    photoUri: 'file:///record/photo.jpg',
    tableData: {
      tableNumber: '45',
      numero: '45',
      recinto: 'Colegio Central',
    },
    mesaInfo: {
      numero: '45',
      recinto: 'Colegio Central',
    },
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '33', diputado: '29'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '150', value2: '100'},
    ],
    ...overrides,
  },
});

describe('RecordReviewScreen - Renderizado', () => {
  let navigationMock;

  beforeEach(() => {
    jest.clearAllMocks();

    navigationMock = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    useNavigation.mockReturnValue(navigationMock);
    useSelector.mockImplementation(selector =>
      selector({
        theme: themeState,
      }),
    );
  });

  test('renderiza el encabezado y las instrucciones correctamente', () => {
    useRoute.mockReturnValue(buildRoute());

    const {getByTestId} = render(<RecordReviewScreen />);

    const baseScreen = getByTestId('recordReviewBaseScreen');
    expect(baseScreen.props.headerTitle).toBe('Mesa 45');
    expect(baseScreen.props.instructionsText).toBe('Revisa los datos del acta electoral');
    expect(baseScreen.props.colors).toEqual(themeState.theme);
  });

  test('muestra los resultados de partido y resumen de votos proporcionados por la ruta', () => {
    useRoute.mockReturnValue(
      buildRoute({
        partyResults: [
          {id: 'unity', partido: 'Unity', presidente: '10', diputado: '8'},
          {id: 'alliance', partido: 'Alliance', presidente: '5', diputado: '3'},
        ],
        voteSummaryResults: [
          {id: 'validos', label: 'Válidos', value1: '120', value2: '90'},
          {id: 'nulos', label: 'Nulos', value1: '2', value2: '1'},
        ],
      }),
    );

    const {getByTestId} = render(<RecordReviewScreen />);
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.partyResults).toHaveLength(2);
    expect(baseScreen.props.partyResults[0]).toMatchObject({
      id: 'unity',
      presidente: '10',
      diputado: '8',
    });
    expect(baseScreen.props.voteSummaryResults).toHaveLength(2);
  });

  test('configura los botones de acción para volver y corregir datos', () => {
    useRoute.mockReturnValue(buildRoute());

    const {getByTestId} = render(<RecordReviewScreen />);
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.actionButtons).toHaveLength(2);
    expect(baseScreen.props.actionButtons[0].text).toBe('Atrás');
    expect(baseScreen.props.actionButtons[1].text).toBe('Corregir datos');
  });
});

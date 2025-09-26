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
    background: '#101010',
    text: '#FFFFFF',
    textSecondary: '#DDDDDD',
    primary: '#4F9858',
  },
};

const buildRoute = overrides => ({
  params: {
    recordId: 'record-100',
    photoUri: 'file:///default/photo.jpg',
    tableData: {
      numero: '12',
      codigo: '9001',
      recinto: 'Unidad Educativa #12',
    },
    mesaInfo: {
      numero: '12',
      recinto: 'Unidad Educativa #12',
    },
    ...overrides,
  },
});

describe('RecordReviewScreen - Estados y Props', () => {
  let navigationMock;

  beforeEach(() => {
    jest.clearAllMocks();

    navigationMock = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    useNavigation.mockReturnValue(navigationMock);
    useSelector.mockImplementation(selector => selector({theme: themeState}));
  });

  test('usa resultados por defecto cuando la ruta no provee datos', () => {
    useRoute.mockReturnValue(buildRoute({partyResults: undefined, voteSummaryResults: undefined}));

    const {getByTestId} = render(<RecordReviewScreen />);
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.partyResults).toHaveLength(4);
    expect(baseScreen.props.partyResults[0]).toMatchObject({
      id: 'unidad',
      partido: 'Unidad Cívica',
      presidente: '33',
      diputado: '29',
    });

    expect(baseScreen.props.voteSummaryResults).toHaveLength(3);
    expect(baseScreen.props.voteSummaryResults[0]).toMatchObject({
      id: 'validos',
      label: 'Votos válidos',
      value1: '141',
      value2: '176',
    });
  });

  test('propaga el identificador y la imagen del acta', () => {
    useRoute.mockReturnValue(buildRoute({recordId: 'record-200'}));

    const {getByTestId} = render(<RecordReviewScreen />);
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.photoUri).toBe('file:///default/photo.jpg');
    expect(baseScreen.props.recordId).toBe('record-200');
  });

  test('entrega los colores del tema al componente base', () => {
    useRoute.mockReturnValue(buildRoute());

    const {getByTestId} = render(<RecordReviewScreen />);
    const baseScreen = getByTestId('recordReviewBaseScreen');

    expect(baseScreen.props.colors).toEqual(themeState.theme);
  });
});

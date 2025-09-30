import React from 'react';
import {render} from '@testing-library/react-native';
import PhotoReviewScreen from '../../../../src/container/Vote/UploadRecord/PhotoReviewScreen';

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

const {setupPhotoReviewBaseMocks} = require('./testUtils');

describe('PhotoReviewScreen - Renderizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupPhotoReviewBaseMocks();
  });

  test('debe renderizar BaseRecordReviewScreen con encabezado correcto', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    const baseScreen = getByTestId('photoReviewScreenBase');
    expect(baseScreen.props.headerTitle).toBe('Mesa 45');
    expect(baseScreen.props.instructionsText).toBe(
      'Revisa la fotografía del acta electoral',
    );
  });

  test('debe pasar resultados iniciales de partidos y resumen de votos', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    const baseScreen = getByTestId('photoReviewScreenBase');
    expect(baseScreen.props.partyResults).toHaveLength(4);
    expect(baseScreen.props.voteSummaryResults).toHaveLength(3);
    expect(baseScreen.props.partyResults[0]).toMatchObject({
      id: 'unidad',
      presidente: '33',
      diputado: '29',
    });
  });

  test('debe configurar botones de acción Editar y Siguiente por defecto', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    const baseScreen = getByTestId('photoReviewScreenBase');
    expect(baseScreen.props.actionButtons).toHaveLength(2);
    expect(baseScreen.props.actionButtons[0].text).toBe('Editar');
    expect(baseScreen.props.actionButtons[1].text).toBe('Siguiente');
  });

  test('debe renderizar modal de confirmación oculto inicialmente', () => {
    const {getByTestId} = render(<PhotoReviewScreen />);

    const modal = getByTestId('photoReviewSuccessModal');
    expect(modal.props.visible).toBe(false);
    expect(modal.props.title).toBe('Guardado');
    expect(modal.props.message).toBe('Los cambios se guardaron correctamente');
  });
});

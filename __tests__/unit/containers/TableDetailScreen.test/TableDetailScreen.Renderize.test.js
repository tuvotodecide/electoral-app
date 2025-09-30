import './jestMocks';

import {fireEvent} from '@testing-library/react-native';
import String from '../../../__mocks__/String';
import {
  renderTableDetail,
  defaultMesa,
  buildRoute,
  StackNav,
} from './testUtils';

describe('TableDetailScreen - Renderizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildPrecinctMatcher = value =>
    new RegExp(
      `${String.precinct}\\s*:?[\\s\\n]+${value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`,
    );

  test('muestra los detalles principales de la mesa y la acción de captura sin actas previas', () => {
    const {getByTestId, getByText} = renderTableDetail();

    expect(getByTestId('tableDetailContainer')).toBeTruthy();
    expect(getByText(String.ensureAssignedTable)).toBeTruthy();
    expect(getByText(`${String.table} ${defaultMesa.tableNumber}`)).toBeTruthy();
    expect(
      getByText(`${String.tableCode}: ${defaultMesa.codigo}`),
    ).toBeTruthy();
    expect(getByText(buildPrecinctMatcher(defaultMesa.recinto))).toBeTruthy();
    expect(getByText(String.aiWillSelectClearestPhoto)).toBeTruthy();
    expect(getByText(String.takePhoto)).toBeTruthy();
  });

  test('renderiza las actas existentes y navega a PhotoReview al seleccionarlas', () => {
    const existingRecords = [
      {recordId: 'rec-1', actaImage: 'https://image/1.jpg'},
      {recordId: 'rec-2'},
    ];

    const {getByText, navigation, queryByText} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: existingRecords.length,
      },
    });

    expect(
      getByText(`Actas Ya Atestiguadas (${existingRecords.length})`),
    ).toBeTruthy();
    expect(getByText('Acta #1')).toBeTruthy();
    expect(queryByText(String.aiWillSelectClearestPhoto)).toBeNull();

    fireEvent.press(getByText('Acta #1'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.PhotoReviewScreen,
      expect.objectContaining({
        existingRecord: existingRecords[0],
        isViewOnly: true,
      }),
    );
  });

  test('utiliza valores por defecto cuando la mesa carece de identificadores', () => {
    const emptyMesaRoute = buildRoute({
      mesa: {
        tableNumber: undefined,
        numero: undefined,
        codigo: undefined,
        colegio: undefined,
        recinto: undefined,
        provincia: undefined,
      },
    });

    const {getByText} = renderTableDetail({route: emptyMesaRoute});

    expect(getByText(`${String.table} FALLBACK-NUMERO`)).toBeTruthy();
    expect(getByText(`${String.tableCode}: 2352`)).toBeTruthy();
    expect(getByText(buildPrecinctMatcher('N/A'))).toBeTruthy();
  });
});

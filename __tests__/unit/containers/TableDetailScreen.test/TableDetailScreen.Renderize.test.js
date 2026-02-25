import './jestMocks';

import {fireEvent} from '@testing-library/react-native';
import String from '../../../__mocks__/String';
import {
  act,
  renderTableDetail,
  defaultMesa,
  buildRoute,
  StackNav,
  NetInfo,
  flushPromises,
  getWorksheetLocalStatus,
} from './testUtils';

describe('TableDetailScreen - Renderizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra los controles base de mesa y acción de captura', () => {
    const {getByTestId, getByText} = renderTableDetail();

    expect(getByTestId('tableDetailContainer')).toBeTruthy();
    expect(getByTestId('tableDetailMesaInput')).toBeTruthy();
    expect(getByTestId('tableDetailSearchMesaButton')).toBeTruthy();
    expect(getByText('Escribe el código de mesa')).toBeTruthy();
    // El componente muestra "Mesa {numero}" - el código lo ingresa el usuario
    expect(getByText(`${String.table} ${defaultMesa.tableNumber}`)).toBeTruthy();
    expect(getByTestId('tableDetailTakePhotoButton')).toBeTruthy();
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

    // El componente muestra el mensaje de alerta con el conteo de actas
    expect(
      getByText(/La mesa ya tiene 2 actas publicadas/),
    ).toBeTruthy();
    
    // No muestra actas individuales cuando hay más de 1, solo el botón de atestiguar
    expect(queryByText(String.aiWillSelectClearestPhoto)).toBeNull();
    expect(getByText('Atestiguar')).toBeTruthy();

    // Cuando hay más de 1 acta, el botón navega a WhichIsCorrectScreen
    fireEvent.press(getByText('Atestiguar'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.WhichIsCorrectScreen,
      expect.objectContaining({
        existingRecords,
        totalRecords: existingRecords.length,
      }),
    );
  });

  test('cuando hay acta pero no hoja (online) oculta controles de hoja de trabajo', async () => {
    NetInfo.fetch.mockResolvedValue({isConnected: true, isInternetReachable: true});

    const existingRecords = [{recordId: 'rec-1', actaImage: 'https://image/1.jpg'}];

    const {getByText, queryByText} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: existingRecords.length,
      },
    });

    await act(async () => {
      await flushPromises();
    });

    expect(getByText('Atestiguar')).toBeTruthy();
    expect(queryByText('Subir hoja de trabajo')).toBeNull();
    expect(queryByText(/La mesa ya tiene acta.*hoja de trabajo/i)).toBeNull();
  });

  test('si hay hoja subida (online) mantiene botón para verla aunque ya exista acta', async () => {
    NetInfo.fetch.mockResolvedValue({isConnected: true, isInternetReachable: true});
    getWorksheetLocalStatus.mockResolvedValueOnce({
      status: 'UPLOADED',
      ipfsUri: 'ipfs://cid',
    });

    const existingRecords = [{recordId: 'rec-1', actaImage: 'https://image/1.jpg'}];

    const {getByText} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: existingRecords.length,
        extraParams: {electionId: 'election-1'},
      },
    });

    await act(async () => {
      await flushPromises();
    });

    expect(getByText('Ver hoja de trabajo')).toBeTruthy();
  });

  test('cuando no hay mesa válida muestra el modo de búsqueda', () => {
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

    const {getByTestId, getByText} = renderTableDetail({route: emptyMesaRoute});

    expect(getByTestId('tableDetailSearchContainer')).toBeTruthy();
    expect(getByTestId('tableDetailMesaInput')).toBeTruthy();
    expect(getByText('Escribe el código de mesa')).toBeTruthy();
  });
});

import './jestMocks';

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import String from '../../../__mocks__/String';
import {
  axios,
  buildRoute,
  getOfflineQueue,
  getWorksheetLocalStatus,
  NetInfo,
  renderTableDetail,
  StackNav,
} from './testUtils';

describe('TableDetailScreen - Estados y Props', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getWorksheetLocalStatus.mockResolvedValue({status: 'NOT_FOUND'});
    getOfflineQueue.mockResolvedValue([]);
    NetInfo.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });
    axios.get.mockResolvedValue({data: {}});
  });

  test('usa el totalRecords entregado en la ruta aun cuando difiere del numero de actas', () => {
    const existingRecords = [{recordId: 'rec-1'}];

    const {getByText} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: 5,
      },
    });

    expect(getByText(/La mesa ya tiene 1 acta publicada/)).toBeTruthy();
  });

  test('abre el modal de previsualizacion cuando la ruta incluye una imagen capturada', () => {
    const route = buildRoute({
      capturedImage: {uri: 'file:///photo-test.jpg'},
    });

    const {getByText} = renderTableDetail({route});

    expect(getByText(String.preview)).toBeTruthy();
    expect(getByText(String.confirmAndSend)).toBeTruthy();
    expect(getByText(String.retakePhoto)).toBeTruthy();
  });

  test('normaliza los campos de mesa y los reutiliza al navegar a la camara', () => {
    const route = buildRoute({
      mesa: {
        id: 'mesa-9',
        tableNumber: 'mesa-9',
        numero: 'mesa-9',
        tableCode: 'C-999',
        recinto: 'Escuela Modelo',
        province: 'Provincia Test',
        provincia: 'Provincia Test',
      },
    });

    const {getByText, navigation} = renderTableDetail({route});

    // El componente muestra "Mesa {numero}" - el tableCode ya no se muestra en la UI
    expect(getByText(`${String.table} mesa-9`)).toBeTruthy();

    act(() => {
      fireEvent.press(getByText(String.takePhoto));
    });

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.CameraScreen,
      expect.objectContaining({
        tableData: expect.objectContaining({
          tableNumber: 'mesa-9',
          numero: 'mesa-9',
          codigo: 'C-999',
          ubicacion: 'Escuela Modelo, Provincia Test',
        }),
      }),
    );
  });

  test('bloquea la hoja de trabajo cuando la mesa ya tiene acta', () => {
    const existingRecords = [{recordId: 'rec-1', actaImage: 'https://image/1.jpg'}];
    const {getByText, navigation} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: existingRecords.length,
      },
    });

    expect(
      getByText(
        'La mesa ya tiene acta. La hoja de trabajo solo se permite antes del acta.',
      ),
    ).toBeTruthy();

    fireEvent.press(getByText('Subir hoja de trabajo'));
    expect(navigation.navigate).not.toHaveBeenCalledWith(
      StackNav.CameraScreen,
      expect.objectContaining({mode: 'worksheet'}),
    );
  });

  test('si worksheet esta uploaded habilita ver hoja y navega a revision', async () => {
    getWorksheetLocalStatus.mockResolvedValue({
      status: 'UPLOADED',
      ipfsUri: 'ipfs://cid123',
    });
    axios.get.mockResolvedValue({
      data: {
        image: 'https://ipfs.io/ipfs/cid123',
        data: {
          votes: {
            parties: {
              validVotes: 10,
              blankVotes: 1,
              nullVotes: 0,
              partyVotes: [{partyId: 'libre', votes: 10}],
            },
          },
        },
      },
    });

    const {getByText, navigation} = renderTableDetail({
      routeParams: {
        extraParams: {
          electionId: 'e-1',
          electionType: 'general',
        },
      },
    });

    await waitFor(() => {
      expect(getByText('Ver hoja de trabajo')).toBeTruthy();
    });

    fireEvent.press(getByText('Ver hoja de trabajo'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith(
        StackNav.PhotoReviewScreen,
        expect.objectContaining({
          mode: 'worksheet',
          isViewOnly: true,
        }),
      );
    });
  });
});

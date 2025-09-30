import './jestMocks';

import {act, fireEvent} from '@testing-library/react-native';
import String from '../../../__mocks__/String';
import {
  renderTableDetail,
  buildRoute,
  StackNav,
} from './testUtils';

describe('TableDetailScreen - Estados y Props', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('usa el totalRecords entregado en la ruta aun cuando difiere del número de actas', () => {
    const existingRecords = [{recordId: 'rec-1'}];

    const {getByText} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: 5,
      },
    });

    expect(getByText('Actas Ya Atestiguadas (5)')).toBeTruthy();
  });

  test('abre el modal de previsualización cuando la ruta incluye una imagen capturada', () => {
    const route = buildRoute({
      capturedImage: {uri: 'file:///photo-test.jpg'},
    });

    const {getByText} = renderTableDetail({route});

    expect(getByText(String.preview)).toBeTruthy();
    expect(getByText(String.confirmAndSend)).toBeTruthy();
    expect(getByText(String.retakePhoto)).toBeTruthy();
  });

  test('normaliza los campos de mesa y los reutiliza al navegar a la cámara', () => {
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

    expect(getByText(`${String.table} mesa-9`)).toBeTruthy();
    expect(getByText(`${String.tableCode}: C-999`)).toBeTruthy();
    expect(getByText(`${String.precinct}: Escuela Modelo`)).toBeTruthy();

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
});

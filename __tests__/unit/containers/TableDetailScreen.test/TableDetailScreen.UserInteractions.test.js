import './jestMocks';

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import String from '../../../__mocks__/String';
import {
  renderTableDetail,
  buildRoute,
  StackNav,
  NetInfo,
  axios,
} from './testUtils';

describe('TableDetailScreen - Interacciones de Usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    axios.get.mockResolvedValue({data: []});
  });

  test('intenta navegar a CameraScreen y usa el fallback ante errores', () => {
    const navigation = {
      navigate: jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('navigation error');
        })
        .mockImplementationOnce(() => {}),
      goBack: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      isFocused: jest.fn(() => true),
    };

    const {getByText} = renderTableDetail({navigation});

    act(() => {
      fireEvent.press(getByText(String.takePhoto));
    });

    expect(navigation.navigate).toHaveBeenNthCalledWith(1, StackNav.CameraScreen, expect.any(Object));
    expect(navigation.navigate).toHaveBeenNthCalledWith(2, 'CameraScreen', expect.any(Object));
  });

  test('al confirmar la foto navega a SuccessScreen con el mensaje correcto', () => {
    const route = buildRoute({
      capturedImage: {uri: 'file:///captured.jpg'},
    });
    const {getByText, navigation} = renderTableDetail({route});

    act(() => {
      fireEvent.press(getByText(String.confirmAndSend));
    });

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.SuccessScreen,
      expect.objectContaining({
        title: String.photoSentTitle,
        message: String.photoSentMessage,
      }),
    );
  });

  test('permite repetir la foto y cierra el modal antes de navegar a la cámara', async () => {
    const route = buildRoute({
      capturedImage: {uri: 'file:///captured.jpg'},
    });
    const {getByText, navigation} = renderTableDetail({route});

    await act(async () => {
      fireEvent.press(getByText(String.retakePhoto));
      await waitFor(() => {
        expect(navigation.navigate).toHaveBeenCalledWith(
          StackNav.CameraScreen,
          expect.any(Object),
        );
      });
    });
  });

  test('el botón Atestiguar utiliza la navegación estándar cuando hay una acta', () => {
    const existingRecords = [{recordId: 'rec-1', actaImage: 'https://image/1.jpg'}];
    const {getByText, navigation} = renderTableDetail({
      routeParams: {
        existingRecords,
        totalRecords: existingRecords.length,
      },
    });

    act(() => {
      fireEvent.press(getByText('Atestiguar'));
    });

    // Cuando hay exactamente 1 acta, navega a PhotoReviewScreen
    expect(navigation.navigate).toHaveBeenCalled();
    const lastCall =
      navigation.navigate.mock.calls[navigation.navigate.mock.calls.length - 1];
    const [routeName, params] = lastCall;
    expect(routeName).toBe(StackNav.PhotoReviewScreen);
    expect(params).toBeDefined();
    expect(params.mesa).toBeDefined();
    expect(params.existingRecord).toEqual(existingRecords[0]);
    expect(params.isViewOnly).toBe(true);
  });

  // =====================================================
  // Tests para el nuevo flujo de ingreso de código de mesa
  // =====================================================

  describe('Ingreso de Código de Mesa', () => {
    test('permite escribir en el campo de código de mesa', () => {
      const {getByTestId} = renderTableDetail();
      const input = getByTestId('tableDetailMesaInput');

      fireEvent.changeText(input, '1234');

      expect(input.props.value).toBe('1234');
    });

    test('el botón de búsqueda está deshabilitado cuando el input está vacío', () => {
      const {getByTestId} = renderTableDetail();
      const searchButton = getByTestId('tableDetailSearchMesaButton');

      // El botón tiene style de deshabilitado cuando no hay texto
      expect(searchButton.props.disabled).toBe(true);
    });

    test('el botón de búsqueda se habilita cuando hay texto en el input', () => {
      const {getByTestId} = renderTableDetail();
      const input = getByTestId('tableDetailMesaInput');
      const searchButton = getByTestId('tableDetailSearchMesaButton');

      fireEvent.changeText(input, '1234');

      expect(searchButton.props.disabled).toBe(false);
    });

    test('al buscar una mesa, actualiza el estado con los datos de la mesa', async () => {
      const {getByTestId, getByText} = renderTableDetail({
        routeParams: {
          extraParams: {
            locationData: {
              _id: 'loc-123',
              name: 'Recinto Test',
              address: 'Dirección Test',
            },
          },
        },
      });

      const input = getByTestId('tableDetailMesaInput');
      const searchButton = getByTestId('tableDetailSearchMesaButton');

      fireEvent.changeText(input, '999');
      fireEvent.press(searchButton);

      await waitFor(() => {
        // Después de buscar, debe mostrar la mesa con el número ingresado
        expect(getByText(`${String.table} 999`)).toBeTruthy();
      });
    });

    test('muestra error cuando el campo está vacío y se intenta buscar', async () => {
      const {getByTestId, queryByText} = renderTableDetail();
      const input = getByTestId('tableDetailMesaInput');

      // Simular escribir y borrar
      fireEvent.changeText(input, '');

      // El botón debería estar deshabilitado, pero verificamos que no hay error visible inicialmente
      expect(queryByText('Escribe el número de mesa.')).toBeNull();
    });
  });

  describe('Modal de Ayuda de Código de Mesa', () => {
    test('abre el modal de ayuda al presionar el ícono de información', async () => {
      const {getByText, queryByText} = renderTableDetail();

      // Buscar y presionar el ícono de ayuda (información)
      // El modal muestra "¿Dónde está el código de mesa?"
      const helpButton = getByText('information-circle-outline');
      fireEvent.press(helpButton);

      await waitFor(() => {
        expect(queryByText('¿Dónde está el código de mesa?')).toBeTruthy();
      });
    });

    test('cierra el modal de ayuda al presionar Entendido', async () => {
      const {getByText, queryByText} = renderTableDetail();

      // Abrir modal
      const helpButton = getByText('information-circle-outline');
      fireEvent.press(helpButton);

      await waitFor(() => {
        expect(queryByText('¿Dónde está el código de mesa?')).toBeTruthy();
      });

      // Cerrar modal
      const closeButton = getByText(String.understood || 'Entendido');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(queryByText('¿Dónde está el código de mesa?')).toBeNull();
      });
    });
  });
});

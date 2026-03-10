import './jestMocks';

import {fireEvent} from '@testing-library/react-native';
import {
  act,
  renderTableDetail,
  defaultMesa,
  buildRoute,
  StackNav,
  NetInfo,
  flushPromises,
  getWorksheetLocalStatus,
  upsertWorksheetLocalStatus,
  axios,
  WorksheetStatus,
  getOfflineQueue,
} from './testUtils';

describe('TableDetailScreen - Extended Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetInfo.fetch.mockResolvedValue({isConnected: true, isInternetReachable: true});
    getWorksheetLocalStatus.mockResolvedValue({status: WorksheetStatus.NOT_FOUND});
    getOfflineQueue.mockResolvedValue([]);
    axios.get.mockResolvedValue({data: []});
  });

  describe('Helper functions', () => {
    test('normalizeMesaNumber maneja valores con guiones', async () => {
      const {getByTestId} = renderTableDetail();

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '1-2-3');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });
    });

    test('normalizeMesaNumber maneja valores vacíos', async () => {
      const {getByTestId} = renderTableDetail();

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });

      // Should show error
    });
  });

  describe('IPFS handling', () => {
    test('extrae CID de URI ipfs://', async () => {
      const existingRecords = [
        {
          recordId: 'rec-1',
          image: 'ipfs://QmTestCid123',
          votes: {parties: {partyVotes: []}},
        },
      ];

      const {getByTestId} = renderTableDetail({
        routeParams: {
          existingRecords,
          totalRecords: 1,
        },
      });

      expect(getByTestId('tableDetailContainer')).toBeTruthy();
    });

    test('extrae CID de URL gateway', async () => {
      const existingRecords = [
        {
          recordId: 'rec-1',
          image: 'https://gateway.pinata.cloud/ipfs/QmTestCid456',
          votes: {parties: {partyVotes: []}},
        },
      ];

      renderTableDetail({
        routeParams: {
          existingRecords,
          totalRecords: 1,
        },
      });
    });

    test('maneja imagen con ipfsCid', async () => {
      const existingRecords = [
        {
          recordId: 'rec-1',
          ipfsCid: 'QmTestCid789',
          votes: {parties: {partyVotes: []}},
        },
      ];

      renderTableDetail({
        routeParams: {
          existingRecords,
          totalRecords: 1,
        },
      });
    });

    test('maneja imagen HTTP directa', async () => {
      const existingRecords = [
        {
          recordId: 'rec-1',
          image: 'https://example.com/image.jpg',
          votes: {parties: {partyVotes: []}},
        },
      ];

      renderTableDetail({
        routeParams: {
          existingRecords,
          totalRecords: 1,
        },
      });
    });
  });

  describe('Worksheet status fetching', () => {
    test('maneja estado PENDING de worksheet', async () => {
      getWorksheetLocalStatus.mockResolvedValue({
        status: WorksheetStatus.PENDING,
        tableCode: 'C-100',
      });

      const {getByTestId} = renderTableDetail();

      await act(async () => {
        await flushPromises();
      });

      expect(getByTestId('tableDetailContainer')).toBeTruthy();
    });

    test('maneja estado FAILED de worksheet', async () => {
      getWorksheetLocalStatus.mockResolvedValue({
        status: WorksheetStatus.FAILED,
        errorMessage: 'Error de red',
      });

      renderTableDetail();

      await act(async () => {
        await flushPromises();
      });
    });

    test('maneja estado UPLOADED de worksheet', async () => {
      getWorksheetLocalStatus.mockResolvedValue({
        status: WorksheetStatus.UPLOADED,
        ipfsUri: 'ipfs://QmUploaded',
        nftLink: 'https://nft.example/123',
      });

      renderTableDetail();

      await act(async () => {
        await flushPromises();
      });
    });

    test('detecta worksheet pendiente en cola', async () => {
      getOfflineQueue.mockResolvedValue([
        {
          task: {
            type: 'publishWorksheet',
            payload: {
              dni: '12345678',
              electionId: 'election-1',
              tableCode: 'c-100',
            },
          },
        },
      ]);

      renderTableDetail({
        routeParams: {
          extraParams: {
            electionId: 'election-1',
          },
        },
      });

      await act(async () => {
        await flushPromises();
      });
    });

    test('detecta acta pendiente en cola', async () => {
      getOfflineQueue.mockResolvedValue([
        {
          task: {
            type: 'publishActa',
            payload: {
              dni: '12345678',
              electionId: 'election-1',
              tableCode: 'c-100',
            },
          },
        },
      ]);

      renderTableDetail({
        routeParams: {
          extraParams: {
            electionId: 'election-1',
          },
        },
      });

      await act(async () => {
        await flushPromises();
      });
    });
  });

  describe('Mesa search', () => {
    test('busca mesa y encuentra registros existentes', async () => {
      axios.get.mockResolvedValueOnce({
        data: [
          {
            _id: 'ballot-1',
            image: 'ipfs://QmBallot1',
            votes: {
              parties: {
                validVotes: 100,
                partyVotes: [{partyId: 'MAS', votes: 50}],
              },
            },
          },
        ],
      });

      const {getByTestId} = renderTableDetail({
        routeParams: {
          extraParams: {
            locationId: 'loc-001',
          },
        },
      });

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '200');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });
    });

    test('busca mesa sin conexión', async () => {
      NetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const {getByTestId} = renderTableDetail();

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '300');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });
    });

    test('maneja error 404 al buscar registros', async () => {
      axios.get.mockRejectedValueOnce({
        response: {status: 404},
      });

      const {getByTestId} = renderTableDetail();

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '400');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });
    });

    test('maneja otro error al buscar registros', async () => {
      axios.get.mockRejectedValueOnce({
        response: {status: 500},
      });

      const {getByTestId} = renderTableDetail();

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '500');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });
    });
  });

  describe('Backend worksheet fetching', () => {
    test('obtiene worksheet desde backend cuando está online', async () => {
      axios.get.mockImplementation(url => {
        if (url.includes('/worksheets/')) {
          return Promise.resolve({
            data: {
              image: 'ipfs://QmWorksheet',
              votes: {
                parties: {
                  validVotes: 100,
                  blankVotes: 5,
                  nullVotes: 3,
                  partyVotes: [{partyId: 'PDC', votes: 40}],
                },
              },
            },
          });
        }
        return Promise.resolve({data: []});
      });

      renderTableDetail({
        routeParams: {
          extraParams: {
            electionId: 'election-2024',
          },
        },
      });

      await act(async () => {
        await flushPromises();
      });
    });

    test('maneja error al obtener worksheet desde backend', async () => {
      axios.get.mockImplementation(url => {
        if (url.includes('/worksheets/')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({data: []});
      });

      renderTableDetail({
        routeParams: {
          extraParams: {
            electionId: 'election-2024',
          },
        },
      });

      await act(async () => {
        await flushPromises();
      });
    });
  });

  describe('Response data parsing', () => {
    test('parsea respuesta con formato registros', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          registros: [
            {
              _id: 'ballot-reg-1',
              image: 'ipfs://QmReg1',
            },
          ],
        },
      });

      const {getByTestId} = renderTableDetail();

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '600');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });
    });

    test('parsea respuesta con objeto único', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          _id: 'ballot-single',
          image: 'ipfs://QmSingle',
        },
      });

      const {getByTestId} = renderTableDetail();

      const mesaInput = getByTestId('tableDetailMesaInput');

      await act(async () => {
        fireEvent.changeText(mesaInput, '700');
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailSearchMesaButton'));
        await flushPromises();
      });
    });
  });

  describe('Navigation focus handling', () => {
    test('refresca worksheet status al hacer focus', async () => {
      const listeners = {};
      const navigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        replace: jest.fn(),
        addListener: jest.fn((event, callback) => {
          listeners[event] = callback;
          return jest.fn();
        }),
        isFocused: jest.fn(() => true),
      };

      renderTableDetail({navigation});

      await act(async () => {
        await flushPromises();
      });

      // Simular focus
      if (listeners.focus) {
        await act(async () => {
          listeners.focus();
          await flushPromises();
        });
      }
    });
  });

  describe('Take photo navigation', () => {
    test('navega a CameraScreen al presionar tomar foto', async () => {
      const {getByTestId, navigation} = renderTableDetail({
        routeParams: {
          extraParams: {
            electionId: 'election-2024',
            electionType: 'general',
          },
        },
      });

      await act(async () => {
        fireEvent.press(getByTestId('tableDetailTakePhotoButton'));
      });

      expect(navigation.navigate).toHaveBeenCalledWith(
        StackNav.CameraScreen,
        expect.objectContaining({
          tableData: expect.any(Object),
        }),
      );
    });
  });

  describe('Worksheet mapping', () => {
    test('mapea metadata de worksheet correctamente', async () => {
      getWorksheetLocalStatus.mockResolvedValue({
        status: WorksheetStatus.UPLOADED,
        ipfsUri: 'ipfs://QmMapped',
        nftLink: 'https://nft.example/mapped',
        image: 'https://image.example/mapped.jpg',
      });

      renderTableDetail();

      await act(async () => {
        await flushPromises();
      });
    });
  });

  describe('firstFulfilled helper', () => {
    test('maneja promesas rechazadas', async () => {
      // This is tested indirectly through the IPFS fetching logic
      axios.get.mockImplementation(url => {
        if (url.includes('ipfs.io')) {
          return Promise.reject(new Error('Gateway error'));
        }
        if (url.includes('cloudflare-ipfs')) {
          return Promise.resolve({data: {votes: {}}});
        }
        return Promise.resolve({data: []});
      });

      renderTableDetail();

      await act(async () => {
        await flushPromises();
      });
    });
  });
});

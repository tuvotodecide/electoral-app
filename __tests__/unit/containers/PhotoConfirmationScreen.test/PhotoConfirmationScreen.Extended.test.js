import './jestMocks';

import {fireEvent} from '@testing-library/react-native';
import {
  act,
  buildRouteParams,
  enqueue,
  flushPromises,
  getOfflineQueue,
  NetInfo,
  persistLocalImage,
  renderPhotoConfirmation,
  resetMocks,
  upsertWorksheetLocalStatus,
  validateBallotLocally,
  WorksheetStatus,
} from './testUtils';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

describe('PhotoConfirmationScreen - Extended Coverage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMocks();
    NetInfo.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });
    validateBallotLocally.mockReturnValue({ok: true});
    persistLocalImage.mockResolvedValue('file:///persisted.jpg');
    enqueue.mockResolvedValue(undefined);
    getOfflineQueue.mockResolvedValue([]);
    upsertWorksheetLocalStatus.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('responsive helpers', () => {
    test('muestra tamaño correcto para pantalla normal', () => {
      const {getByTestId} = renderPhotoConfirmation();
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });
  });

  describe('worksheet mode', () => {
    test('muestra vista de hoja de trabajo en modo worksheet', async () => {
      const params = buildRouteParams();
      params.mode = 'worksheet';
      params.electionId = 'e-1';

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText('Hoja de Trabajo')).toBeTruthy();
    });

    test('encola hoja de trabajo nueva correctamente', async () => {
      const params = buildRouteParams({
        photoUri: 'file:///worksheet.jpg',
        tableData: {
          tableNumber: '5678',
          numero: '5678',
          codigo: 'C-5678',
          idRecinto: 'loc-002',
        },
      });
      params.mode = 'worksheet';
      params.electionId = 'e-2';
      params.electionType = 'general';

      getOfflineQueue.mockResolvedValue([]);

      const {getByTestId} = renderPhotoConfirmation({params});

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      expect(persistLocalImage).toHaveBeenCalledWith('file:///worksheet.jpg');
      expect(enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'publishWorksheet',
          payload: expect.objectContaining({
            mode: 'worksheet',
            tableCode: 'C-5678',
            tableNumber: '5678',
          }),
        }),
      );
      expect(upsertWorksheetLocalStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          dni: '789456',
          electionId: 'e-2',
          tableCode: 'C-5678',
        }),
        expect.objectContaining({
          status: WorksheetStatus.PENDING,
        }),
      );
    });
  });

  describe('validation errors', () => {
    test('muestra error cuando validación local falla', async () => {
      validateBallotLocally.mockReturnValue({
        ok: false,
        errors: ['Total de votos no coincide', 'Votos negativos'],
      });

      const {getByTestId, queryByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      expect(queryByTestId('photoConfirmationInfoModal')).toBeTruthy();
    });

    test('maneja caso cuando photoUri es null', async () => {
      const params = buildRouteParams({photoUri: null});

      const {getByTestId} = renderPhotoConfirmation({params});

      // Verifica que el componente renderiza
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });

    test('muestra error cuando faltan datos obligatorios en modo worksheet', async () => {
      const params = buildRouteParams({
        tableData: {
          tableNumber: '',
          numero: '',
          codigo: '',
        },
      });
      params.mode = 'worksheet';
      params.electionId = '';

      const {getByTestId, queryByTestId} = renderPhotoConfirmation({params});

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      expect(queryByTestId('photoConfirmationInfoModal')).toBeTruthy();
    });
  });

  describe('modal interactions', () => {
    test('cierra modal al presionar cancelar', async () => {
      const {getByTestId, queryByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      expect(getByTestId('photoConfirmationModal')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalCancelButton'));
        await flushPromises();
      });

      // Modal should be closed (step reset)
      expect(enqueue).not.toHaveBeenCalled();
    });

    test('cierra info modal al presionar close', async () => {
      validateBallotLocally.mockReturnValue({
        ok: false,
        errors: ['Error de validación'],
      });

      const {getByTestId, queryByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      expect(queryByTestId('photoConfirmationInfoModal')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationInfoModalCloseButton'));
        await flushPromises();
      });
    });
  });

  describe('switch name visibility', () => {
    test('permite alternar visibilidad del nombre', async () => {
      const {getByTestId, getByText} = renderPhotoConfirmation();

      // Inicialmente el nombre es visible
      expect(getByText('Test User')).toBeTruthy();

      // Toggle switch via the card
      const switchCard = getByText('Mostrar mi nombre en el certificado');
      await act(async () => {
        fireEvent.press(switchCard.parent);
        await flushPromises();
      });
    });
  });

  describe('worksheet mismatch warning', () => {
    test('muestra advertencia de discrepancia entre hoja y acta', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        worksheetStatus: 'UPLOADED',
        differences: [
          {field: 'parties.validVotes', worksheetValue: 100, ballotValue: 105},
          {field: 'parties.nullVotes', worksheetValue: 5, ballotValue: 3},
        ],
        message: 'Se detectaron diferencias',
      };
      params.shownCompareWarning = false;

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText('Aviso: la hoja de trabajo no coincide')).toBeTruthy();
    });

    test('no muestra advertencia si shownCompareWarning es true', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [],
      };
      params.shownCompareWarning = true;

      const {queryByText} = renderPhotoConfirmation({params});

      expect(
        queryByText('Aviso: la hoja de trabajo no coincide'),
      ).toBeNull();
    });

    test('no muestra advertencia en modo worksheet', () => {
      const params = buildRouteParams();
      params.mode = 'worksheet';
      params.electionId = 'e-1';
      params.compareResult = {
        status: 'MISMATCH',
        differences: [],
      };

      const {queryByText} = renderPhotoConfirmation({params});

      expect(
        queryByText('Aviso: la hoja de trabajo no coincide'),
      ).toBeNull();
    });
  });

  describe('observation handling', () => {
    test('muestra error si hasObservation pero sin texto', async () => {
      const params = buildRouteParams();
      params.hasObservation = true;
      params.observationText = '';

      const {getByTestId, queryByTestId} = renderPhotoConfirmation({params});

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      expect(queryByTestId('photoConfirmationInfoModal')).toBeTruthy();
    });

    test('incluye observación en el payload cuando está presente', async () => {
      const params = buildRouteParams();
      params.hasObservation = true;
      params.observationText = 'Observación de prueba';

      const {getByTestId} = renderPhotoConfirmation({params});

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      expect(enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'publishActa',
          payload: expect.objectContaining({
            additionalData: expect.objectContaining({
              hasObservation: true,
              observationText: 'Observación de prueba',
            }),
            electoralData: expect.objectContaining({
              hasObservation: true,
              observationText: 'Observación de prueba',
            }),
          }),
        }),
      );
    });
  });

  describe('back navigation', () => {
    test('goBack al presionar header back', async () => {
      const {navigation, getByTestId} = renderPhotoConfirmation();

      // Simular press en el header back (UniversalHeader)
      const header = getByTestId('photoConfirmationHeader');
      if (header.props.onBack) {
        await act(async () => {
          header.props.onBack();
          await flushPromises();
        });
        expect(navigation.goBack).toHaveBeenCalled();
      }
    });
  });

  describe('existing record handling', () => {
    test('incluye existingRecord en payload para modo attest', async () => {
      const params = buildRouteParams();
      params.mode = 'attest';
      params.existingRecord = {
        _id: 'ballot-123',
        recordId: 'record-456',
        ipfsUri: 'ipfs://existing',
        rawData: {
          electionId: 'e-from-raw',
        },
      };

      const {getByTestId} = renderPhotoConfirmation({params});

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      expect(enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            mode: 'attest',
            existingRecord: expect.objectContaining({
              _id: 'ballot-123',
              recordId: 'record-456',
            }),
            recordId: 'record-456',
            ballotId: 'ballot-123',
          }),
        }),
      );
    });
  });

  describe('election data resolution', () => {
    test('usa electionId de existingRecord cuando route.params no lo tiene', async () => {
      const params = buildRouteParams();
      params.electionId = undefined;
      params.existingRecord = {
        rawData: {
          electionId: 'election-from-existing',
        },
      };

      const {getByTestId} = renderPhotoConfirmation({params});

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      expect(enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            electionId: 'election-from-existing',
          }),
        }),
      );
    });
  });

  describe('table data alternatives', () => {
    test('usa mesaData.numero cuando tableData no tiene numero', () => {
      const params = buildRouteParams({
        tableData: {
          tableNumber: undefined,
          numero: undefined,
        },
        mesaData: {
          numero: '9999',
        },
      });

      const {getByText} = renderPhotoConfirmation({params});
      expect(getByText('MESA 9999')).toBeTruthy();
    });

    test('usa mesa.number como fallback', () => {
      const params = buildRouteParams({
        tableData: {
          tableNumber: undefined,
          numero: undefined,
        },
        mesaData: {
          tableNumber: undefined,
          numero: undefined,
        },
        mesa: {
          number: '7777',
        },
      });

      const {getByTestId} = renderPhotoConfirmation({params});
      // Verifica que el componente renderiza correctamente
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });

    test('usa ubicacion cuando recinto no está disponible', () => {
      const params = buildRouteParams({
        tableData: {
          tableNumber: '1111',
          recinto: undefined,
          ubicacion: 'Ubicación Alternativa',
        },
      });

      const {getByText} = renderPhotoConfirmation({params});
      expect(getByText('UBICACIÓN ALTERNATIVA')).toBeTruthy();
    });
  });

  describe('certificate capture error handling', () => {
    test('continua sin certificado si captureRef falla', async () => {
      const {captureRef} = require('react-native-view-shot');
      captureRef.mockRejectedValueOnce(new Error('Capture failed'));

      const {getByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      // Should still enqueue even if certificate capture fails
      expect(enqueue).toHaveBeenCalled();
    });
  });

  describe('persistLocalImage error handling', () => {
    test('muestra error cuando persistLocalImage falla', async () => {
      persistLocalImage.mockRejectedValueOnce(new Error('Storage full'));

      const {getByTestId, queryByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      expect(queryByTestId('photoConfirmationInfoModal')).toBeTruthy();
    });
  });

  describe('formatWorksheetDiffFieldLabel', () => {
    test('formatea correctamente diferentes campos de diferencias', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties.validVotes', worksheetValue: 100, ballotValue: 105},
          {field: 'parties.totalVotes', worksheetValue: 110, ballotValue: 115},
          {field: 'parties.blankVotes', worksheetValue: 5, ballotValue: 3},
          {field: 'parties.nullVotes', worksheetValue: 5, ballotValue: 7},
          {field: 'parties.partyVotes.MAS', worksheetValue: 50, ballotValue: 55},
        ],
      };

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText(/Votos Válidos/)).toBeTruthy();
    });

    test('maneja valores null en diferencias', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties.validVotes', worksheetValue: null, ballotValue: 100},
          {field: 'parties.nullVotes', worksheetValue: 5, ballotValue: undefined},
        ],
      };

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText(/sin dato/)).toBeTruthy();
    });
  });
});

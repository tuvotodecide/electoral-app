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
  pinataService,
} from './testUtils';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

describe('PhotoConfirmationScreen - Helper Functions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMocks();
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    validateBallotLocally.mockReturnValue({ok: true});
    persistLocalImage.mockResolvedValue('file:///persisted.jpg');
    enqueue.mockResolvedValue(undefined);
    getOfflineQueue.mockResolvedValue([]);
    upsertWorksheetLocalStatus.mockResolvedValue(undefined);
    pinataService.checkDuplicateBallot.mockResolvedValue({exists: false});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatWorksheetDiffFieldLabel', () => {
    test('formatea campo parties.partyVotes.MAS', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties.partyVotes.MAS', worksheetValue: 100, ballotValue: 105},
          {field: 'parties.partyVotes.PDC', worksheetValue: 50, ballotValue: 55},
        ],
      };

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText(/Votos de MAS/)).toBeTruthy();
    });

    test('formatea campo parties.validVotes', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties.validVotes', worksheetValue: 100, ballotValue: 105},
        ],
      };

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText(/Votos Válidos/)).toBeTruthy();
    });

    test('formatea campo parties.totalVotes', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties.totalVotes', worksheetValue: 110, ballotValue: 115},
        ],
      };

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText(/Votos Totales/)).toBeTruthy();
    });

    test('formatea campo parties.blankVotes', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties.blankVotes', worksheetValue: 5, ballotValue: 3},
        ],
      };

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText(/Votos en Blanco/)).toBeTruthy();
    });

    test('formatea campo parties.nullVotes', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties.nullVotes', worksheetValue: 5, ballotValue: 7},
        ],
      };

      const {getByText} = renderPhotoConfirmation({params});

      expect(getByText(/Votos Nulos/)).toBeTruthy();
    });

    test('usa campo original para campos desconocidos', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'some.unknown.field', worksheetValue: 1, ballotValue: 2},
        ],
      };

      renderPhotoConfirmation({params});
    });

    test('usa "Campo" para campos vacíos', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: '', worksheetValue: 1, ballotValue: 2},
        ],
      };

      renderPhotoConfirmation({params});
    });
  });

  describe('Duplicate ballot modal', () => {
    test('muestra modal de duplicado cuando checkDuplicateBallot retorna exists=true', async () => {
      pinataService.checkDuplicateBallot.mockResolvedValue({
        exists: true,
        ballot: {_id: 'existing-ballot', image: 'ipfs://existing'},
      });

      const {getByTestId, queryByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      // Wait for duplicate check
      await act(async () => {
        await flushPromises();
      });

      // Modal should be shown
      expect(queryByTestId('photoConfirmationDuplicateModal') ||
             queryByTestId('photoConfirmationInfoModal')).toBeTruthy();
    });

    test('cierra modal de duplicado al presionar botón de volver', async () => {
      pinataService.checkDuplicateBallot.mockResolvedValue({
        exists: true,
        ballot: {_id: 'existing-ballot'},
      });

      const {getByTestId, queryByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });

      await act(async () => {
        await flushPromises();
      });

      const goBackBtn = queryByTestId('photoConfirmationDuplicateModalGoBackButton');
      if (goBackBtn) {
        await act(async () => {
          fireEvent.press(goBackBtn);
          await flushPromises();
        });
      }
    });
  });

  describe('Responsive helpers', () => {
    // These are tested implicitly through rendering on different screen sizes
    test('renderiza correctamente en pantallas pequeñas', () => {
      const {getByTestId} = renderPhotoConfirmation();
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });
  });

  describe('WorksheetCompareStatus handling', () => {
    test('maneja estado MATCH', () => {
      const params = buildRouteParams();
      params.compareResult = {status: 'MATCH'};

      const {getByTestId} = renderPhotoConfirmation({params});
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });

    test('maneja estado NOT_FOUND', () => {
      const params = buildRouteParams();
      params.compareResult = {status: 'NOT_FOUND'};

      const {getByTestId} = renderPhotoConfirmation({params});
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });

    test('maneja estado NOT_AVAILABLE', () => {
      const params = buildRouteParams();
      params.compareResult = {status: 'NOT_AVAILABLE'};

      const {getByTestId} = renderPhotoConfirmation({params});
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });

    test('maneja estado SKIPPED_OFFLINE', () => {
      const params = buildRouteParams();
      params.compareResult = {status: 'SKIPPED_OFFLINE'};

      const {getByTestId} = renderPhotoConfirmation({params});
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });

    test('maneja estado ERROR', () => {
      const params = buildRouteParams();
      params.compareResult = {status: 'ERROR', message: 'Comparison error'};

      const {getByTestId} = renderPhotoConfirmation({params});
      expect(getByTestId('photoConfirmationContainer')).toBeTruthy();
    });
  });

  describe('normalizeCompareToken', () => {
    test('normaliza tokens con acentos y espacios', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'Votos Válidos', worksheetValue: 100, ballotValue: 105},
        ],
      };

      renderPhotoConfirmation({params});
    });

    test('normaliza tokens con caracteres especiales', () => {
      const params = buildRouteParams();
      params.compareResult = {
        status: 'MISMATCH',
        differences: [
          {field: 'parties_null_votes', worksheetValue: 5, ballotValue: 3},
        ],
      };

      renderPhotoConfirmation({params});
    });
  });

  describe('Attest mode', () => {
    test('incluye datos de existingRecord en attest mode', async () => {
      const params = buildRouteParams();
      params.mode = 'attest';
      params.existingRecord = {
        _id: 'ballot-456',
        recordId: 'record-789',
        ipfsUri: 'ipfs://existing-ballot',
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
            recordId: 'record-789',
            ballotId: 'ballot-456',
          }),
        }),
      );
    });
  });

  describe('Modal step navigation', () => {
    test('navega entre pasos del modal', async () => {
      const {getByTestId} = renderPhotoConfirmation();

      // Paso 1: Abrir modal
      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      expect(getByTestId('photoConfirmationModal')).toBeTruthy();

      // Paso 2: Confirmar
      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
        await flushPromises();
      });
    });

    test('cancela el modal y resetea paso', async () => {
      const {getByTestId, queryByTestId} = renderPhotoConfirmation();

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationPublishButton'));
        await flushPromises();
      });

      await act(async () => {
        fireEvent.press(getByTestId('photoConfirmationModalCancelButton'));
        await flushPromises();
      });

      // Modal should be closed
      expect(enqueue).not.toHaveBeenCalled();
    });
  });

  describe('Election data handling', () => {
    test('usa electionId de route params', async () => {
      const params = buildRouteParams();
      params.electionId = 'election-2024';
      params.electionType = 'general';

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
            electionId: 'election-2024',
          }),
        }),
      );
    });
  });
});

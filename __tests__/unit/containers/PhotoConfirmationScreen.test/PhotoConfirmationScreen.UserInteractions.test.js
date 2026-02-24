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
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

describe('PhotoConfirmationScreen - Interacciones de Usuario', () => {
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

  test('encola el acta al confirmar y muestra paso final', async () => {
    const {getByTestId, navigation} = renderPhotoConfirmation();

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
      await flushPromises();
    });

    expect(persistLocalImage).toHaveBeenCalledWith('file:///acta.jpg');
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'publishActa',
      }),
    );
    expect(getByTestId('photoConfirmationModalFinishedSubtext')).toBeTruthy();
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  test('al presionar Ir al Inicio resetea navegacion al Home', async () => {
    const {getByTestId, navigation} = renderPhotoConfirmation();

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
      await flushPromises();
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationModalGoHomeButton'));
      await flushPromises();
    });

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: {screen: TabNav.HomeScreen},
        },
      ],
    });
  });

  test('en modo worksheet deduplica cola y evita encolar duplicado', async () => {
    const params = buildRouteParams({
      photoUri: 'file:///worksheet.jpg',
      tableData: {
        tableNumber: '1234',
        numero: '1234',
        codigo: 'C-1234',
      },
    });
    params.mode = 'worksheet';
    params.electionId = 'e-1';
    params.electionType = 'general';

    getOfflineQueue.mockResolvedValue([
      {
        task: {
          type: 'publishWorksheet',
          payload: {
            additionalData: {
              dni: '789456',
              electionId: 'e-1',
              tableCode: 'C-1234',
            },
          },
        },
      },
    ]);

    const {getByTestId} = renderPhotoConfirmation({params});

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
      await flushPromises();
    });

    expect(upsertWorksheetLocalStatus).toHaveBeenCalledWith(
      {
        dni: '789456',
        electionId: 'e-1',
        tableCode: 'C-1234',
      },
      {
        status: WorksheetStatus.PENDING,
        errorMessage: undefined,
      },
    );
    expect(persistLocalImage).not.toHaveBeenCalledWith('file:///worksheet.jpg');
    expect(enqueue).not.toHaveBeenCalledWith(
      expect.objectContaining({type: 'publishWorksheet'}),
    );
    const doneText = getByTestId('photoConfirmationModalFinishedSubtext');
    const finalMessage = Array.isArray(doneText.props.children)
      ? doneText.props.children.join(' ')
      : String(doneText.props.children);
    expect(finalMessage).toContain('ya estaba en cola');
  });
});

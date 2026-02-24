import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import PhotoReviewScreenNew from '../../../../src/container/Vote/UploadRecord/PhotoReviewScreen_new';
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';
import {validateBallotLocally} from '../../../../src/utils/ballotValidation';
import {enqueue, getAll as getOfflineQueue} from '../../../../src/utils/offlineQueue';
import {persistLocalImage} from '../../../../src/utils/persistLocalImage';
import {
  WorksheetStatus,
  upsertWorksheetLocalStatus,
} from '../../../../src/utils/worksheetLocalStatus';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockUseRoute = jest.fn();

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
}));

jest.mock('axios', () => ({
  post: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => {
  const fetch = jest.fn();
  return {
    fetch,
    default: {fetch},
  };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: mockReset,
    }),
    useRoute: () => mockUseRoute(),
  };
});

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector =>
    selector({
      theme: {
        theme: {
          primary: '#17694A',
          text: '#111111',
          background: '#FFFFFF',
        },
      },
      wallet: {
        payload: {
          id: 'user-1',
          dni: '12345678',
          did: 'did:test:1',
          privKey: 'priv',
          vc: {credentialSubject: {fullName: 'Test User'}},
        },
      },
    }),
  ),
}));

jest.mock('../../../../src/utils/ballotValidation', () => ({
  validateBallotLocally: jest.fn(() => ({ok: true})),
}));
jest.mock('../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(async () => 'api-key'),
}));
jest.mock('../../../../src/utils/Cifrate', () => ({
  getCredentialSubjectFromPayload: jest.fn(() => ({
    fullName: 'Test User',
    nationalIdNumber: '12345678',
  })),
}));
jest.mock('../../../../src/utils/offlineQueue', () => ({
  enqueue: jest.fn(),
  getAll: jest.fn(),
}));
jest.mock('../../../../src/utils/persistLocalImage', () => ({
  persistLocalImage: jest.fn(),
}));
jest.mock('../../../../src/utils/worksheetLocalStatus', () => ({
  WorksheetStatus: {
    NOT_FOUND: 'NOT_FOUND',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
    UPLOADED: 'UPLOADED',
  },
  upsertWorksheetLocalStatus: jest.fn(),
}));

jest.mock('../../../../src/components/modal/InfoModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({
    visible,
    title,
    message,
    buttonText = 'OK',
    secondaryButtonText,
    onClose,
    onSecondaryPress,
  }) => {
    if (!visible) {
      return null;
    }
    return React.createElement(
      View,
      {testID: 'infoModal'},
      React.createElement(Text, {testID: 'infoModalTitle'}, title),
      React.createElement(Text, {testID: 'infoModalMessage'}, message),
      secondaryButtonText
        ? React.createElement(
            TouchableOpacity,
            {
              testID: 'infoModalSecondaryButton',
              onPress: onSecondaryPress,
            },
            React.createElement(Text, null, secondaryButtonText),
          )
        : null,
      React.createElement(
        TouchableOpacity,
        {testID: 'infoModalCloseButton', onPress: onClose},
        React.createElement(Text, null, buttonText),
      ),
    );
  };
});
jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, ...props}) => React.createElement(Text, props, children);
});
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({name}) => React.createElement('Text', {testID: `icon-${name}`}, name);
});

jest.mock('../../../../src/components/common/BaseRecordReviewScreen', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({
    headerTitle,
    instructionsText,
    actionButtons = [],
    onBack,
    extraContent,
  }) =>
    React.createElement(
      View,
      {testID: 'baseRecordReviewScreen'},
      React.createElement(Text, {testID: 'baseRecordReviewHeaderTitle'}, headerTitle),
      React.createElement(Text, {testID: 'baseRecordReviewInstructions'}, instructionsText),
      React.createElement(
        TouchableOpacity,
        {testID: 'baseRecordReviewBack', onPress: onBack},
        React.createElement(Text, null, 'back'),
      ),
      ...actionButtons.map((btn, idx) =>
        React.createElement(
          TouchableOpacity,
          {
            key: `${btn.text}-${idx}`,
            testID: `baseRecordReviewAction-${idx}`,
            onPress: btn.onPress,
          },
          React.createElement(Text, null, btn.text),
        ),
      ),
      extraContent
        ? React.createElement(
            View,
            {testID: 'baseRecordReviewExtraContent'},
            extraContent,
          )
        : null,
    );
});

describe('PhotoReviewScreen_new', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    validateBallotLocally.mockReturnValue({ok: true});
    getOfflineQueue.mockResolvedValue([]);
    enqueue.mockResolvedValue(undefined);
    persistLocalImage.mockResolvedValue('file:///persisted.jpg');
    upsertWorksheetLocalStatus.mockResolvedValue(undefined);
    axios.post.mockResolvedValue({
      data: {
        status: 'MATCH',
        differences: [],
      },
    });
    mockUseRoute.mockReturnValue({
      params: {
        photoUri: 'file:///acta.jpg',
        tableData: {
          numero: '123',
          tableNumber: '123',
          codigo: 'C-123',
          idRecinto: 'loc-1',
          recinto: 'Recinto Central',
        },
        existingRecord: {
          actaImage: 'file:///existente.jpg',
          partyResults: [{id: 'libre', partido: 'LIBRE', presidente: '1'}],
          voteSummaryResults: [{id: 'validos', label: 'Validos', value1: '1'}],
        },
        isViewOnly: true,
        mode: 'upload',
      },
    });
  });

  test('renders mesa title in review', () => {
    const {getByTestId} = render(<PhotoReviewScreenNew />);

    expect(getByTestId('baseRecordReviewScreen')).toBeTruthy();
    expect(getByTestId('baseRecordReviewHeaderTitle').props.children).toBe(
      'Mesa 123',
    );
  });

  test('in view mode allows continue to PhotoConfirmationScreen', () => {
    const {getByTestId} = render(<PhotoReviewScreenNew />);

    fireEvent.press(getByTestId('baseRecordReviewAction-0'));

    expect(mockNavigate).toHaveBeenCalledWith(
      'PhotoConfirmationScreen',
      expect.objectContaining({
        photoUri: 'file:///acta.jpg',
        mode: 'upload',
      }),
    );
  });

  test('Subir acta button sends user to CameraScreen with current table', () => {
    const {getByText} = render(<PhotoReviewScreenNew />);

    fireEvent.press(getByText('Subir acta'));

    expect(mockNavigate).toHaveBeenCalledWith(
      StackNav.CameraScreen,
      expect.objectContaining({
        tableData: expect.objectContaining({
          codigo: 'C-123',
          numero: '123',
        }),
      }),
    );
  });

  test('blocks next if observation is marked without text', () => {
    mockUseRoute.mockReturnValue({
      params: {
        photoUri: 'file:///acta.jpg',
        tableData: {
          numero: '123',
          tableNumber: '123',
          codigo: 'C-123',
          idRecinto: 'loc-1',
        },
        isViewOnly: false,
        mode: 'upload',
        electionId: 'e-1',
        hasObservation: true,
        observationText: '',
      },
    });

    const {getByTestId} = render(<PhotoReviewScreenNew />);
    fireEvent.press(getByTestId('baseRecordReviewAction-0'));

    expect(getByTestId('infoModalTitle').props.children).toBe('Observacion requerida');
    expect(getByTestId('infoModalMessage').props.children).toContain(
      'debes escribir',
    );
    expect(mockNavigate).not.toHaveBeenCalledWith(
      'PhotoConfirmationScreen',
      expect.any(Object),
    );
  });

  test('on worksheet mismatch shows warning and Continue moves to confirmation', async () => {
    axios.post.mockResolvedValue({
      data: {
        status: 'MISMATCH',
        differences: [
          {
            field: 'parties.validVotes',
            worksheetValue: 15,
            ballotValue: 13,
          },
        ],
      },
    });
    mockUseRoute.mockReturnValue({
      params: {
        photoUri: 'file:///acta.jpg',
        tableData: {
          numero: '123',
          tableNumber: '123',
          codigo: 'C-123',
          idRecinto: 'loc-1',
        },
        isViewOnly: false,
        mode: 'upload',
        electionId: 'e-1',
      },
    });

    const {getByTestId} = render(<PhotoReviewScreenNew />);
    fireEvent.press(getByTestId('baseRecordReviewAction-0'));

    await waitFor(() => {
      expect(getByTestId('infoModalTitle').props.children).toBe(
        'Hoja de trabajo no coincide',
      );
    });

    fireEvent.press(getByTestId('infoModalCloseButton'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        'PhotoConfirmationScreen',
        expect.objectContaining({
          shownCompareWarning: true,
          compareResult: expect.objectContaining({status: 'MISMATCH'}),
        }),
      );
    });
  });

  test('worksheet flow deduplicates queue and closing modal resets to home', async () => {
    getOfflineQueue.mockResolvedValue([
      {
        task: {
          type: 'publishWorksheet',
          payload: {
            additionalData: {
              dni: '12345678',
              electionId: 'e-1',
              tableCode: 'C-123',
            },
          },
        },
      },
    ]);
    mockUseRoute.mockReturnValue({
      params: {
        photoUri: 'file:///worksheet.jpg',
        tableData: {
          numero: '123',
          tableNumber: '123',
          codigo: 'C-123',
          idRecinto: 'loc-1',
        },
        isViewOnly: false,
        mode: 'worksheet',
        electionId: 'e-1',
      },
    });

    const {getByTestId, getByText} = render(<PhotoReviewScreenNew />);
    fireEvent.press(getByTestId('baseRecordReviewAction-0'));

    expect(getByText('Subir Hoja de trabajo')).toBeTruthy();
    fireEvent.press(getByText('CONFIRMAR'));

    await waitFor(() => {
      expect(upsertWorksheetLocalStatus).toHaveBeenCalledWith(
        {
          dni: '12345678',
          electionId: 'e-1',
          tableCode: 'C-123',
        },
        {
          status: WorksheetStatus.PENDING,
          errorMessage: undefined,
        },
      );
    });
    expect(enqueue).not.toHaveBeenCalled();
    expect(getByTestId('infoModalTitle').props.children).toBe('Hoja de trabajo');

    fireEvent.press(getByTestId('infoModalCloseButton'));
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: {screen: TabNav.HomeScreen},
        },
      ],
    });
  });
});

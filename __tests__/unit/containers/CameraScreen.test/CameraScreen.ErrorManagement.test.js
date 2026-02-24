import React from 'react';
import {render, act, waitFor, fireEvent} from '@testing-library/react-native';
import CameraScreen from '../../../../src/container/Vote/UploadRecord/CameraScreen';

jest.mock(
  'react-native/Libraries/Animated/NativeAnimatedHelper',
  () => require('../../../__mocks__/cameraScreen/nativeAnimatedHelper'),
  {virtual: true},
);

jest.mock('react-native', () => require('../../../__mocks__/cameraScreen/reactNative')());
jest.mock('react-native-vision-camera', () =>
  jest.requireActual('../../../__mocks__/cameraScreen/reactNativeVisionCamera'),
);
jest.mock('react-redux', () => jest.requireActual('../../../__mocks__/react-redux'));
jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../../__mocks__/@react-navigation/native'),
);
jest.mock('react-native-image-viewing', () =>
  jest.requireActual('../../../__mocks__/react-native-image-viewing'),
);
jest.mock('react-native-image-picker', () =>
  jest.requireActual('../../../__mocks__/react-native-image-picker'),
);
jest.mock('@react-native-community/netinfo', () =>
  jest.requireActual('../../../__mocks__/@react-native-community/netinfo'),
);
jest.mock('../../../../src/utils/electoralActAnalyzer', () =>
  jest.requireActual('../../../__mocks__/utils/electoralActAnalyzer'),
);
jest.mock('../../../../src/hooks/useNavigationLogger', () =>
  jest.requireActual('../../../__mocks__/hooks/useNavigationLogger'),
);
jest.mock(
  '../../../../src/i18n/String',
  () => require('../../../__mocks__/String').default,
);

const ReactNative = require('react-native');
const {
  setupCameraBaseMocks,
  buildMockRoute,
  createMockNavigation,
  cameraModule,
  flushPromises,
} = require('./testUtils');

const Strings = require('../../../../src/i18n/String');

const {Dimensions, AppState, StatusBar, Image, Alert} = ReactNative;

const flushAsync = async () => {
  await act(async () => {
    await flushPromises();
  });
};

const advanceCameraReady = async () => {
  await act(async () => {
    jest.advanceTimersByTime(4000);
  });
};

const pressCaptureButton = async queries => {
  const captureLabel = queries.getByText(Strings.takePhoto);
  await act(async () => {
    fireEvent.press(captureLabel.parent ?? captureLabel);
  });
};

describe('CameraScreen - Manejo de Errores', () => {
  let mockNavigation;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({legacyFakeTimers: true});

    mockNavigation = createMockNavigation();
    setupCameraBaseMocks({navigation: mockNavigation});

    Dimensions.addEventListener.mockImplementation(() => ({remove: jest.fn()}));
    AppState.addEventListener.mockImplementation(() => ({remove: jest.fn()}));
    StatusBar.setHidden.mockImplementation(jest.fn());
    Image.getSize.mockImplementation((uri, success) => success(1200, 800));
    Alert.alert.mockImplementation(jest.fn());
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  const renderWithDefaults = (overrides = {}) =>
    render(<CameraScreen navigation={mockNavigation} route={buildMockRoute(overrides)} />);

  test('muestra alerta cuando la captura falla', async () => {
    const queries = renderWithDefaults();

    await advanceCameraReady();

    cameraModule.__takePhotoMock.mockRejectedValueOnce(
      new Error('No se pudo capturar'),
    );

    await pressCaptureButton(queries);
    await flushAsync();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        Strings.cameraErrorTitle,
        Strings.cameraErrorMessage,
        expect.arrayContaining([
          expect.objectContaining({text: Strings.accept}),
        ]),
      );
    });
  });

  test('resetea el estado al enfocar la pantalla', async () => {
    renderWithDefaults();

    const focusCall = mockNavigation.addListener.mock.calls.find(
      ([event]) => event === 'focus',
    );
    const focusListener = focusCall?.[1];
    const blurCall = mockNavigation.addListener.mock.calls.find(
      ([event]) => event === 'blur',
    );
    const blurListener = blurCall?.[1];

    expect(typeof focusListener).toBe('function');
    expect(typeof blurListener).toBe('function');

    act(() => {
      focusListener();
      blurListener();
    });

    expect(mockNavigation.addListener).toHaveBeenCalledWith(
      'focus',
      expect.any(Function),
    );
    expect(mockNavigation.addListener).toHaveBeenCalledWith(
      'blur',
      expect.any(Function),
    );
  });

  test('muestra mensaje cuando no hay dispositivo de cámara', async () => {
    cameraModule.useCameraDevice.mockReturnValue(null);

    const {getByText} = renderWithDefaults();

    await waitFor(() => {
      expect(getByText(Strings.cameraNotAvailable)).toBeTruthy();
    });
  });
});

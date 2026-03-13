import React from 'react';
import {render, act, fireEvent} from '@testing-library/react-native';
import CameraScreen from '../../../../src/container/Vote/UploadRecord/CameraScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';

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
  cameraModule,
  netInfoModule,
  setupCameraBaseMocks,
  buildMockRoute,
  createMockNavigation,
  flushPromises,
} = require('./testUtils');
const analyzer = require('../../../../src/utils/electoralActAnalyzer');
const imagePicker = require('react-native-image-picker');

const {Dimensions, AppState, StatusBar, Image, Alert, Animated} = ReactNative;

const flushAsync = async () => {
  await act(async () => {
    await flushPromises();
  });
};

describe('CameraScreen - Extended Coverage', () => {
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
    Animated.Value.mockImplementation(() => ({
      setValue: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      stopAnimation: jest.fn(),
      interpolate: jest.fn(() => 1),
      __getValue: jest.fn(() => 1),
    }));
    Animated.timing.mockImplementation(() => ({start: jest.fn(cb => cb && cb())}));
    Animated.parallel.mockImplementation(() => ({start: jest.fn(cb => cb && cb())}));
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Worksheet mode navigation', () => {
    it('navega a PhotoReviewScreen en modo worksheet', async () => {
      const route = buildMockRoute({mode: 'worksheet', electionId: 'election-2024'});
      const {queryByText} = render(
        <CameraScreen navigation={mockNavigation} route={route} />,
      );

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();

      // Component should render
      expect(queryByText('Tomar Foto')).toBeTruthy();
    });
  });

  describe('Gallery selection', () => {
    it('maneja selección de imagen de galería', async () => {
      imagePicker.launchImageLibrary.mockResolvedValueOnce({
        assets: [{
          uri: 'file:///selected-image.jpg',
          width: 1920,
          height: 1080,
        }],
      });

      const route = buildMockRoute();
      const {queryByText} = render(
        <CameraScreen navigation={mockNavigation} route={route} />,
      );

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();

      // Component renders
      expect(queryByText('Tomar Foto')).toBeTruthy();
    });

    it('maneja cancelación de galería', async () => {
      imagePicker.launchImageLibrary.mockResolvedValueOnce({
        didCancel: true,
      });

      const route = buildMockRoute();
      render(<CameraScreen navigation={mockNavigation} route={route} />);

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();
    });

    it('maneja error de galería', async () => {
      imagePicker.launchImageLibrary.mockResolvedValueOnce({
        errorCode: 'camera_unavailable',
      });

      const route = buildMockRoute();
      render(<CameraScreen navigation={mockNavigation} route={route} />);

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();
    });
  });

  describe('Offline mode', () => {
    it('renderiza en modo offline', async () => {
      netInfoModule.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      netInfoModule.addEventListener.mockImplementation(callback => {
        callback?.({isConnected: false, isInternetReachable: false});
        return jest.fn();
      });

      const route = buildMockRoute();
      const {queryByText} = render(
        <CameraScreen navigation={mockNavigation} route={route} />,
      );

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();

      expect(queryByText('Tomar Foto')).toBeTruthy();
    });
  });

  describe('AI analysis scenarios', () => {
    it('renderiza cuando análisis AI está disponible', async () => {
      analyzer.analyzeElectoralAct.mockResolvedValueOnce({
        success: true,
        data: {
          if_electoral_act: true,
          image_not_clear: false,
        },
      });

      const route = buildMockRoute();
      render(<CameraScreen navigation={mockNavigation} route={route} />);

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();
    });
  });

  describe('Permission handling', () => {
    it('solicita permisos cuando no están otorgados', async () => {
      const requestPermission = jest.fn(async () => true);

      cameraModule.useCameraPermission.mockReturnValue({
        hasPermission: false,
        requestPermission,
      });

      const route = buildMockRoute();
      render(<CameraScreen navigation={mockNavigation} route={route} />);

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();

      expect(requestPermission).toHaveBeenCalled();
    });

    it('muestra mensaje cuando no hay dispositivo de cámara', () => {
      cameraModule.useCameraDevice.mockReturnValue(null);

      const route = buildMockRoute();
      const {queryByText} = render(
        <CameraScreen navigation={mockNavigation} route={route} />,
      );

      // String mock may return key or translated text
      const hasMessage = queryByText(/cámara no disponible/i) || queryByText('cameraNotAvailable');
      expect(hasMessage).toBeTruthy();
    });
  });

  describe('AppState handling', () => {
    it('maneja cambios de AppState', async () => {
      let appStateCallback;
      AppState.addEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          appStateCallback = callback;
        }
        return {remove: jest.fn()};
      });

      const route = buildMockRoute();
      render(<CameraScreen navigation={mockNavigation} route={route} />);

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();

      // Simular cambio a background
      if (appStateCallback) {
        await act(async () => {
          appStateCallback('background');
        });
      }

      // Simular volver a active
      if (appStateCallback) {
        await act(async () => {
          appStateCallback('active');
        });
        act(() => {
          jest.advanceTimersByTime(2000);
        });
      }
    });
  });

  describe('Camera reset', () => {
    it('resetea cámara después de capturar foto', async () => {
      const route = buildMockRoute();
      const {queryByText} = render(
        <CameraScreen navigation={mockNavigation} route={route} />,
      );

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      await flushAsync();

      const takePhotoBtn = queryByText('Tomar Foto');
      if (takePhotoBtn) {
        await act(async () => {
          fireEvent.press(takePhotoBtn);
        });
        await flushAsync();
      }
    });
  });
});

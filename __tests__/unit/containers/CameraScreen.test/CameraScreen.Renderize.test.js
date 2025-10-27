import React from 'react';
import {render, act} from '@testing-library/react-native';
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
const {cameraModule, setupCameraBaseMocks, buildMockRoute, createMockNavigation} = require('./testUtils');

const {Dimensions, AppState, StatusBar, Image, Alert, Animated} = ReactNative;

describe('CameraScreen - Renderizado', () => {
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
      addListener: jest.fn(),
      removeListener: jest.fn(),
      stopAnimation: jest.fn(),
      interpolate: jest.fn(() => 1),
    }));
    Animated.timing.mockImplementation(() => ({start: jest.fn()}));
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test('muestra mensaje cuando no hay dispositivo o permisos', () => {
    cameraModule.useCameraDevice.mockReturnValue(null);
    cameraModule.useCameraPermission.mockReturnValue({
      hasPermission: false,
      requestPermission: jest.fn(async () => false),
    });

    const {getByText} = render(
      <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
    );

    expect(getByText('Cámara no disponible')).toBeTruthy();
  });

  test('muestra botón de captura con estados dinámicos', () => {
    const {getByText, queryByText} = render(
      <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
    );

    expect(getByText('Preparando cámara...')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(queryByText('Preparando cámara...')).toBeNull();
    expect(getByText('Tomar Foto')).toBeTruthy();
  });
});

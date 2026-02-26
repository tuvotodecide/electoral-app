import React from 'react';
import {render, act, fireEvent, waitFor} from '@testing-library/react-native';
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

const {Dimensions, AppState, StatusBar, Image, Alert, Animated} = ReactNative;

const flushAsync = async () => {
  await act(async () => {
    await flushPromises();
  });
};

const pressFirstByText = async (text, queries) => {
  const node = queries.getAllByText(text)[0];
  await act(async () => {
    fireEvent.press(node.parent ?? node);
  });
  return node;
};

const capturePhoto = async queries => {
  act(() => {
    jest.advanceTimersByTime(4000);
  });

  await flushAsync();
  expect(queries.getByText('Tomar Foto')).toBeTruthy();

  await pressFirstByText('Tomar Foto', queries);
  await flushAsync();
};

describe('CameraScreen - Interacciones de Usuario', () => {
  let mockNavigation;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({legacyFakeTimers: true});

    mockNavigation = createMockNavigation();
    setupCameraBaseMocks({navigation: mockNavigation});
    netInfoModule.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

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



  test('navega al flujo offline cuando no hay conexión', async () => {
    netInfoModule.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });
    netInfoModule.addEventListener.mockImplementation(callback => {
      callback?.({isConnected: false, isInternetReachable: false});
      return jest.fn();
    });

    const {getByText, getAllByText} = render(
      <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
    );

    await capturePhoto({getByText, getAllByText});

    await pressFirstByText('Continuar', {getAllByText});
    await flushAsync();

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      StackNav.PhotoReviewScreen,
      expect.objectContaining({
        offline: true,
        photoUri: expect.stringMatching(/^file:\/\/.*\.jpg$/),
      }),
    );
  });

  test('muestra modal de error cuando análisis falla', async () => {
    netInfoModule.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    analyzer.analyzeElectoralAct.mockResolvedValueOnce({
      success: false,
      error: 'No se pudo analizar',
    });

    const {getByText, getAllByText} = render(
      <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
    );

    await capturePhoto({getByText, getAllByText});

    await pressFirstByText('Analizar', {getAllByText});
    await flushAsync();

    expect(getByText('No se pudo analizar')).toBeTruthy();
  });
});

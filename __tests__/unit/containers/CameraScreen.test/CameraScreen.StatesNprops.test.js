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

  await waitFor(() => expect(queries.getByText('Tomar Foto')).toBeTruthy());

  await pressFirstByText('Tomar Foto', queries);
  await flushAsync();
};

describe('CameraScreen - Estados y Props', () => {
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

  test('solicita permiso de cámara cuando no está concedido', async () => {
    const requestPermission = jest.fn(async () => true);
    cameraModule.useCameraPermission.mockReturnValue({
      hasPermission: false,
      requestPermission,
    });

    render(<CameraScreen navigation={mockNavigation} route={buildMockRoute()} />);

    await flushAsync();

    expect(requestPermission).toHaveBeenCalled();
  });

  test('captura foto y muestra controles de análisis', async () => {
    const {getByText, getAllByText, queryByText} = render(
      <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
    );

    await capturePhoto({getByText, getAllByText});

    expect(queryByText('Tomar Foto')).toBeNull();
    expect(getAllByText('Tomar Nueva').length).toBeGreaterThan(0);
    expect(getAllByText('Analizar').length).toBeGreaterThan(0);
  });

  test('ejecuta análisis y navega con resultados mapeados', async () => {
    const {getByText, getAllByText} = render(
      <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
    );

    await capturePhoto({getByText, getAllByText});

    await pressFirstByText('Analizar', {getAllByText});
    await flushAsync();

    expect(analyzer.analyzeElectoralAct).toHaveBeenCalledWith(
      'mock-photo-path.jpg',
    );
    expect(analyzer.mapToAppFormat).toHaveBeenCalled();
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      StackNav.PhotoReviewScreen,
      expect.objectContaining({
        photoUri: 'file://mock-photo-path.jpg',
        aiAnalysis: expect.any(Object),
        mappedData: {mapped: true},
      }),
    );
  });
});

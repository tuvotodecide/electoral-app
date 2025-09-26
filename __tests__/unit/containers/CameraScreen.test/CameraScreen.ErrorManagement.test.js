import React from 'react';
import {render, act, fireEvent, waitFor} from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import CameraScreen from '../../../../src/container/Vote/UploadRecord/CameraScreen';

jest.mock(
    'react-native/Libraries/Animated/NativeAnimatedHelper',
    () => ({
        default: {
            addListener: jest.fn(),
            removeListeners: jest.fn(),
        },
        NativeAnimatedModule: {
            addListener: jest.fn(),
            removeListeners: jest.fn(),
            startAnimatingNode: jest.fn(),
            setValue: jest.fn(),
            stopAnimation: jest.fn(),
        },
    }),
    {virtual: true},
);
import {StackNav} from '../../../../src/navigation/NavigationKey';

jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    const React = require('react');
    const {View} = RN;
    const buildAnimatedValue = () => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        stopAnimation: jest.fn(),
        interpolate: jest.fn(() => 1),
    });
    const timingMock = jest.fn(() => ({
        start: jest.fn(callback => callback?.()),
        stop: jest.fn(),
    }));
    const parallelMock = jest.fn(animations => ({
        start: jest.fn(callback => {
            animations?.forEach(anim => anim?.start?.());
            callback?.();
        }),
    }));
    const MockImage = React.forwardRef((props, ref) => <View {...props} ref={ref} />);
    MockImage.getSize = jest.fn((uri, success) => success?.(1200, 800));
    MockImage.getSizeWithHeaders = jest.fn((uri, headers, success) => success?.(1200, 800));
    MockImage.prefetch = jest.fn();
    MockImage.abortPrefetch = jest.fn();
    MockImage.queryCache = jest.fn(async () => ({}));
    const MockModal = ({visible, children, testID = 'mockModal', ...rest}) =>
        visible ? (
            <View accessibilityRole="none" testID={testID} {...rest}>
                {children}
            </View>
        ) : null;
    Object.defineProperty(RN, 'Animated', {
        configurable: true,
        enumerable: true,
        value: {
            Value: jest.fn(() => buildAnimatedValue()),
            timing: timingMock,
            parallel: parallelMock,
            View: React.forwardRef((props, ref) => <View {...props} ref={ref} />),
        },
    });
    Object.defineProperty(RN, 'Image', {
        configurable: true,
        enumerable: true,
        value: MockImage,
    });
    Object.defineProperty(RN, 'Modal', {
        configurable: true,
        enumerable: true,
        value: MockModal,
    });
    Object.defineProperty(RN, 'Dimensions', {
        configurable: true,
        enumerable: true,
        value: {
            get: jest.fn(() => ({width: 1080, height: 1920})),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        },
    });
    Object.defineProperty(RN, 'Platform', {
        configurable: true,
        enumerable: true,
        value: {
            OS: 'android',
            select: jest.fn(options => options?.android ?? options?.default),
        },
    });
    Object.defineProperty(RN, 'StyleSheet', {
        configurable: true,
        enumerable: true,
        value: {
            create: jest.fn(styles => styles),
            flatten: jest.fn(style => {
                if (Array.isArray(style)) {
                    return style.reduce(
                        (acc, item) => ({...acc, ...(item || {})}),
                        {},
                    );
                }
                return style || {};
            }),
            compose: jest.fn((style1, style2) => ({...(style1 || {}), ...(style2 || {})})),
        },
    });
    Object.defineProperty(RN, 'PixelRatio', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: {
            get: jest.fn(() => 2),
            roundToNearestPixel: jest.fn(value => Math.round(value ?? 0)),
        },
    });
    Object.defineProperty(RN, 'StatusBar', {
        configurable: true,
        enumerable: true,
        value: {
            setHidden: jest.fn(),
        },
    });
    Object.defineProperty(RN, 'NativeModules', {
        configurable: true,
        enumerable: true,
        value: {
            ...(RN.NativeModules || {}),
            NativeAnimatedModule: {
                addListener: jest.fn(),
                removeListeners: jest.fn(),
                startAnimatingNode: jest.fn(),
                setValue: jest.fn(),
                stopAnimation: jest.fn(),
            },
        },
    });
    return RN;
});

const {Image, Alert, Dimensions} = ReactNative;
const ImageModule = Image || (ReactNative.Image = {});
const AlertModule = Alert || (ReactNative.Alert = {});
const AppStateModule = ReactNative.AppState || (ReactNative.AppState = {});
const StatusBarModule = ReactNative.StatusBar || (ReactNative.StatusBar = {});
const AnimatedModule = ReactNative.Animated || (ReactNative.Animated = {});
const originalDimensionsListener = Dimensions.addEventListener;
const originalAppStateListener = AppStateModule.addEventListener;
const originalSetHidden = StatusBarModule.setHidden;
const originalGetSize = ImageModule.getSize;
const originalAlert = AlertModule.alert;
const originalAnimatedValue = AnimatedModule.Value;
const originalAnimatedTiming = AnimatedModule.timing;

jest.mock('react-redux', () => ({
    useSelector: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: jest.fn(),
    useRoute: jest.fn(),
}));

jest.mock('react-native-vision-camera', () => {
    const React = require('react');
    const {View} = require('react-native');
    const takePhotoMock = jest.fn(() =>
        Promise.resolve({path: 'mock-photo-path.jpg'}),
    );

    const Camera = React.forwardRef((props, ref) => {
        React.useImperativeHandle(ref, () => ({
            takePhoto: takePhotoMock,
        }));
        return React.createElement(View, {
            ...props,
            testID: props.testID || 'mockCamera',
        });
    });

    return {
        __esModule: true,
        Camera,
        useCameraDevice: jest.fn(() => ({
            id: 'mock-device',
            formats: [{photoWidth: 4000, photoHeight: 3000}],
        })),
        useCameraPermission: jest.fn(() => ({
            hasPermission: true,
            requestPermission: jest.fn(async () => true),
        })),
        __takePhotoMock: takePhotoMock,
    };
});

jest.mock('react-native-image-viewing', () => {
    const React = require('react');
    const {View} = require('react-native');
    return ({FooterComponent, HeaderComponent}) => (
        <View testID="mockImageViewing">
            {HeaderComponent ? <HeaderComponent /> : null}
            {FooterComponent ? <FooterComponent /> : null}
        </View>
    );
});

jest.mock('react-native-image-picker', () => ({
    launchImageLibrary: jest.fn(async () => ({didCancel: true})),
}));

jest.mock('@react-native-community/netinfo', () => ({
    __esModule: true,
    default: {
        addEventListener: jest.fn(callback => {
            callback?.({isConnected: true, isInternetReachable: true});
            return () => {};
        }),
    },
}));

jest.mock('../../../../src/utils/electoralActAnalyzer', () => ({
    analyzeElectoralAct: jest.fn(async () => ({
        success: true,
        data: {if_electoral_act: true, image_not_clear: false},
    })),
    mapToAppFormat: jest.fn(() => ({mapped: true})),
}));

jest.mock('../../../../src/hooks/useNavigationLogger', () => ({
    useNavigationLogger: jest.fn(() => ({
        logAction: jest.fn(),
        logNavigation: jest.fn(),
    })),
}));

jest.mock(
    '../../../../src/i18n/String',
    () => require('../../../__mocks__/String').default,
);

const {useSelector} = require('react-redux');
const {useNavigation, useRoute} = require('@react-navigation/native');
const cameraModule = require('react-native-vision-camera');
const analyzer = require('../../../../src/utils/electoralActAnalyzer');

const themeState = {
    theme: {
        background: '#FFFFFF',
        text: '#000000',
        textSecondary: '#888888',
        primary: '#4F9858',
    },
};

const buildMockRoute = (overrides = {}) => ({
    params: {
        tableData: {
            tableNumber: '45',
            numero: '45',
            number: '45',
            recinto: 'Colegio Central',
        },
        ...overrides,
    },
});

const createMockNavigation = () => {
    const listeners = {};
    return {
        navigate: jest.fn(),
        goBack: jest.fn(),
        reset: jest.fn(),
        setParams: jest.fn(),
        dispatch: jest.fn(),
        setOptions: jest.fn(),
        isFocused: jest.fn(() => true),
        addListener: jest.fn((event, callback) => {
            listeners[event] = callback;
            if (event === 'focus') {
                callback();
            }
            return jest.fn();
        }),
    };
};

const flushPromises = () => act(async () => Promise.resolve());

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

    await flushPromises();
};

describe('CameraScreen - Manejo de Errores', () => {
    let mockNavigation;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        mockNavigation = createMockNavigation();

        useSelector.mockImplementation(selector =>
            selector({
                theme: themeState,
            }),
        );

        useNavigation.mockReturnValue(mockNavigation);
        useRoute.mockReturnValue(buildMockRoute());

        cameraModule.useCameraDevice.mockReturnValue({
            id: 'mock-device',
            formats: [{photoWidth: 4000, photoHeight: 3000}],
        });
        cameraModule.useCameraPermission.mockReturnValue({
            hasPermission: true,
            requestPermission: jest.fn(async () => true),
        });

        Dimensions.addEventListener = jest.fn(() => ({remove: jest.fn()}));
        AppStateModule.addEventListener = jest.fn(() => ({remove: jest.fn()}));
        StatusBarModule.setHidden = jest.fn();
        ImageModule.getSize = jest.fn((uri, success) => success(1200, 800));
        AlertModule.alert = jest.fn();
        AnimatedModule.Value = jest.fn(() => ({
            setValue: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            stopAnimation: jest.fn(),
            interpolate: jest.fn(() => 1),
        }));
        AnimatedModule.timing = jest.fn(() => ({start: jest.fn()}));
    });

    afterEach(() => {
        act(() => {
            jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
        Dimensions.addEventListener = originalDimensionsListener;
        AppStateModule.addEventListener = originalAppStateListener;
        StatusBarModule.setHidden = originalSetHidden;
        ImageModule.getSize = originalGetSize;
        AlertModule.alert = originalAlert;
        if (originalAnimatedValue) {
            AnimatedModule.Value = originalAnimatedValue;
        } else {
            delete AnimatedModule.Value;
        }
        if (originalAnimatedTiming) {
            AnimatedModule.timing = originalAnimatedTiming;
        } else {
            delete AnimatedModule.timing;
        }
    });

    test('muestra alerta cuando ocurre un error al tomar foto', async () => {
        cameraModule.__takePhotoMock.mockRejectedValueOnce(
            new Error('unexpected'),
        );

        const {getByText, getAllByText} = render(
            <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
        );

        await capturePhoto({getByText, getAllByText});

        expect(Alert.alert).toHaveBeenCalledWith(
            'Error de cámara',
            'No se pudo acceder a la cámara',
            expect.any(Array),
        );
    });

    test('muestra modal si la imagen no corresponde a un acta electoral', async () => {
        analyzer.analyzeElectoralAct.mockResolvedValueOnce({
            success: true,
            data: {
                if_electoral_act: false,
                image_not_clear: false,
            },
        });

        const {getByText, getAllByText} = render(
            <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
        );

        await capturePhoto({getByText, getAllByText});

        await pressFirstByText('Analizar', {getAllByText});

        await flushPromises();

        expect(
            getByText(
                'La imagen no corresponde a un acta electoral válida. Por favor, tome otra fotografía del acta.',
            ),
        ).toBeTruthy();
    });

    test('continúa sin análisis cuando hay error de red', async () => {
        analyzer.analyzeElectoralAct.mockRejectedValueOnce(
            new Error('ENETDOWN'),
        );

        const {getByText, getAllByText} = render(
            <CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
        );

        await capturePhoto({getByText, getAllByText});

        await pressFirstByText('Analizar', {getAllByText});

        await flushPromises();

        expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.PhotoReviewScreen,
            expect.objectContaining({
                offline: true,
                photoUri: 'file://mock-photo-path.jpg',
            }),
        );
    });
});

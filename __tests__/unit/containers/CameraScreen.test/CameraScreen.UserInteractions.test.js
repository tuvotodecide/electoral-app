import React from 'react';
import {render, act, fireEvent, waitFor} from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import CameraScreen from '../../../../src/container/Vote/UploadRecord/CameraScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';

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
const originalDimensionsListener = Dimensions.addEventListener;
const originalAppStateListener = AppStateModule.addEventListener;
const originalSetHidden = StatusBarModule.setHidden;
const originalGetSize = ImageModule.getSize;
const originalAlert = AlertModule.alert;
const AnimatedModule = ReactNative.Animated || (ReactNative.Animated = {});
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

jest.mock(
	'../../../../src/utils/electoralActAnalyzer',
	() => ({
		analyzeElectoralAct: jest.fn(async () => ({
			success: true,
			data: {if_electoral_act: true, image_not_clear: false},
		})),
		mapToAppFormat: jest.fn(() => ({mapped: true})),
	}),
);

jest.mock(
	'../../../../src/hooks/useNavigationLogger',
	() => ({
		useNavigationLogger: jest.fn(() => ({
			logAction: jest.fn(),
			logNavigation: jest.fn(),
		})),
	}),
);

jest.mock(
	'../../../../src/i18n/String',
	() => require('../../../__mocks__/String').default,
);

const {useSelector} = require('react-redux');
const {useNavigation, useRoute} = require('@react-navigation/native');
const cameraModule = require('react-native-vision-camera');
const netInfoModule = require('@react-native-community/netinfo').default;
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

describe('CameraScreen - Interacciones de Usuario', () => {
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

		netInfoModule.addEventListener.mockImplementation(callback => {
			callback?.({isConnected: true, isInternetReachable: true});
			return jest.fn();
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

	test('permite tomar nueva foto reiniciando la cámara', async () => {
		const {getByText, getAllByText, queryByText} = render(
			<CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
		);

		await capturePhoto({getByText, getAllByText});

		await pressFirstByText('Tomar Nueva', {getAllByText});

		await flushPromises();

		expect(getByText('Preparando cámara...')).toBeTruthy();
		act(() => {
			jest.advanceTimersByTime(4000);
		});
		expect(queryByText('Tomar Foto')).toBeTruthy();
	});

	test('navega al flujo offline cuando no hay conexión', async () => {
		netInfoModule.addEventListener.mockImplementation(callback => {
			callback?.({isConnected: false, isInternetReachable: false});
			return jest.fn();
		});

		const {getByText, getAllByText} = render(
			<CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
		);

		await capturePhoto({getByText, getAllByText});

		await pressFirstByText('Continuar', {getAllByText});

		expect(mockNavigation.navigate).toHaveBeenCalledWith(
			StackNav.PhotoReviewScreen,
			expect.objectContaining({
				offline: true,
				photoUri: 'file://mock-photo-path.jpg',
			}),
		);
	});

	test('muestra modal de error cuando análisis falla', async () => {
		analyzer.analyzeElectoralAct.mockResolvedValueOnce({
			success: false,
			error: 'No se pudo analizar',
		});

		const {getByText, getAllByText} = render(
			<CameraScreen navigation={mockNavigation} route={buildMockRoute()} />,
		);

		await capturePhoto({getByText, getAllByText});

		await pressFirstByText('Analizar', {getAllByText});

		await flushPromises();

		expect(getByText('No se pudo analizar')).toBeTruthy();
	});
});

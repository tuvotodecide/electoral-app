import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  AppState,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from '../../../components/common/CText';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

const {width: windowWidth, height: windowHeight} = Dimensions.get('window');
const isTablet = windowWidth >= 768;
const isSmallPhone = windowWidth < 350;

export default function CameraScreen({navigation, route}) {
  const camera = useRef(null);
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice || frontDevice;
  const {hasPermission, requestPermission} = useCameraPermission();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [cameraKey, setCameraKey] = useState(0); // Para forzar re-render

  // Function to completely reset the camera
  const resetCamera = () => {
    console.log('Resetting camera...');
    setIsActive(false);
    camera.current = null;

    // Cambiar la key para forzar re-render del componente Camera
    setCameraKey(prev => prev + 1);

    setTimeout(() => {
      if (!photo) {
        console.log('Reactivating camera...');
        setIsActive(true);
      }
    }, 1500);
  };

  // Manejo del AppState para manejar cuando la app va a background
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background, deactivating camera');
        setIsActive(false);
      } else if (nextAppState === 'active' && !photo && isFocused) {
        console.log('App back to foreground, reactivating camera');
        setTimeout(() => {
          setIsActive(true);
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [photo, isFocused]);

  // Permission handling and initial activation
  useEffect(() => {
    let timeoutId;
    const initCamera = async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          console.log('Camera permission denied');
          return;
        }
      }

      if (device && hasPermission && !photo && isFocused) {
        console.log('Initializing camera...');
        // Longer delay to ensure camera is completely free
        timeoutId = setTimeout(() => {
          setIsActive(true);
        }, 2000);
      }
    };

    initCamera();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      setIsActive(false);
    };
  }, [hasPermission, device, photo, isFocused, cameraKey]);

  // Focus listener para reactivar cuando se regresa a la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused');
      setIsFocused(true);
      if (!photo) {
        setTimeout(() => {
          setIsActive(true);
        }, 1000);
      }
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('Screen blurred');
      setIsFocused(false);
      setIsActive(false);
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation, photo]);

  // Cleanup al desmontar - MUY IMPORTANTE
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up camera');
      setIsActive(false);
      camera.current = null;
    };
  }, []);

  if (!device || !hasPermission) {
    return (
      <View style={styles.centered}>
        <CText style={styles.errorText}>
          {String.cameraNotAvailable}
        </CText>
      </View>
    );
  }

  // Toma la foto y muestra el loading
  const takePhoto = async () => {
    if (!camera.current || loading || !isActive) {
      console.log('Cannot take photo: camera not ready');
      return;
    }

    setLoading(true);

    try {
      console.log('Taking photo...');

      const result = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
      });

      console.log('Photo taken successfully:', result);
      setPhoto(result);
      setIsActive(false); // Deactivate immediately after taking photo
    } catch (err) {
      console.error('Camera error:', err);

      // Specific handling for "camera already in use" error
      if (
        err.code === 'device/camera-already-in-use' ||
        err.message?.includes('already in use')
      ) {
        console.log('Camera in use error, attempting reset...');
        resetCamera();
      } else {
        // Otros errores
        setIsActive(false);
        setTimeout(() => {
          if (!photo) {
            setIsActive(true);
          }
        }, 2000);
      }

      Alert.alert(String.cameraErrorTitle, String.cameraErrorMessage, [
        {
          text: String.accept,
          onPress: () => {},
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Ir a siguiente pantalla
  const handleNext = () => {
    const mesaInfo = route.params?.tableData || {};
    console.log('CameraScreen - Navigating with mesa data:', mesaInfo);

    navigation.navigate(StackNav.PhotoReviewScreen, {
      photoUri: `file://${photo.path}`,
      tableData: mesaInfo,
    });
  };

  // Marco de overlay reutilizable
  const RenderFrame = ({color = 'red'}) => (
    <View pointerEvents="none" style={styles.overlayContainer}>
      {/* Esquinas: ajusta el largo/grueso a gusto */}
      <View style={[styles.corner, styles.topLeft, {borderColor: color}]} />
      <View style={[styles.corner, styles.topRight, {borderColor: color}]} />
      <View style={[styles.corner, styles.bottomLeft, {borderColor: color}]} />
      <View style={[styles.corner, styles.bottomRight, {borderColor: color}]} />
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      {!photo ? (
        <>
          {isActive && (
            <Camera
              key={cameraKey} // Forzar re-render cuando cambia
              ref={camera}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isActive && isFocused}
              photo={true}
              onError={error => {
                console.error('Camera onError:', error);
                if (error.code === 'device/camera-already-in-use') {
                  console.log('Camera already in use, resetting...');
                  resetCamera();
                }
              }}
            />
          )}
          <RenderFrame color={'#D32F2F'} />
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                (loading || !isActive) && {opacity: 0.7},
              ]}
              onPress={takePhoto}
              disabled={loading || !isActive}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <CText style={styles.buttonText}>
                  {isActive ? String.takePhoto : String.preparingCamera}
                </CText>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={{flex: 1}}>
          <Image
            source={{uri: 'file://' + photo.path}}
            style={{
              width: windowWidth,
              height: windowHeight,
              position: 'absolute',
            }}
            resizeMode="cover"
          />
          <RenderFrame color={'#4F9858'} />
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[styles.captureButton, styles.nextButton]}
              onPress={handleNext}>
              <CText style={styles.buttonText}>{String.next || 'Next'}</CText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Responsive frame sizing
const frameSize = Math.floor(
  windowWidth * (isTablet ? 0.6 : isSmallPhone ? 0.75 : 0.8),
);
const cornerLength = isTablet ? 45 : isSmallPhone ? 25 : 35;
const cornerThickness = isTablet ? 8 : isSmallPhone ? 3 : 5;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: isTablet ? 20 : isSmallPhone ? 14 : 16,
    textAlign: 'center',
    paddingHorizontal: isTablet ? 40 : 20,
  },
  overlayContainer: {
    position: 'absolute',
    width: frameSize,
    height: frameSize * 1.35, // letter/document ratio
    left: (windowWidth - frameSize) / 2,
    top: windowHeight * (isTablet ? 0.12 : isSmallPhone ? 0.2 : 0.15),
    zIndex: 100,
  },
  corner: {
    position: 'absolute',
    width: cornerLength,
    height: cornerLength,
    borderColor: 'red',
  },
  topLeft: {
    left: 0,
    top: 0,
    borderLeftWidth: cornerThickness,
    borderTopWidth: cornerThickness,
    borderRadius: isTablet ? 8 : isSmallPhone ? 3 : 5,
  },
  topRight: {
    right: 0,
    top: 0,
    borderRightWidth: cornerThickness,
    borderTopWidth: cornerThickness,
    borderRadius: isTablet ? 8 : isSmallPhone ? 3 : 5,
  },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderLeftWidth: cornerThickness,
    borderBottomWidth: cornerThickness,
    borderRadius: isTablet ? 8 : isSmallPhone ? 3 : 5,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: cornerThickness,
    borderBottomWidth: cornerThickness,
    borderRadius: isTablet ? 8 : isSmallPhone ? 3 : 5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: isTablet ? 80 : isSmallPhone ? 30 : 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 200,
    paddingHorizontal: isTablet ? 40 : isSmallPhone ? 15 : 20,
  },
  captureButton: {
    width: isTablet ? 320 : isSmallPhone ? 160 : 220,
    paddingVertical: isTablet ? 22 : isSmallPhone ? 12 : 16,
    borderRadius: isTablet ? 18 : isSmallPhone ? 8 : 12,
    backgroundColor: '#4F9858',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  nextButton: {
    backgroundColor: '#4F9858',
  },
  buttonText: {
    color: '#fff',
    fontSize: isTablet ? 22 : isSmallPhone ? 14 : 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

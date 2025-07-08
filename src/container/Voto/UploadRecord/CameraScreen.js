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

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

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

  // Función para reiniciar completamente la cámara
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

  // Manejo de permisos y activación inicial
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
        // Delay más largo para asegurar que la cámara esté completamente libre
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
        <CText style={{color: '#fff', fontSize: 16}}>
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
      setIsActive(false); // Desactivar inmediatamente después de tomar la foto
    } catch (err) {
      console.error('Camera error:', err);

      // Manejo específico para el error de "camera already in use"
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
    const mesaInfo = route.params?.mesaData || {};
    console.log('CameraScreen - Navigating with mesa data:', mesaInfo);

    navigation.navigate(StackNav.PhotoReviewScreen, {
      photoUri: `file://${photo.path}`,
      mesaData: mesaInfo,
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
                  {isActive ? String.takePhoto : 'Preparando cámara...'}
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
              style={[styles.captureButton, {backgroundColor: '#4F9858'}]}
              onPress={handleNext}>
              <CText style={styles.buttonText}>{String.next}</CText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const frameSize = Math.floor(Dimensions.get('window').width * 0.8); // 80% ancho pantalla
const cornerLength = 38;
const cornerThickness = 6;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  overlayContainer: {
    position: 'absolute',
    width: frameSize,
    height: frameSize * 1.35, // relación carta/documento
    left: (Dimensions.get('window').width - frameSize) / 2,
    top: Dimensions.get('window').height * 0.15,
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
    borderRadius: 6,
  },
  topRight: {
    right: 0,
    top: 0,
    borderRightWidth: cornerThickness,
    borderTopWidth: cornerThickness,
    borderRadius: 6,
  },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderLeftWidth: cornerThickness,
    borderBottomWidth: cornerThickness,
    borderRadius: 6,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: cornerThickness,
    borderBottomWidth: cornerThickness,
    borderRadius: 6,
  },
  // Botón y fondo
  bottomContainer: {
    position: 'absolute',
    bottom: 56,
    width: '100%',
    alignItems: 'center',
    zIndex: 200,
  },
  captureButton: {
    width: 260,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#4F9858',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '600',
  },
});

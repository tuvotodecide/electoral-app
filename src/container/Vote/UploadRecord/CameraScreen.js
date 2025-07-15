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
  StatusBar,
  Modal,
  Text,
  ScrollView,
  PanResponder,
  Animated,
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
import electoralActAnalyzer from '../../../utils/electoralActAnalyzer';

const {width: windowWidth, height: windowHeight} = Dimensions.get('window');
const isTablet = windowWidth >= 768;
const isSmallPhone = windowWidth < 350;

// Función para obtener el mejor formato de cámara
const getBestCameraFormat = device => {
  if (!device?.formats) {
    return undefined;
  }

  // Buscar el formato con mayor resolución disponible
  const bestFormat = device.formats
    .filter(format => format.photoHeight && format.photoWidth)
    .sort((a, b) => {
      // Priorizar mayor resolución total
      const resolutionA = a.photoHeight * a.photoWidth;
      const resolutionB = b.photoHeight * b.photoWidth;
      return resolutionB - resolutionA;
    })[0];

  return bestFormat;
};

// Marco de overlay reutilizable - movido fuera del componente
const RenderFrame = ({
  color = 'red',
  isLandscape = false,
  screenWidth,
  screenHeight,
}) => {
  const frameMargin = 20;
  const frameWidth = screenWidth - frameMargin * 2;
  const frameHeight = screenHeight - frameMargin * 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlayContainer,
        {
          width: frameWidth,
          height: frameHeight,
          left: frameMargin,
          top: frameMargin,
        },
      ]}>
      {/* Esquinas: ajusta el largo/grueso a gusto */}
      <View style={[styles.corner, styles.topLeft, {borderColor: color}]} />
      <View style={[styles.corner, styles.topRight, {borderColor: color}]} />
      <View style={[styles.corner, styles.bottomLeft, {borderColor: color}]} />
      <View style={[styles.corner, styles.bottomRight, {borderColor: color}]} />
    </View>
  );
};

export default function CameraScreen({navigation, route}) {
  const camera = useRef(null);
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice || frontDevice;
  const {hasPermission, requestPermission} = useCameraPermission();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [cameraKey, setCameraKey] = useState(0); // Para forzar re-render
  const [orientation, setOrientation] = useState('portrait');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    buttons: [],
  });
  // Estados para zoom y navegación de imagen
  const [imageScale, setImageScale] = useState(new Animated.Value(1));
  const [imageTranslateX, setImageTranslateX] = useState(new Animated.Value(0));
  const [imageTranslateY, setImageTranslateY] = useState(new Animated.Value(0));
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);

  // Configurar StatusBar para mantener orientación consistente
  useEffect(() => {
    StatusBar.setHidden(false);

    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  // Detectar cambios de orientación
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setScreenData(window);
      const newOrientation =
        window.width > window.height ? 'landscape' : 'portrait';
      setOrientation(newOrientation);
    });

    return () => subscription?.remove();
  }, []);

  // Función para mostrar modal personalizado
  const showModal = (title, message, buttons = []) => {
    setModalConfig({
      title,
      message,
      buttons:
        buttons.length > 0
          ? buttons
          : [{text: 'OK', onPress: () => setModalVisible(false)}],
    });
    setModalVisible(true);
  };

  // Funciones para manejar zoom y navegación de imagen
  const resetImageTransform = () => {
    Animated.parallel([
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(imageTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(imageTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
  };

  // PanResponder para manejar gestos de zoom y pan
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      imageScale.setOffset(lastScale - 1);
      imageTranslateX.setOffset(lastTranslateX);
      imageTranslateY.setOffset(lastTranslateY);
    },
    onPanResponderMove: (evt, gestureState) => {
      // Si hay dos dedos, es zoom
      if (evt.nativeEvent.touches.length === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2),
        );
        const scale = Math.max(0.5, Math.min(3, distance / 200));
        imageScale.setValue(scale);
      } else {
        // Un dedo: pan
        imageTranslateX.setValue(gestureState.dx);
        imageTranslateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: () => {
      imageScale.flattenOffset();
      imageTranslateX.flattenOffset();
      imageTranslateY.flattenOffset();

      // Guardar valores actuales
      imageScale._value && setLastScale(imageScale._value);
      imageTranslateX._value && setLastTranslateX(imageTranslateX._value);
      imageTranslateY._value && setLastTranslateY(imageTranslateY._value);
    },
  });

  // Función para tomar nueva foto
  const takeNewPhoto = () => {
    setPhoto(null);
    setIsActive(true);
    resetImageTransform();
  };

  // Function to completely reset the camera
  const resetCamera = () => {
    setIsActive(false);
    camera.current = null;

    // Cambiar la key para forzar re-render del componente Camera
    setCameraKey(prev => prev + 1);

    setTimeout(() => {
      if (!photo) {
        setIsActive(true);
      }
    }, 1500);
  };

  // Manejo del AppState para manejar cuando la app va a background
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsActive(false);
      } else if (nextAppState === 'active' && !photo && isFocused) {
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
          return;
        }
      }

      if (device && hasPermission && !photo && isFocused) {
        // Longer delay to ensure camera is completely free
        timeoutId = setTimeout(() => {
          setIsActive(true);
        }, 2000);
      }
    };

    initCamera();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsActive(false);
    };
  }, [hasPermission, requestPermission, device, photo, isFocused, cameraKey]);

  // Focus listener para reactivar cuando se regresa a la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsFocused(true);
      if (!photo) {
        setTimeout(() => {
          setIsActive(true);
        }, 1000);
      }
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
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
      setIsActive(false);
      camera.current = null;
    };
  }, []);

  if (!device || !hasPermission) {
    return (
      <View style={styles.centered}>
        <CText style={styles.errorText}>{String.cameraNotAvailable}</CText>
      </View>
    );
  }

  // Toma la foto y muestra el loading
  const takePhoto = async () => {
    if (!camera.current || loading || !isActive) {
      return;
    }

    setLoading(true);

    try {
      const result = await camera.current.takePhoto({
        qualityPrioritization: 'balanced',
        flash: 'off',
        enableAutoRedEyeReduction: false,
        enableAutoStabilization: true,
        enableShutterSound: false,
      });

      setPhoto(result);
      setIsActive(false); // Deactivate immediately after taking photo
    } catch (err) {
      console.error('Camera error:', err);

      // Specific handling for "camera already in use" error
      if (
        err.code === 'device/camera-already-in-use' ||
        err.message?.includes('already in use')
      ) {
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
          onPress: () => setModalVisible(false),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Analizar acta electoral y navegar a siguiente pantalla
  const handleNext = async () => {
    if (!photo) {
      return;
    }

    setAnalyzing(true);
    const mesaInfo = route.params?.tableData || {};

    try {
      // Analizar la imagen con Gemini AI
      const analysisResult = await electoralActAnalyzer.analyzeElectoralAct(
        photo.path,
      );

      if (!analysisResult.success) {
        showModal(
          'Error de Análisis',
          analysisResult.error || 'No se pudo analizar la imagen',
          [{text: 'OK', onPress: () => setModalVisible(false)}],
        );
        setAnalyzing(false);
        return;
      }

      const aiData = analysisResult.data;

      // Verificar si es una acta electoral válida
      if (!aiData.if_electoral_act) {
        showModal(
          'Imagen No Válida',
          'La imagen no corresponde a un acta electoral válida. Por favor, tome otra fotografía del acta.',
          [
            {
              text: 'Tomar Nueva Foto',
              onPress: () => {
                setPhoto(null);
                setIsActive(true);
                setAnalyzing(false);
                setModalVisible(false);
              },
            },
          ],
        );
        return;
      }

      // Verificar si la imagen no está clara
      if (aiData.image_not_clear) {
        showModal(
          'Imagen No Clara',
          'La imagen está borrosa o no se puede leer claramente. Por favor, tome otra fotografía más nítida.',
          [
            {
              text: 'Tomar Nueva Foto',
              onPress: () => {
                setPhoto(null);
                setIsActive(true);
                setAnalyzing(false);
                setModalVisible(false);
              },
            },
          ],
        );
        return;
      }

      // Mapear datos de la IA al formato de la app
      const mappedData = electoralActAnalyzer.mapToAppFormat(aiData);

      // Navegar a la pantalla de revisión con los datos analizados
      navigation.navigate(StackNav.PhotoReviewScreen, {
        photoUri: `file://${photo.path}`,
        tableData: mesaInfo,
        aiAnalysis: aiData,
        mappedData: mappedData,
      });
    } catch (error) {
      console.error('❌ Error en análisis:', error);
      showModal(
        'Error',
        'Ocurrió un error al analizar la imagen. ¿Desea continuar sin análisis automático?',
        [
          {
            text: 'Reintentar',
            onPress: () => {
              setModalVisible(false);
              handleNext();
            },
          },
          {
            text: 'Continuar Sin Análisis',
            onPress: () => {
              setModalVisible(false);
              navigation.navigate(StackNav.PhotoReviewScreen, {
                photoUri: `file://${photo.path}`,
                tableData: mesaInfo,
              });
            },
          },
        ],
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {!photo ? (
        <>
          {isActive && (
            <Camera
              key={cameraKey} // Forzar re-render cuando cambia
              ref={camera}
              style={styles.cameraStyle}
              device={device}
              isActive={isActive && isFocused}
              photo={true}
              format={getBestCameraFormat(device)}
              onError={error => {
                console.error('Camera onError:', error);
                if (error.code === 'device/camera-already-in-use') {
                  resetCamera();
                }
              }}
            />
          )}
          <RenderFrame
            color={'#D32F2F'}
            isLandscape={orientation === 'landscape'}
            screenWidth={screenData.width}
            screenHeight={screenData.height}
          />
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[
                orientation === 'landscape'
                  ? styles.captureButtonCircular
                  : styles.captureButton,
                (loading || !isActive) && styles.buttonDisabled,
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
        <View style={styles.fullContainer}>
          {/* Header con controles */}
          <View style={styles.photoHeaderContainer}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={resetImageTransform}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <CText style={styles.headerButtonText}>Reset Zoom</CText>
            </TouchableOpacity>
          </View>

          {/* Contenedor de imagen con zoom y pan */}
          <View style={styles.imageViewContainer}>
            <ScrollView
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={0.5}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              bounces={true}
              bouncesZoom={true}
              decelerationRate="fast">
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.animatedImageContainer,
                  {
                    transform: [
                      {scale: imageScale},
                      {translateX: imageTranslateX},
                      {translateY: imageTranslateY},
                    ],
                  },
                ]}>
                <Image
                  source={{uri: 'file://' + photo.path}}
                  style={styles.zoomableImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </ScrollView>
          </View>

          {/* Botones de acción */}
          <View style={styles.photoActionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={takeNewPhoto}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <CText style={styles.actionButtonText}>Tomar Nueva</CText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.analyzeButton]}
              onPress={handleNext}
              disabled={analyzing}>
              {analyzing ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                    style={styles.analyzingIcon}
                  />
                  <CText style={styles.actionButtonText}>Analizando...</CText>
                </View>
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={20} color="#fff" />
                  <CText style={styles.actionButtonText}>Analizar Acta</CText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal personalizado */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalButtonContainer}>
              {modalConfig.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    index === modalConfig.buttons.length - 1 &&
                      styles.modalButtonLast,
                  ]}
                  onPress={button.onPress}>
                  <Text style={styles.modalButtonText}>{button.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: windowWidth,
    height: windowHeight,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Estilos para la vista de foto
  photoHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  imageViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  animatedImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableImage: {
    width: windowWidth,
    height: windowHeight * 0.7,
    maxWidth: windowWidth,
    maxHeight: windowHeight,
  },
  photoActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  retakeButton: {
    backgroundColor: '#666',
  },
  analyzeButton: {
    backgroundColor: '#4F9858',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzingIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
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
    zIndex: 100,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'red',
  },
  topLeft: {
    left: 0,
    top: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderRadius: 5,
  },
  topRight: {
    right: 0,
    top: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderRadius: 5,
  },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderRadius: 5,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderRadius: 5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 200,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 180,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F9858',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  captureButtonCircular: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  modalButton: {
    backgroundColor: '#4F9858',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonLast: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

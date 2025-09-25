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
import {launchImageLibrary} from 'react-native-image-picker';

const {width: windowWidth, height: windowHeight} = Dimensions.get('window');
const isTablet = windowWidth >= 768;
const isSmallPhone = windowWidth < 350;

// Función para obtener el mejor formato de cámara
const getBestCameraFormat = device => {
  if (!device?.formats) return undefined;

  const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
  const isPortrait = screenHeight >= screenWidth;
  const screenRatio = screenWidth / screenHeight;

  let bestFormat = undefined;
  let bestDiff = Number.MAX_VALUE;

  for (const format of device.formats) {
    // ✅ solo formatos que soporten foto
    if (!format.photoWidth || !format.photoHeight) continue;

    const formatRatio = format.photoWidth / format.photoHeight;
    const adjustedRatio = isPortrait
      ? Math.min(formatRatio, 1 / formatRatio)
      : formatRatio;

    const diff = Math.abs(adjustedRatio - screenRatio);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestFormat = format;
    }
  }

  return bestFormat;
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const getContainedSize = (srcW, srcH, maxW, maxH) => {
  if (!srcW || !srcH || !maxW || !maxH) return {width: maxW, height: maxH};
  const srcRatio = srcW / srcH;
  const maxRatio = maxW / maxH;
  if (srcRatio > maxRatio) {
    const width = maxW;
    const height = width / srcRatio;
    return {width, height};
  } else {
    const height = maxH;
    const width = height * srcRatio;
    return {width, height};
  }
};

// Marco de overlay reutilizable - movido fuera del componente
const RenderFrame = ({color = 'red', screenWidth, screenHeight}) => {
  const frameSize = Math.min(screenWidth, screenHeight) - 40;
  const topOffset = (screenHeight - frameSize) / 2;
  const leftOffset = (screenWidth - frameSize) / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.fullScreenOverlay,
        {width: screenWidth, height: screenHeight},
      ]}>
      <View style={[styles.corner, styles.topLeft, {borderColor: color}]} />
      <View style={[styles.corner, styles.topRight, {borderColor: color}]} />
      <View style={[styles.corner, styles.bottomLeft, {borderColor: color}]} />
      <View style={[styles.corner, styles.bottomRight, {borderColor: color}]} />
      <View style={styles.fullBorder} />
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
  const [photoMeta, setPhotoMeta] = useState({width: 0, height: 0});
  const [imageTranslateX, setImageTranslateX] = useState(new Animated.Value(0));
  const [imageTranslateY, setImageTranslateY] = useState(new Animated.Value(0));
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);

  const initialDistance = useRef(null);
  const initialScale = useRef(1);
  const isZooming = useRef(false);

  // Configurar StatusBar para mantener orientación consistente

  useEffect(() => {
    if (photo) {
      resetImageTransform();
    }
  }, [photo]);

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

  const openGallery = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
      } else if (result.errorCode) {
        Alert.alert('Error', 'No se pudo seleccionar la imagen');
      } else if (result.assets && result.assets.length > 0) {
        const selectedPhoto = result.assets[0];
        let imagePath = selectedPhoto.uri;
        if (imagePath.startsWith('file://')) {
          imagePath = imagePath.substring(7);
        }

        setPhoto({
          path: imagePath,
        });

        if (selectedPhoto.width && selectedPhoto.height) {
          setPhotoMeta({
            width: selectedPhoto.width,
            height: selectedPhoto.height,
          });
        } else {
          const uriForSize = selectedPhoto.path
            ? `file://${selectedPhoto.path}`
            : selectedPhoto.uri;
          if (uriForSize) {
            Image.getSize(
              uriForSize,
              (w, h) => setPhotoMeta({width: w, height: h}),
              () => {},
            );
          }
        }
        setIsActive(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un error al abrir la galería');
    }
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
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        // Inicializar solo para pan (un dedo)
        if (evt.nativeEvent.touches.length === 1) {
          imageScale.setOffset(lastScale);
          imageTranslateX.setOffset(lastTranslateX);
          imageTranslateY.setOffset(lastTranslateY);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        // Manejar zoom con dos dedos
        if (touches.length === 2) {
          isZooming.current = true;

          const touch1 = touches[0];
          const touch2 = touches[1];

          const dx = touch2.pageX - touch1.pageX;
          const dy = touch2.pageY - touch1.pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (!initialDistance.current) {
            initialDistance.current = distance;
            initialScale.current = lastScale;
          }

          let scale =
            (distance / initialDistance.current) * initialScale.current;
          scale = Math.max(0.5, Math.min(3, scale));

          imageScale.setValue(scale);
        }
        // Manejar pan con un dedo (solo si no estamos en medio de un zoom)
        // else if (touches.length === 1 && !isZooming.current) {
        //   // Calcular límites de traslación en función de la escala actual
        //   const maxTranslateX = (screenData.width * (lastScale - 1)) / 2;
        //   const maxTranslateY = (screenData.height * (lastScale - 1)) / 2;

        //   const dx = Math.max(
        //     -maxTranslateX,
        //     Math.min(maxTranslateX, gestureState.dx),
        //   );
        //   const dy = Math.max(
        //     -maxTranslateY,
        //     Math.min(maxTranslateY, gestureState.dy),
        //   );

        //   imageTranslateX.setValue(dx);
        //   imageTranslateY.setValue(dy);
        // }
        else if (touches.length === 1 && !isZooming.current) {
          const containerW = screenData.width;
          const containerH = screenData.height;

          // Tamaño real con el que se DIBUJA la imagen en 'contain'
          const draw = getContainedSize(
            photoMeta.width,
            photoMeta.height,
            containerW,
            containerH,
          );

          // Usamos la escala "actual" para limitar (cuando no hay pinch en curso)
          const currentScale = lastScale;

          const maxX = Math.max(
            0,
            (draw.width * currentScale - containerW) / 2,
          );
          const maxY = Math.max(
            0,
            (draw.height * currentScale - containerH) / 2,
          );

          const dx = clamp(gestureState.dx, -maxX, maxX);
          const dy = clamp(gestureState.dy, -maxY, maxY);

          imageTranslateX.setValue(dx);
          imageTranslateY.setValue(dy);
        }
      },
      onPanResponderRelease: evt => {
        const touches = evt.nativeEvent.touches;

        // Finalizar zoom si había dos dedos
        if (touches.length < 2) {
          isZooming.current = false;
        }

        // Solo procesar si no hay dedos restantes
        if (touches.length === 0) {
          const finalScale = imageScale._value;
          const finalTranslateX = imageTranslateX._value;
          const finalTranslateY = imageTranslateY._value;

          imageScale.flattenOffset();
          imageTranslateX.flattenOffset();
          imageTranslateY.flattenOffset();

          setLastScale(finalScale);
          setLastTranslateX(finalTranslateX);
          setLastTranslateY(finalTranslateY);

          // Resetear valores de zoom
          initialDistance.current = null;
          initialScale.current = finalScale;
        }
      },
      onPanResponderTerminate: () => {
        isZooming.current = false;
        initialDistance.current = null;
      },
    }),
  ).current;

  // Función para tomar nueva foto
  const takeNewPhoto = () => {
    setPhoto(null);
    setPhotoMeta({width: 0, height: 0});
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

      // const photoInfo = await new Promise((resolve, reject) => {
      //   Image.getSize(
      //     `file://${result.path}`,
      //     (width, height) => {
      //       resolve({width, height});
      //     },
      //     reject,
      //   );
      // });

      // // Calcular relación de aspecto
      // const screenRatio = screenData.width / screenData.height;
      // const photoRatio = photoInfo.width / photoInfo.height;

      // // Determinar si la foto está en landscape
      // const isLandscapePhoto = photoRatio > 1;

      // // Calcular el área visible de la foto que coincide con la vista previa
      // let visibleWidth, visibleHeight;
      // if (isLandscapePhoto) {
      //   visibleHeight = photoInfo.height;
      //   visibleWidth = visibleHeight * screenRatio;
      // } else {
      //   visibleWidth = photoInfo.width;
      //   visibleHeight = visibleWidth / screenRatio;
      // }

      // // Calcular desplazamiento para centrar
      // const offsetX = (photoInfo.width - visibleWidth) / 2;
      // const offsetY = (photoInfo.height - visibleHeight) / 2;

      // setPhoto({
      //   path: result.path,
      //   cropData: {
      //     x: offsetX,
      //     y: offsetY,
      //     width: visibleWidth,
      //     height: visibleHeight,
      //   },
      // });
      const meta = await new Promise((resolve, reject) => {
        Image.getSize(
          `file://${result.path}`,
          (width, height) => {
            resolve({width, height});
          },
          reject,
        );
      });

      setPhoto({path: result.path}); // sin cropData
      setPhotoMeta(meta);

      setIsActive(false);
    } catch (err) {
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
              key={cameraKey}
              ref={camera}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isActive && isFocused}
              photo={true}
              format={getBestCameraFormat(device)}
              zoom={0}
              onError={error => {
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
            <TouchableOpacity
              style={[styles.actionButton, styles.galleryButtonPreview]}
              onPress={openGallery}>
              <Ionicons name="image-outline" size={20} color="#fff" />
              <CText style={styles.actionButtonText}>Galería</CText>
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
          <View
            style={styles.imageViewContainer}
            {...panResponder.panHandlers} // Mover los gestos aquí
          >
            <Animated.View
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
              {/* <Image
                source={{uri: 'file://' + photo.path}}
                style={[
                  styles.zoomableImage,
                  {
                    width: screenData.width,
                    height: screenData.height,
                    // Aplicar recorte visual
                    marginLeft: photo.cropData
                      ? -photo.cropData.x *
                        (screenData.width / photo.cropData.width)
                      : 0,
                    marginTop: photo.cropData
                      ? -photo.cropData.y *
                        (screenData.height / photo.cropData.height)
                      : 0,
                  },
                ]}
                resizeMode="contain"
              /> */}
              {(() => {
                const containerW = screenData.width;
                const containerH = screenData.height;
                const draw = getContainedSize(
                  photoMeta.width,
                  photoMeta.height,
                  containerW,
                  containerH,
                );
                return (
                  <Image
                    source={{uri: 'file://' + photo.path}}
                    style={[
                      styles.zoomableImage,
                      {width: draw.width, height: draw.height}, // ✅ sin márgenes "fake"
                    ]}
                    resizeMode="contain"
                  />
                );
              })()}
            </Animated.View>
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
                  <CText style={styles.actionButtonText}>Analizar</CText>
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
    ...StyleSheet.absoluteFillObject,
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
  ipfsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  ipfsText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  imageViewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableImage: {
    width: windowWidth,
    height: windowHeight * 0.7,
    maxWidth: '100%',
    maxHeight: '100%',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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
    gap: 5,
  },
  captureButton: {
    width: 70,
    height: 70,
    paddingVertical: 14,
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
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryButtonPreview: {
    backgroundColor: '#5D5D5D',
  },

  fullScreenOverlay: {
    position: 'absolute',
    zIndex: 100,
  },

  fullBorder: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
});

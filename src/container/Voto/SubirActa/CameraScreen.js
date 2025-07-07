import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from '../../../components/common/CText';
import {StackNav} from '../../../navigation/NavigationKey';

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

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  if (!device || !hasPermission) {
    return (
      <View style={styles.centered}>
        <CText style={{color: '#fff', fontSize: 16}}>
          No se puede usar la cámara
        </CText>
      </View>
    );
  }

  // Toma la foto y muestra el loading
  const takePhoto = async () => {
    if (camera.current) {
      setLoading(true);
      try {
        const result = await camera.current.takePhoto();
        setPhoto(result);
      } catch (err) {
        // Maneja el error si falla la cámara
      } finally {
        setLoading(false);
      }
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
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
          />
          <RenderFrame color={'#D32F2F'} />
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePhoto}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <CText style={styles.buttonText}>Tomar foto</CText>
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
              <CText style={styles.buttonText}>Siguiente</CText>
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

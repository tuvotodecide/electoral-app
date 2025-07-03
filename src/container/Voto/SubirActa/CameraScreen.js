// import React, {useRef, useState, useEffect} from 'react';
// import {
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   Text,
//   Image,
//   Alert,
// } from 'react-native';
// import {
//   Camera,
//   useCameraDevice,
//   useCameraPermission,
// } from 'react-native-vision-camera';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import {StackNav} from '../../../navigation/NavigationKey';

// export default function CameraScreen({navigation, route}) {
//   const camera = useRef(null);
//   const backDevice = useCameraDevice('back');
//   const frontDevice = useCameraDevice('front');
//   // Usar cámara trasera si está disponible, sino la frontal
//   const device = backDevice || frontDevice;
//   const {hasPermission, requestPermission} = useCameraPermission();
//   const [photo, setPhoto] = useState(null);

//   // Debug: Log de información de dispositivos
//   useEffect(() => {
//     console.log('Camera devices info:', {
//       backDevice: !!backDevice,
//       frontDevice: !!frontDevice,
//       selectedDevice: !!device,
//       hasPermission: hasPermission,
//     });
//   }, [backDevice, frontDevice, device, hasPermission]);

//   // Solicitar permisos de cámara al montar
//   useEffect(() => {
//     if (!hasPermission) {
//       console.log('Camera permission not granted, requesting...');
//       requestPermission().then(granted => {
//         console.log('Permission request result:', granted);
//         if (!granted) {
//           Alert.alert(
//             'Permiso requerido',
//             'Necesitas permitir el acceso a la cámara para tomar fotos del acta.',
//             [
//               {
//                 text: 'Volver',
//                 onPress: () => navigation.goBack(),
//               },
//             ],
//           );
//         }
//       });
//     } else {
//       console.log('Camera permission already granted');
//     }
//   }, [hasPermission, requestPermission, navigation]);

//   // Si no hay permisos o no hay dispositivo, mostrar pantalla apropiada
//   if (!device) {
//     console.log('No camera device available');
//     return (
//       <View
//         style={{
//           flex: 1,
//           backgroundColor: '#000',
//           justifyContent: 'center',
//           alignItems: 'center',
//           padding: 20,
//         }}>
//         <Text
//           style={{
//             color: '#fff',
//             fontSize: 16,
//             textAlign: 'center',
//             marginBottom: 20,
//           }}>
//           No se encontró cámara
//         </Text>
//         <Text style={{color: '#aaa', fontSize: 14, textAlign: 'center'}}>
//           Verifica que tu dispositivo tenga cámara{'\n'}
//           Back: {backDevice ? 'Disponible' : 'No disponible'}
//           {'\n'}
//           Front: {frontDevice ? 'Disponible' : 'No disponible'}
//         </Text>
//         <TouchableOpacity
//           style={{
//             marginTop: 20,
//             backgroundColor: '#666',
//             padding: 10,
//             borderRadius: 5,
//           }}
//           onPress={() => navigation.goBack()}>
//           <Text style={{color: '#fff'}}>Volver</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (!hasPermission) {
//     console.log('Camera permission not granted');
//     return (
//       <View
//         style={{
//           flex: 1,
//           backgroundColor: '#000',
//           justifyContent: 'center',
//           alignItems: 'center',
//         }}>
//         <Text style={{color: '#fff', fontSize: 16, textAlign: 'center'}}>
//           Sin permisos de cámara{'\n'}Solicitando permisos...
//         </Text>
//       </View>
//     );
//   }

//   const takePhoto = async () => {
//     if (camera.current) {
//       const photo = await camera.current.takePhoto();
//       setPhoto(photo);
//     }
//   };

//   const handleConfirm = () => {
//     // Navegar a la pantalla de revisión de foto
//     navigation.navigate(StackNav.PhotoReviewScreen, {
//       photoUri: `file://${photo.path}`,
//       mesaData: route.params?.mesaData || {},
//     });
//   };

//   const handleCancel = () => {
//     setPhoto(null);
//   };

//   return (
//     <View style={{flex: 1, backgroundColor: '#000'}}>
//       {!photo ? (
//         <>
//           <Camera
//             ref={camera}
//             style={StyleSheet.absoluteFill}
//             device={device}
//             isActive={true}
//             photo={true}
//           />
//           <View style={styles.controls}>
//             <TouchableOpacity onPress={takePhoto} style={styles.shutter} />
//           </View>
//         </>
//       ) : (
//         <View
//           style={{
//             flex: 1,
//             justifyContent: 'center',
//             alignItems: 'center',
//             backgroundColor: '#000',
//           }}>
//           <Image
//             source={{uri: 'file://' + photo.path}}
//             style={{width: '100%', height: '80%', resizeMode: 'contain'}}
//           />
//           <View style={{flexDirection: 'row', marginTop: 20}}>
//             <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
//               <Ionicons name="close" size={28} color="#fff" />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
//               <Ionicons name="checkmark" size={28} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   controls: {
//     position: 'absolute',
//     bottom: 40,
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   shutter: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: '#fff',
//     borderWidth: 5,
//     borderColor: '#4F9858',
//   },
//   confirmBtn: {
//     backgroundColor: '#4F9858',
//     borderRadius: 30,
//     padding: 15,
//     marginHorizontal: 20,
//   },
//   cancelBtn: {
//     backgroundColor: '#d32f2f',
//     borderRadius: 30,
//     padding: 15,
//     marginHorizontal: 20,
//   },
// });
import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
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
        <Text style={{color: '#fff', fontSize: 16}}>
          No se puede usar la cámara
        </Text>
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
    navigation.navigate(StackNav.PhotoReviewScreen, {
      photoUri: `file://${photo.path}`,
      mesaData: route.params?.mesaData || {},
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
                <Text style={styles.buttonText}>Tomar foto</Text>
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
              <Text style={styles.buttonText}>Siguiente</Text>
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

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import UniversalHeader from '../../../components/common/UniversalHeader';
import {moderateScale} from '../../../common/constants';
import {fontConfig} from 'react-native-paper/lib/typescript/styles/fonts';
import CameraScreen from './CameraScreen';
import {StackNav} from '../../../navigation/NavigationKey';

// Solo para demo, en tu app vendrá desde navigation
const mockMesa = {
  numero: 'Mesa 1234',
  codigo: '2352',
  colegio: 'Colegio Gregorio Reynolds',
  provincia: 'Provincia Murillo - La Paz',
  recinto: 'Colegio 23 de marzo',
};

export default function DetalleMesa({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  // const {mesa} = route.params;
  const mesa = mockMesa;

  // Si viene una imagen desde CameraScreen, úsala
  const [capturedImage, setCapturedImage] = React.useState(
    route.params?.capturedImage || null,
  );
  const [modalVisible, setModalVisible] = React.useState(
    !!route.params?.capturedImage,
  );

  // Navega a la cámara interna
  const handleTakePhoto = () => {
    navigation.navigate(StackNav.CameraScreen, {
      mesaData: {
        numero: route.params?.mesa?.numero || 'N/A',
        ubicacion: route.params?.mesa?.ubicacion || 'Ubicación no disponible',
      },
    });
  };

  const handleConfirmPhoto = () => {
    setModalVisible(false);
    Alert.alert(
      '¡Foto Enviada!',
      'El acta ha sido subida exitosamente para su revisión.',
      [
        {
          text: 'Aceptar',
          onPress: () => navigation.popToTop(),
        },
      ],
    );
  };

  const handleRetakePhoto = () => {
    setModalVisible(false);
    setCapturedImage(null);
    // Navegar de vuelta a la cámara para tomar otra foto
    navigation.navigate(StackNav.CameraScreen, {
      mesaData: {
        numero: route.params?.mesa?.numero || 'N/A',
        ubicacion: route.params?.mesa?.ubicacion || 'Ubicación no disponible',
      },
    });
  };

  return (
    <CSafeAreaView style={stylesx.container}>
      {/* HEADER */}
      <UniversalHeader
        colors={colors}
        onBack={() => navigation.goBack()}
        title="Información de la mesa"
        showNotification={false}
      />

      {/* INSTRUCCIÓN */}
      <View style={{marginTop: 50, marginBottom: 0}}>
        <CText
          style={{
            ...stylesx.bigBold,
            fontSize: 20,
            fontWeight: 'bold',
            color: 'black', // Ajusta el margen superior
          }}>
          Asegúrate que esta es la mesa asignada
        </CText>

        <CText
          style={{
            ...stylesx.subtitle,
            marginTop: 10,
            color: colors.grayScale500, // Color gris claro
            fontSize: 15, // Tamaño de fuente más pequeño
          }}>
          Asegúrate que esta es la mesa asignada
        </CText>
      </View>

      {/* DATOS DE LA MESA */}

      <View
        style={{
          ...stylesx.card,
          padding: 16,
          borderRadius: 8,
          marginBottom: 18,
          borderWidth: 0,
          borderColor: 'transparent',
          shadowOpacity: 0,
          elevation: 0,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}>
          <View style={{flex: 1, marginRight: 14}}>
            <Text style={stylesx.mesaTitle}>Mesa 1234</Text>
            <Text style={stylesx.label}>Recinto: {mesa.recinto}</Text>
            <Text style={stylesx.label}>{mesa.colegio}</Text>
            <Text style={stylesx.label}>{mesa.provincia}</Text>
            <Text style={stylesx.label}>Codigo de Mesa: {mesa.codigo}</Text>
          </View>
          <MaterialIcons
            name="how-to-vote"
            size={moderateScale(70)}
            color={colors.textColor}
            style={{marginTop: moderateScale(25)}}
          />
        </View>
      </View>

      {/* INDICACIÓN IA */}
      <View style={stylesx.infoAI}>
        <Ionicons
          name="sparkles"
          size={moderateScale(19)}
          color={'#226678'}
          style={{marginRight: 7}}
        />
        <CText style={stylesx.iaText}>
          La IA seleccionará la foto más clara
        </CText>
      </View>

      {/* BOTÓN TOMAR FOTO */}
      <TouchableOpacity
        style={stylesx.takePhotoBtn}
        activeOpacity={0.85}
        onPress={handleTakePhoto}>
        <CText style={stylesx.takePhotoBtnText}>Tomar Foto</CText>
      </TouchableOpacity>

      {/* MODAL DE PREVISUALIZACIÓN DE FOTO */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={{flex: 1, backgroundColor: '#fff'}}>
          <View
            style={{
              padding: 20,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5E5',
            }}>
            <CText type={'B18'} color={colors.textColor}>
              Vista Previa
            </CText>
          </View>
          {capturedImage && (
            <View style={{flex: 1, padding: 20}}>
              <Image
                source={{uri: capturedImage.uri}}
                style={{flex: 1, width: '100%'}}
                resizeMode="contain"
              />
            </View>
          )}
          <View
            style={{flexDirection: 'row', padding: 20, gap: moderateScale(15)}}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#F5F5F5',
                borderRadius: 8,
                alignItems: 'center',
                padding: 15,
              }}
              onPress={handleRetakePhoto}>
              <CText type={'B14'} color={colors.grayScale600}>
                Tomar otra
              </CText>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 8,
                alignItems: 'center',
                padding: 15,
              }}
              onPress={handleConfirmPhoto}>
              <CText type={'B14'} color={colors.white}>
                Confirmar y Enviar
              </CText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </CSafeAreaView>
  );
}

// ESTILOS
const stylesx = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Fondo blanco
    paddingHorizontal: 0,
  },
  bigBold: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 19,
    marginBottom: 2,
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B9399',
    marginLeft: 19,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 23,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  mesaTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111',
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },
  infoAI: {
    backgroundColor: '#DDF4FA',
    borderRadius: 10,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  iaText: {
    fontSize: 15,
    color: '#226678',
    fontWeight: '500',
  },
  takePhotoBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#4F9858', // Verde exacto
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  takePhotoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
});

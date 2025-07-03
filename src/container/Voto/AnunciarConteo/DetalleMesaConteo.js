import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import {moderateScale} from '../../../common/constants';

// Solo para demo, en tu app vendrá desde navigation
const mockMesa = {
  numero: 'Mesa 1234',
  codigo: '2352',
  colegio: 'Colegio Gregorio Reynolds',
  provincia: 'Provincia Murillo - La Paz',
  recinto: 'Colegio 23 de marzo',
};

export default function DetalleMesaConteo({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const mesa = route?.params?.mesa || mockMesa;
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleAnunciarConteo = () => {
    setModalVisible(true);
  };

  const handleConfirmConteo = () => {
    setModalVisible(false);
    Alert.alert(
      '¡Conteo Anunciado!',
      'El conteo ha sido anunciado exitosamente.',
      [
        {
          text: 'Aceptar',
          onPress: () => navigation.popToTop(),
        },
      ],
    );
  };

  const handleCancelConteo = () => {
    setModalVisible(false);
  };

  return (
    <CSafeAreaView style={stylesx.container}>
      {/* HEADER */}
      <View style={stylesx.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={stylesx.backButton}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(24)}
            color={colors.textColor}
          />
        </TouchableOpacity>
        <CText style={stylesx.headerTitle} color={colors.textColor}>
          Información de la mesa
        </CText>
        <View style={{width: moderateScale(24)}} />
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
            <Text style={stylesx.mesaTitle}>{mesa.numero}</Text>
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

      {/* BOTÓN ANUNCIAR CONTEO */}
      <TouchableOpacity
        style={stylesx.takePhotoBtn}
        activeOpacity={0.85}
        onPress={handleAnunciarConteo}>
        <CText style={stylesx.takePhotoBtnText}>Anunciar Conteo</CText>
      </TouchableOpacity>

      {/* MODAL DE CONFIRMACIÓN */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={stylesx.modalOverlay}>
          <View style={stylesx.modalContent}>
            <View style={stylesx.modalHeader}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(60)}
                color="#4F9858"
                style={stylesx.modalIcon}
              />
              <CText style={stylesx.modalTitle}>¿Estás seguro?</CText>
              <CText style={stylesx.modalSubtitle}>
                ¿Deseas anunciar el conteo de la mesa {mesa.numero}?
              </CText>
            </View>

            <View style={stylesx.modalButtons}>
              <TouchableOpacity
                style={stylesx.cancelButton}
                onPress={handleCancelConteo}>
                <CText style={stylesx.cancelButtonText}>Cancelar</CText>
              </TouchableOpacity>
              <TouchableOpacity
                style={stylesx.confirmButton}
                onPress={handleConfirmConteo}>
                <CText style={stylesx.confirmButtonText}>Confirmar</CText>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#fff',
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(7),
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 30,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: moderateScale(30),
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
    backgroundColor: '#4F9858',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 30,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4F9858',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import UniversalHeader from '../../../components/common/UniversalHeader';
import {moderateScale} from '../../../common/constants';
import {fontConfig} from 'react-native-paper/lib/typescript/styles/fonts';
import CameraScreen from './CameraScreen';
import {StackNav} from '../../../navigation/NavigationKey';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

// Only for demo, in your app it will come from navigation
const mockMesa = {
  numero: 'Mesa 1234',
  codigo: '2352',
  colegio: 'Colegio Gregorio Reynolds',
  provincia: 'Provincia Murillo - La Paz',
  recinto: 'Colegio 23 de marzo',
};

export default function TableDetail({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  // Use real table data from navigation, with mockMesa as fallback
  const mesa = route.params?.mesa || mockMesa;

  console.log('TableDetail - Mesa recibida:', mesa);

  // If an image comes from CameraScreen, use it
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
        ...mesa,
        ubicacion: `${mesa.recinto}, ${mesa.provincia}`,
      },
    });
  };

  const handleConfirmPhoto = () => {
    setModalVisible(false);
    navigation.navigate(StackNav.SuccessScreen, {
      title: String.photoSentTitle,
      message: String.photoSentMessage,
      returnRoute: 'Home', // o la ruta principal desde donde empezó el flujo
    });
  };

  const handleRetakePhoto = () => {
    setModalVisible(false);
    setCapturedImage(null);
    // Navegar de vuelta a la cámara para tomar otra foto
    navigation.navigate(StackNav.CameraScreen, {
      mesaData: {
        ...mesa,
        ubicacion: `${mesa.recinto}, ${mesa.provincia}`,
      },
    });
  };

  return (
    <CSafeAreaView style={stylesx.container}>
      {/* HEADER */}
      <UniversalHeader
        colors={colors}
        onBack={() => navigation.goBack()}
        title={String.tableInformation || 'Table Information'}
        showNotification={false}
      />

      {/* SCROLLABLE CONTENT */}
      <View style={stylesx.scrollableContent}>
        {/* INSTRUCCIÓN */}
        <View style={stylesx.instructionContainer}>
          <CText style={[stylesx.bigBold, {color: 'black'}]}>
            {String.ensureAssignedTable || 'Ensure this is your assigned table'}
          </CText>

          <CText
            style={[
              stylesx.subtitle,
              {color: colors.grayScale500 || '#8B9399'},
            ]}>
            {String.verifyTableInformation}
          </CText>
        </View>

        {/* DATOS DE LA MESA */}
        <View style={stylesx.card}>
          <View style={stylesx.cardContent}>
            <View style={stylesx.cardTextContainer}>
              <CText style={stylesx.mesaTitle}>
                {mesa.numero || 'Table Information'}
              </CText>
              <CText style={stylesx.label}>
                {String.venue || 'Venue'}: {mesa.recinto || 'Not specified'}
              </CText>
              <CText style={stylesx.label}>
                {mesa.colegio || 'School information'}
              </CText>
              <CText style={stylesx.label}>
                {mesa.provincia || 'Province information'}
              </CText>
              <CText style={stylesx.label}>
                {String.tableCode || 'Table Code'}:{' '}
                {mesa.codigo || 'Not specified'}
              </CText>
            </View>
            <MaterialIcons
              name="how-to-vote"
              size={isTablet ? 80 : isSmallPhone ? 50 : 60}
              color={colors.textColor || '#222'}
              style={stylesx.cardIcon}
            />
          </View>
        </View>

        {/* INDICACIÓN IA */}
        <View style={stylesx.infoAI}>
          <Ionicons
            name="sparkles"
            size={isTablet ? 22 : isSmallPhone ? 16 : 19}
            color={'#226678'}
            style={stylesx.aiIcon}
          />
          <CText style={stylesx.iaText}>
            {String.aiWillSelectClearestPhoto ||
              'AI will select the clearest photo'}
          </CText>
        </View>

        {/* BOTÓN TOMAR FOTO */}
        <TouchableOpacity
          style={stylesx.takePhotoBtn}
          activeOpacity={0.85}
          onPress={handleTakePhoto}>
          <CText style={stylesx.takePhotoBtnText}>
            {String.takePhoto || 'Take Photo'}
          </CText>
        </TouchableOpacity>
      </View>

      {/* MODAL DE PREVISUALIZACIÓN DE FOTO */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={stylesx.modalContainer}>
          <View style={stylesx.modalHeader}>
            <CText type={'B18'} color={colors.textColor || '#222'}>
              {String.preview || 'Preview'}
            </CText>
          </View>
          {capturedImage && (
            <View style={stylesx.imageContainer}>
              <Image
                source={{uri: capturedImage.uri}}
                style={stylesx.previewImage}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={stylesx.modalButtons}>
            <TouchableOpacity
              style={stylesx.retakeButton}
              onPress={handleRetakePhoto}>
              <CText type={'B14'} color={colors.grayScale600 || '#666'}>
                {String.retakePhoto || 'Retake Photo'}
              </CText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                stylesx.confirmButton,
                {backgroundColor: colors.primary || '#4F9858'},
              ]}
              onPress={handleConfirmPhoto}>
              <CText type={'B14'} color={colors.white || '#fff'}>
                {String.confirmAndSend || 'Confirm and Send'}
              </CText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </CSafeAreaView>
  );
}

// ESTILOS RESPONSIVOS
const stylesx = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollableContent: {
    flex: 1,
    paddingBottom: isSmallPhone ? 20 : 30, // Extra padding for small devices
  },
  instructionContainer: {
    marginTop: isTablet ? 40 : isSmallPhone ? 15 : 25,
    marginBottom: 0,
    paddingHorizontal: isTablet ? 32 : isSmallPhone ? 12 : 16,
  },
  bigBold: {
    fontSize: isTablet ? 24 : isSmallPhone ? 16 : 20,
    fontWeight: 'bold',
    marginBottom: isSmallPhone ? 4 : 8,
    color: '#222',
    lineHeight: isTablet ? 30 : isSmallPhone ? 22 : 26,
  },
  subtitle: {
    fontSize: isTablet ? 18 : isSmallPhone ? 12 : 15,
    color: '#8B9399',
    marginTop: isSmallPhone ? 4 : 10,
    lineHeight: isTablet ? 24 : isSmallPhone ? 16 : 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: isSmallPhone ? 8 : 12,
    marginHorizontal: isTablet ? 32 : isSmallPhone ? 12 : 16,
    marginTop: isTablet ? 30 : isSmallPhone ? 12 : 20,
    padding: isTablet ? 24 : isSmallPhone ? 10 : 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: isTablet ? 30 : isSmallPhone ? 10 : 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: isTablet ? 20 : isSmallPhone ? 8 : 14,
  },
  cardIcon: {
    marginTop: isTablet ? 0 : isSmallPhone ? 5 : 15,
    alignSelf: 'flex-start',
  },
  mesaTitle: {
    fontSize: isTablet ? 20 : isSmallPhone ? 14 : 17,
    fontWeight: 'bold',
    marginBottom: isSmallPhone ? 4 : 6,
    color: '#111',
    lineHeight: isTablet ? 26 : isSmallPhone ? 18 : 22,
  },
  label: {
    fontSize: isTablet ? 16 : isSmallPhone ? 11 : 14,
    color: '#222',
    marginBottom: isSmallPhone ? 2 : 3,
    lineHeight: isTablet ? 22 : isSmallPhone ? 15 : 18,
  },
  infoAI: {
    backgroundColor: '#DDF4FA',
    borderRadius: isSmallPhone ? 6 : 10,
    marginHorizontal: isTablet ? 32 : isSmallPhone ? 12 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet ? 16 : isSmallPhone ? 6 : 10,
    paddingHorizontal: isTablet ? 20 : isSmallPhone ? 8 : 14,
    marginBottom: isTablet ? 30 : isSmallPhone ? 10 : 15,
  },
  aiIcon: {
    marginRight: isTablet ? 10 : isSmallPhone ? 5 : 7,
  },
  iaText: {
    fontSize: isTablet ? 17 : isSmallPhone ? 11 : 14,
    color: '#226678',
    fontWeight: '500',
    flex: 1,
    lineHeight: isTablet ? 24 : isSmallPhone ? 15 : 20,
  },
  takePhotoBtn: {
    marginHorizontal: isTablet ? 32 : isSmallPhone ? 12 : 16,
    marginTop: isSmallPhone ? 2 : 6,
    backgroundColor: '#4F9858',
    borderRadius: isSmallPhone ? 8 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: isTablet ? 60 : isSmallPhone ? 40 : 50,
    marginBottom: isSmallPhone ? 10 : 0,
  },
  takePhotoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isTablet ? 19 : isSmallPhone ? 14 : 17,
    letterSpacing: 0.2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    padding: isTablet ? 30 : isSmallPhone ? 15 : 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  imageContainer: {
    flex: 1,
    padding: isTablet ? 30 : isSmallPhone ? 15 : 20,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: isTablet ? 30 : isSmallPhone ? 15 : 20,
    gap: isTablet ? 20 : isSmallPhone ? 8 : 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: isSmallPhone ? 6 : 8,
    alignItems: 'center',
    padding: isTablet ? 20 : isSmallPhone ? 10 : 15,
  },
  confirmButton: {
    flex: 1,
    borderRadius: isSmallPhone ? 6 : 8,
    alignItems: 'center',
    padding: isTablet ? 20 : isSmallPhone ? 10 : 15,
  },
});

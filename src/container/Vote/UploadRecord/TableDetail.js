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
import CameraScreen from './CameraScreen';
import {StackNav} from '../../../navigation/NavigationKey';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

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
  const rawMesa = route.params?.mesa || mockMesa;

  console.log('TableDetail - Mesa recibida:', rawMesa);

  // Normalize mesa data structure
  const mesa = {
    numero: rawMesa.numero || rawMesa.tableNumber || rawMesa.number || 'N/A',
    codigo: rawMesa.codigo || rawMesa.code || 'N/A',
    colegio:
      rawMesa.colegio ||
      rawMesa.escuela ||
      rawMesa.location?.name ||
      rawMesa.school ||
      'N/A',
    provincia:
      rawMesa.provincia ||
      rawMesa.province ||
      rawMesa.location?.province ||
      'N/A',
    recinto:
      rawMesa.recinto ||
      rawMesa.venue ||
      rawMesa.location?.venue ||
      rawMesa.colegio ||
      rawMesa.escuela ||
      rawMesa.location?.name ||
      rawMesa.school ||
      'N/A',
  };

  console.log('TableDetail - Mesa normalizada:', mesa);

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
        title={String.tableInformation}
        showNotification={false}
      />

      {/* SCROLLABLE CONTENT */}
      <View style={stylesx.scrollableContent}>
        {/* For tablet landscape, use two-column layout */}
        {isTablet && isLandscape ? (
          <View style={stylesx.tabletLandscapeContainer}>
            {/* Left Column: Instructions and Table Data */}
            <View style={stylesx.leftColumn}>
              <View style={stylesx.instructionContainer}>
                <CText style={[stylesx.bigBold, {color: 'black'}]}>
                  {String.ensureAssignedTable}
                </CText>
                <CText
                  style={[
                    stylesx.subtitle,
                    {color: colors.grayScale500 || '#8B9399'},
                  ]}>
                  {String.verifyTableInformation}
                </CText>
              </View>

              <View style={stylesx.card}>
                <View style={stylesx.cardContent}>
                  <View style={stylesx.cardTextContainer}>
                    <CText style={stylesx.mesaTitle}>{mesa.numero}</CText>
                    <CText style={stylesx.label}>
                      {String.venue}: {mesa.recinto}
                    </CText>
                    <CText style={stylesx.label}>{mesa.colegio}</CText>
                    <CText style={stylesx.label}>{mesa.provincia}</CText>
                    <CText style={stylesx.label}>
                      {String.tableCode}: {mesa.codigo}
                    </CText>
                  </View>
                  <MaterialIcons
                    name="how-to-vote"
                    size={getResponsiveSize(50, 60, 70)}
                    color={colors.textColor || '#222'}
                    style={stylesx.cardIcon}
                  />
                </View>
              </View>
            </View>

            {/* Right Column: AI Info and Photo Button */}
            <View style={stylesx.rightColumn}>
              <View style={stylesx.infoAI}>
                <Ionicons
                  name="sparkles"
                  size={getResponsiveSize(16, 19, 22)}
                  color={'#226678'}
                  style={stylesx.aiIcon}
                />
                <CText style={stylesx.iaText}>
                  {String.aiWillSelectClearestPhoto}
                </CText>
              </View>

              <TouchableOpacity
                style={stylesx.takePhotoBtn}
                activeOpacity={0.85}
                onPress={handleTakePhoto}>
                <CText style={stylesx.takePhotoBtnText}>
                  {String.takePhoto}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Regular Layout: Phones and Tablet Portrait */
          <>
            <View style={stylesx.instructionContainer}>
              <CText style={[stylesx.bigBold, {color: 'black'}]}>
                {String.ensureAssignedTable}
              </CText>
              <CText
                style={[
                  stylesx.subtitle,
                  {color: colors.grayScale500 || '#8B9399'},
                ]}>
                {String.verifyTableInformation}
              </CText>
            </View>

            <View style={stylesx.card}>
              <View style={stylesx.cardContent}>
                <View style={stylesx.cardTextContainer}>
                  <CText style={stylesx.mesaTitle}>{mesa.numero}</CText>
                  <CText style={stylesx.label}>
                    {String.venue}: {mesa.recinto}
                  </CText>
                  <CText style={stylesx.label}>{mesa.colegio}</CText>
                  <CText style={stylesx.label}>{mesa.provincia}</CText>
                  <CText style={stylesx.label}>
                    {String.tableCode}: {mesa.codigo}
                  </CText>
                </View>
                <MaterialIcons
                  name="how-to-vote"
                  size={getResponsiveSize(50, 60, 70)}
                  color={colors.textColor || '#222'}
                  style={stylesx.cardIcon}
                />
              </View>
            </View>

            <View style={stylesx.infoAI}>
              <Ionicons
                name="sparkles"
                size={getResponsiveSize(16, 19, 22)}
                color={'#226678'}
                style={stylesx.aiIcon}
              />
              <CText style={stylesx.iaText}>
                {String.aiWillSelectClearestPhoto}
              </CText>
            </View>

            <TouchableOpacity
              style={stylesx.takePhotoBtn}
              activeOpacity={0.85}
              onPress={handleTakePhoto}>
              <CText style={stylesx.takePhotoBtnText}>{String.takePhoto}</CText>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* MODAL DE PREVISUALIZACIÓN DE FOTO */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={stylesx.modalContainer}>
          <View style={stylesx.modalHeader}>
            <CText type={'B18'} color={colors.textColor || '#222'}>
              {String.preview}
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
                {String.retakePhoto}
              </CText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                stylesx.confirmButton,
                {backgroundColor: colors.primary || '#4F9858'},
              ]}
              onPress={handleConfirmPhoto}>
              <CText type={'B14'} color={colors.white || '#fff'}>
                {String.confirmAndSend}
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
    paddingBottom: getResponsiveSize(15, 25, 30),
  },
  // Tablet Landscape Layout
  tabletLandscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(20, 24, 32),
    paddingVertical: getResponsiveSize(20, 24, 32),
  },
  leftColumn: {
    flex: 0.6,
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  rightColumn: {
    flex: 0.4,
    paddingLeft: getResponsiveSize(16, 20, 24),
    justifyContent: 'center',
  },
  instructionContainer: {
    marginTop: getResponsiveSize(15, 25, 35),
    marginBottom: 0,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
  },
  bigBold: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: 'bold',
    marginBottom: getResponsiveSize(6, 8, 10),
    color: '#222',
    lineHeight: getResponsiveSize(24, 26, 30),
  },
  subtitle: {
    fontSize: getResponsiveSize(14, 15, 18),
    color: '#8B9399',
    marginTop: getResponsiveSize(6, 10, 12),
    lineHeight: getResponsiveSize(18, 20, 24),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(10, 12, 14),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(18, 20, 25),
    padding: getResponsiveSize(16, 18, 22),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: getResponsiveSize(18, 20, 25),
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
    marginRight: getResponsiveSize(12, 16, 20),
  },
  cardIcon: {
    marginTop: getResponsiveSize(8, 12, 15),
    alignSelf: 'flex-start',
  },
  mesaTitle: {
    fontSize: getResponsiveSize(16, 17, 20),
    fontWeight: 'bold',
    marginBottom: getResponsiveSize(4, 6, 8),
    color: '#111',
    lineHeight: getResponsiveSize(20, 22, 26),
  },
  label: {
    fontSize: getResponsiveSize(13, 14, 16),
    color: '#222',
    marginBottom: getResponsiveSize(2, 3, 4),
    lineHeight: getResponsiveSize(16, 18, 22),
  },
  infoAI: {
    backgroundColor: '#DDF4FA',
    borderRadius: getResponsiveSize(8, 10, 12),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(10, 12, 16),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(15, 20, 25),
  },
  aiIcon: {
    marginRight: getResponsiveSize(6, 8, 10),
  },
  iaText: {
    fontSize: getResponsiveSize(13, 14, 17),
    color: '#226678',
    fontWeight: '500',
    flex: 1,
    lineHeight: getResponsiveSize(18, 20, 24),
  },
  takePhotoBtn: {
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(4, 8, 12),
    backgroundColor: '#4F9858',
    borderRadius: getResponsiveSize(10, 12, 14),
    justifyContent: 'center',
    alignItems: 'center',
    height: getResponsiveSize(48, 52, 58),
    marginBottom: getResponsiveSize(10, 15, 20),
  },
  takePhotoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: getResponsiveSize(16, 17, 19),
    letterSpacing: 0.2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    padding: getResponsiveSize(20, 25, 30),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  imageContainer: {
    flex: 1,
    padding: getResponsiveSize(20, 25, 30),
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: getResponsiveSize(20, 25, 30),
    gap: getResponsiveSize(12, 16, 20),
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
    padding: getResponsiveSize(14, 16, 20),
  },
  confirmButton: {
    flex: 1,
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
    padding: getResponsiveSize(14, 16, 20),
  },
});

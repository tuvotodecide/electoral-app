import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,

  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CameraScreen from './CameraScreen';
import CAlert from '../../../components/common/CAlert';
import { StackNav } from '../../../navigation/NavigationKey';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

export default function TableDetail({ navigation, route }) {
  const colors = useSelector(state => state.theme.theme);
  const { electionId, electionType } = route.params || {};
  console.log(electionId)
  // Use real table data from navigation, with mockMesa as fallback
  const rawMesa = route.params?.mesa || route.params?.tableData || {};
  const locationFromParams = route.params?.locationData || {};
  const mesaId =
    rawMesa.tableId || rawMesa.id || rawMesa._id || route.params?.tableId; // Get existing records if they exist
  const existingRecords = route.params?.existingRecords || [];
  const shouldCenter = !(existingRecords && existingRecords.length > 0);
  const mesaInfo = route.params?.mesaInfo || null;
  const totalRecords = route.params?.totalRecords || 0;
  const hasRecords =
    Array.isArray(existingRecords) && existingRecords.length > 0;

  const recordsCount = hasRecords ? existingRecords.length : 0;
  const recordsMsg = `La mesa ya tiene ${recordsCount} acta${recordsCount === 1 ? '' : 's'
    } publicada${recordsCount === 1 ? '' : 's'}`;

  // Normalize mesa data structure
  const mesa = {
    id: mesaId,
    tableId: mesaId,
    idRecinto:
      rawMesa.idRecinto ||
      rawMesa.locationId ||
      route.params?.locationId ||
      locationFromParams?._id,
    numero:
      rawMesa.tableNumber ||
      rawMesa.numero ||
      rawMesa.number ||
      mesaId ||
      'N/A',
    tableNumber:
      rawMesa.tableNumber ||
      rawMesa.numero ||
      rawMesa.number ||
      mesaId ||
      'N/A',
    codigo: rawMesa.tableCode || rawMesa.codigo || rawMesa.code || 'N/A',
    colegio:
      rawMesa.name ||
      rawMesa.recinto ||
      rawMesa.colegio ||
      rawMesa.escuela ||
      rawMesa.location?.name ||
      locationFromParams?.name ||
      'N/A',
    recinto:
      rawMesa.recinto ||
      rawMesa.name ||
      rawMesa.colegio ||
      rawMesa.escuela ||
      rawMesa.location?.name ||
      locationFromParams?.name ||
      'N/A',
    direccion:
      rawMesa.address ||
      rawMesa.direccion ||
      rawMesa.location?.address ||
      locationFromParams?.address ||
      'N/A',
    provincia:
      rawMesa.electoralSeatId?.municipalityId?.provinceId?.name ||
      rawMesa.provincia ||
      rawMesa.province ||
      locationFromParams?.electoralSeat?.municipality?.province?.name ||
      'N/A',
    zone:
      rawMesa.zone ||
      rawMesa.district ||
      rawMesa.zona ||
      rawMesa.electoralZone ||
      rawMesa.location?.zone ||
      locationFromParams?.zone ||
      locationFromParams?.district ||
      'Zona no especificada',
  };

  // If an image comes from CameraScreen, use it
  const [capturedImage, setCapturedImage] = useState(
    route.params?.capturedImage || null,
  );
  const [modalVisible, setModalVisible] = useState(
    !!route.params?.capturedImage,
  );


  const handleTakePhoto = () => {
    const finalTableData = {
      ...mesa,
      ubicacion: `${mesa.recinto}, ${mesa.provincia}`,
      // claves redundantes para compatibilidad
      tableNumber: mesa.tableNumber || mesa.numero || 'Debug-1234',
      numero: mesa.numero || mesa.tableNumber || 'Debug-1234',
      number: mesa.number || mesa.tableNumber || mesa.numero || 'Debug-1234',
    };

    const count = Array.isArray(existingRecords) ? existingRecords.length : 0;


    if (count === 0) {
      try {
        navigation.navigate(StackNav.CameraScreen, {
          tableData: finalTableData,
          mesaData: finalTableData,
          mesa: finalTableData,
          electionId, electionType
        });
      } catch {
        navigation.navigate('CameraScreen', {
          tableData: finalTableData,
          mesaData: finalTableData,
          mesa: finalTableData,
          electionId, electionType
        });
      }
      return;
    }

    if (count === 1) {
      const record = existingRecords[0];
      try {
        navigation.navigate(StackNav.PhotoReviewScreen, {
          mesa: finalTableData,
          tableData: finalTableData,
          mesaData: finalTableData,
          existingRecord: record,
          isViewOnly: true,
          photoUri: record?.actaImage,
          mode: 'attest', electionId, electionType
        });

      } catch {
        navigation.navigate('PhotoReviewScreen', {
          mesa: finalTableData,
          tableData: finalTableData,
          mesaData: finalTableData,
          existingRecord: record,
          isViewOnly: true,
          photoUri: record?.actaImage,
          mode: 'attest',
          electionId, electionType
        });
      }
      return;
    }

    // >1 actas -> WhichIsCorrectScreen
    try {
      navigation.navigate(StackNav.WhichIsCorrectScreen, {
        mesa: finalTableData,
        tableData: finalTableData,
        mesaData: finalTableData,
        existingRecords,
        totalRecords,
        fromTableDetail: true,
        electionId, electionType
      });
    } catch {
      navigation.navigate('WhichIsCorrectScreen', {
        mesa: finalTableData,
        tableData: finalTableData,
        mesaData: finalTableData,
        existingRecords,
        totalRecords,
        fromTableDetail: true,
        electionId, electionType
      });
    }
  };

  const handleConfirmPhoto = () => {
    setModalVisible(false);
    navigation.navigate(StackNav.SuccessScreen, {
      title: String.photoSentTitle,
      message: String.photoSentMessage,
      returnRoute: 'Home', // o la ruta principal desde donde empezó el flujo
      electionId, electionType
    });
  };

  const handleRetakePhoto = () => {
    setModalVisible(false);
    setCapturedImage(null);

    const finalTableData = {
      ...mesa,
      ubicacion: `${mesa.recinto}, ${mesa.provincia}`,
      // Ensure multiple ways to access mesa number
      tableNumber: mesa.tableNumber || mesa.numero || 'Debug-1234',
      numero: mesa.numero || mesa.tableNumber || 'Debug-1234',
      number: mesa.number || mesa.tableNumber || mesa.numero || 'Debug-1234',
    };

    // Navegar de vuelta a la cámara para tomar otra foto
    navigation.navigate(StackNav.CameraScreen, {
      tableData: finalTableData,
      mesaData: finalTableData,
      mesa: finalTableData,
      electionId, electionType
    });
  };

  return (
    <CSafeAreaView testID="tableDetailContainer" style={stylesx.container} addTabPadding={false}>
      {/* HEADER */}
      <UniversalHeader
        colors={colors}
        onBack={() => navigation.goBack()}
        title={
          /*  mesa ? mesa.colegio : String.tableInformation*/
          'Revisa'
        }
        showNotification={true}
      />

      {/* SCROLLABLE CONTENT */}
      <View
        style={[
          stylesx.scrollableContent,
          shouldCenter && stylesx.centerVertically,
        ]}>
        {/* For tablet landscape, use two-column layout */}
        {isTablet && isLandscape ? (
          <View style={stylesx.tabletLandscapeContainer}>
            {/* Left Column: Instructions and Table Data */}
            <View style={stylesx.leftColumn}>
              <View
                style={[
                  stylesx.instructionContainer,
                  shouldCenter && { marginTop: 0 },
                ]}>
                <CText style={[stylesx.bigBold, { color: 'black' }]}>
                  {String.ensureAssignedTable}
                </CText>
                {/* <CText
                  style={[
                    stylesx.subtitle,
                    {color: colors.grayScale500 || '#8B9399'},
                  ]}>
                  {String.verifyTableInformation}
                </CText> */}
              </View>

              <View style={stylesx.tableCard}>
                <View style={stylesx.tableCardHeader}>
                  <View style={stylesx.tableCardContent}>
                    <CText style={stylesx.tableCardTitle}>
                      Mesa {mesa.numero}
                    </CText>
                    <CText style={stylesx.tableCardDetail}>
                      Código de Mesa: {mesa.codigo}
                    </CText>
                  </View>
                  <MaterialIcons
                    name="how-to-vote"
                    size={getResponsiveSize(40, 48, 56)}
                    color="#000"
                    style={stylesx.downloadIcon}
                  />
                </View>
              </View>
            </View>

            {/* Right Column: AI Info and Photo Button OR Existing Records */}
            <View style={stylesx.rightColumn}>
              {recordsCount > 0 ? (
                <View style={stylesx.existingRecordsContainer}>
                  <CAlert status="success" message={recordsMsg} />

                  {existingRecords.map((record, index) => (
                    <TouchableOpacity
                      key={`${record.recordId}-${index}`}
                      testID={`tableDetailExistingRecord_${index}`}
                      style={stylesx.recordCard}
                      onPress={() => {
                        navigation.navigate(StackNav.PhotoReviewScreen, {
                          mesa: mesa,
                          existingRecord: record,
                          isViewOnly: true,
                          electionId, electionType
                        });
                      }}>
                      <View style={stylesx.recordHeader}>
                        <CText style={stylesx.recordTitle}>
                          Acta #{index + 1}
                        </CText>
                      </View>

                      {record.actaImage && (
                        <View style={stylesx.actaImageContainer}>
                          <Image
                            source={{ uri: record.actaImage }}
                            style={stylesx.actaImage}
                            resizeMode="cover"
                          />
                          <View style={stylesx.imageOverlay}>
                            <Ionicons name="eye" size={20} color="#fff" />
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={stylesx.addNewRecordBtn}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.addNewRecordText}>Atestiguar</CText>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
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
                    testID='tableDetailTakePhotoButton'
                    style={stylesx.takePhotoBtn}
                    activeOpacity={0.85}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.takePhotoBtnText}>
                      {String.takePhoto}
                    </CText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ) : (
          /* Regular Layout: Phones and Tablet Portrait */
          <>
            <View style={stylesx.middleWrap}>
              <View
                style={[
                  stylesx.instructionContainer,
                  shouldCenter && { marginTop: 0 },
                ]}>
                <CText style={[stylesx.bigBold, { color: 'black' }]}>
                  {String.ensureAssignedTable}
                </CText>
                {/* <CText
                style={[
                  stylesx.subtitle,
                  {color: colors.grayScale500 || '#8B9399'},
                ]}>
                {String.verifyTableInformation}
              </CText> */}
              </View>

              <View style={stylesx.tableCard}>
                <View style={stylesx.tableCardHeader}>
                  <MaterialIcons
                    name="how-to-vote"
                    size={getResponsiveSize(40, 48, 56)}
                    color="#000"
                    style={stylesx.downloadIcon}
                  />
                  <View style={stylesx.tableCardContent}>
                    <CText style={stylesx.tableCardTitle}>
                      {String.table} {mesa.numero}
                    </CText>
                    <CText style={stylesx.tableCardDetail}>
                      {String.tableCode}
                      {':'} {mesa.codigo}
                    </CText>
                    <CText style={stylesx.tableCardDetail}>
                      {String.precinct}
                      {':'} {mesa.colegio}
                    </CText>
                  </View>
                </View>
              </View>

              {/* Show existing attestations if available */}
              {recordsCount > 0 && (
                <View style={stylesx.existingRecordsContainer}>
                  {/* <CText style={stylesx.existingRecordsSubtitle}>
                  Esta mesa ya tiene actas registradas en el sistema
                </CText> */}

                  <CAlert status="success" message={recordsMsg} />
                  <TouchableOpacity
                    style={stylesx.addNewRecordBtn}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.addNewRecordText}>Atestiguar</CText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Show photo taking section only if no existing records */}
              {(!existingRecords || existingRecords.length === 0) && (
                <>
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
                    testID='tableDetailTakePhotoButton'
                    style={stylesx.takePhotoBtn}
                    activeOpacity={0.85}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.takePhotoBtnText}>
                      {String.takePhoto}
                    </CText>
                  </TouchableOpacity>
                </>
              )}
            </View>
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
                source={{ uri: capturedImage.uri }}
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
                { backgroundColor: colors.primary || '#4F9858' },
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
  middleWrap: {
    flex: 1,
    justifyContent: 'center', // centra vertical
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
    textAlign: 'center',
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
    shadowOffset: { width: 0, height: 1 },
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
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: getResponsiveSize(4, 6, 8),
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
  // Table card styles - identical to SearchTableComponents
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(6, 8, 10),
    padding: getResponsiveSize(12, 16, 18),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(18, 20, 25),
    marginBottom: getResponsiveSize(8, 12, 14),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  tableCardContent: {
    flex: 1,
    paddingRight: getResponsiveSize(12, 16, 20),
  },
  tableCardTitle: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: '700',
    color: '#000',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  tableCardDetail: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#868686',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  tableCardZone: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '500',
    color: '#000',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  downloadIcon: {
    alignSelf: 'center',
  },
  // Existing records styles
  existingRecordsContainer: {
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(15, 20, 25),
    marginBottom: getResponsiveSize(15, 20, 25),
  },
  existingRecordsTitle: {
    fontSize: getResponsiveSize(18, 20, 22),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  existingRecordsSubtitle: {
    fontSize: getResponsiveSize(14, 15, 16),
    color: '#666',
    marginBottom: getResponsiveSize(12, 16, 20),
    lineHeight: getResponsiveSize(18, 20, 22),
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: getResponsiveSize(12, 16, 18),
    marginBottom: getResponsiveSize(12, 15, 18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  recordTitle: {
    fontSize: getResponsiveSize(16, 17, 18),
    fontWeight: '600',
    color: '#222',
  },
  recordId: {
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#666',
    fontFamily: 'monospace',
  },
  actaImageContainer: {
    position: 'relative',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  actaImage: {
    width: '100%',
    height: getResponsiveSize(120, 140, 160),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: '#F5F5F5',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: getResponsiveSize(6, 8, 10),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  viewImageText: {
    color: '#fff',
    fontSize: getResponsiveSize(14, 15, 16),
    fontWeight: '500',
    marginLeft: getResponsiveSize(4, 6, 8),
  },
  recordSummary: {
    paddingTop: getResponsiveSize(8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  recordSummaryText: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: '#666',
    fontStyle: 'italic',
  },
  addNewRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F9858',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 16, 18),
    marginTop: getResponsiveSize(8, 10, 12),
  },
  addIcon: {
    marginRight: getResponsiveSize(6, 8, 10),
  },
  addNewRecordText: {
    fontSize: getResponsiveSize(15, 16, 17),
    fontWeight: '600',
    color: '#fff',
  },
  centerVertically: {
    justifyContent: 'center',
  },
});

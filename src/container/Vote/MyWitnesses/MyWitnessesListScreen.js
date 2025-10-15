import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import String from '../../../i18n/String';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CustomModal from '../../../components/common/CustomModal';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';
//import {fetchUserAttestations} from '../../../api/account';

import axios from 'axios';
import {BACKEND_RESULT} from '@env';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const MyWitnessesListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  // const userInfo = useSelector(state => state.user.userInfo); // Get user info from Redux
  const {mesaData} = route.params || {};

  const userData = useSelector(state => state.wallet.payload);
  const dni = userData?.dni;

  // Estados para la carga de datos
  const [witnessRecords, setWitnessRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({});
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [hasNoAttestations, setHasNoAttestations] = useState(false);

  // Cargar atestiguamientos al montar el componente
  useEffect(() => {
    if (dni) {
      loadWitnessRecords();
    } else {
      setLoading(false);
      setHasNoAttestations(true);
      setModalData({
        title: String.error,
        message: 'DNI del usuario no disponible',
        type: 'error',
      });
      setModalVisible(true);
    }
  }, [dni]);

  const loadWitnessRecords = async () => {
    setLoading(true);
    setHasNoAttestations(false);

    try {
      // Paso 1: Obtener los attestations por DNI
      const attestationsResponse = await axios.get(
        `${BACKEND_RESULT}/api/v1/attestations/by-user/${dni}`,
      );

      const attestationsData = attestationsResponse.data.data || [];

      if (attestationsData.length === 0) {
        setHasNoAttestations(true);
        setWitnessRecords([]);
        return;
      }

      // Paso 2: Obtener los detalles de cada ballot usando los ballotIds
      const ballotsData = await Promise.all(
        attestationsData.map(async attestation => {
          try {
            const ballotResponse = await axios.get(
              `${BACKEND_RESULT}/api/v1/ballots/${attestation.ballotId}`,
            );
            return ballotResponse.data;
          } catch (error) {
            return null;
          }
        }),
      );

      // Filtrar resultados nulos y transformar datos
      const validBallotsData = ballotsData.filter(ballot => ballot !== null);

      if (validBallotsData.length === 0) {
        setHasNoAttestations(true);
        setWitnessRecords([]);
        return;
      }

      // Transformar datos para la UI
      const transformedData = validBallotsData.map((ballot, index) => {
        // Convertir votos de presidente
        const presidentVotes = (ballot.votes?.parties?.partyVotes || []).map(
          party => ({
            partyId: party.partyId,
            presidente: party.votes ? party.votes.toString() : '0',
          }),
        );

        // Convertir votos de diputados
        // const deputyVotes = (ballot.votes?.deputies?.partyVotes || []).map(party => ({
        //   partyId: party.partyId,
        //   presidente: '0',
        //   diputado: party.votes ? party.votes.toString() : '0'
        // }));
        // Consolidar votos por partido
        const allVotes = [...presidentVotes];
        const consolidatedPartyResults = allVotes.reduce((acc, current) => {
          const existing = acc.find(item => item.partyId === current.partyId);
          if (existing) {
            // Sumar votos para el mismo partido
            if (current.presidente) {
              existing.presidente = (
                parseInt(existing.presidente) + parseInt(current.presidente)
              ).toString();
            }
          } else {
            acc.push({
              partyId: current.partyId,
              presidente: current.presidente || '0',
            });
          }
          return acc;
        }, []);

        // Crear voteSummaryResults
        const voteSummaryResults = [
          {
            label: 'Válidos',
            value1: ballot.votes?.parties?.validVotes?.toString() || '0',
          },
          {
            label: 'Blanco',
            value1: ballot.votes?.parties?.blankVotes?.toString() || '0',
          },
          {
            label: 'Nulos',
            value1: ballot.votes?.parties?.nullVotes?.toString() || '0',
          },
          {
            label: 'Total',
            value1: ballot.votes?.parties?.totalVotes?.toString() || '0',
          },
        ];

        return {
          id: ballot._id || `ballot-${index}`,
          tableNumber: ballot.tableNumber,
          tableCode: ballot.tableCode,
          mesa: `Mesa ${ballot.tableNumber}`,
          imagen: ballot.image
            ? ballot.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : null,
          fecha: new Date(ballot.createdAt).toLocaleDateString('es-ES'),
          hora: new Date(ballot.createdAt).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          partyResults: consolidatedPartyResults,
          voteSummaryResults,
          idTableContract: ballot._id,
          electoralLocationId: ballot.electoralLocationId,
          recordId: ballot.recordId,
          ballotData: ballot, // Guardar datos completos para referencia
        };
      });

      setWitnessRecords(transformedData);
      setHasNoAttestations(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setHasNoAttestations(true);
        setWitnessRecords([]);
      } else {
        // Otros errores sí se muestran en modal
        setModalData({
          title: String.error,
          message:
            String.errorLoadingWitnesses ||
            error.response?.data?.message ||
            error.message,
          type: 'error',
        });
        setModalVisible(true);
        setHasNoAttestations(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleImagePress = imageId => {
    setSelectedImageId(imageId);
  };

  const handleVerMas = () => {
    if (selectedImageId) {
      const selectedWitnessRecord = witnessRecords.find(
        item => item.id === selectedImageId,
      );
      if (selectedWitnessRecord) {
        // Navigate to MyWitnessesDetailScreen with complete data
        navigation.navigate(StackNav.MyWitnessesDetailScreen, {
          photoUri: selectedWitnessRecord.imagen,
          mesaData: {
            tableNumber: selectedWitnessRecord.tableNumber,
            tableCode: selectedWitnessRecord.tableCode,
            numero: selectedWitnessRecord.tableNumber,
          },
          partyResults: selectedWitnessRecord.partyResults,
          voteSummaryResults: selectedWitnessRecord.voteSummaryResults,
          attestationData: selectedWitnessRecord,
        });
      }
    } else {
      setModalData({
        title: String.selectionRequired,
        message: String.pleaseSelectDocument,
        type: 'warning',
      });
      setModalVisible(true);
    }
  };

  return (
    <CSafeAreaView testID="myWitnessesContainer" style={styles.container}>
      {/* Header */}
      <UniversalHeader
        testID="myWitnessesHeader"
        colors={colors}
        onBack={handleBack}
        title={String.myWitnessesTitle}
        showNotification={true}
      />

      {/* Question Text */}
      <View
        testID="witnessesQuestionContainer"
        style={styles.questionContainer}>
        <CText testID="witnessesQuestionText" style={styles.questionText}>
          {String.selectDocumentToReview}
        </CText>
      </View>

      {/* Content */}
      {loading ? (
        <View
          testID="witnessesLoadingContainer"
          style={styles.loadingContainer}>
          <ActivityIndicator
            testID="witnessesLoadingIndicator"
            size="large"
            color={colors.primary || '#459151'}
          />
          <CText testID="witnessesLoadingText" style={styles.loadingText}>
            {String.loadingWitnesses}
          </CText>
        </View>
      ) : hasNoAttestations ? (
        <View
          testID="noAttestationsContainer"
          style={styles.noAttestationsContainer}>
          <View
            testID="noAttestationsIconContainer"
            style={styles.noAttestationsIconContainer}>
            <CText
              testID="noAttestationsIcon"
              style={styles.noAttestationsIcon}>
              📋
            </CText>
          </View>
          <CText
            testID="noAttestationsTitle"
            style={styles.noAttestationsTitle}>
            No hay atestiguamientos realizados
          </CText>
          <CText
            testID="noAttestationsMessage"
            style={styles.noAttestationsMessage}>
            Aún no has realizado ningún atestiguamiento.{'\n'}
            Cuando completes tu primer atestiguamiento, aparecerá aquí.
          </CText>
          <TouchableOpacity
            testID="refreshWitnessesButton"
            style={[
              styles.refreshButton,
              {backgroundColor: colors.primary || '#459151'},
            ]}
            onPress={loadWitnessRecords}>
            <CText
              testID="refreshWitnessesButtonText"
              style={styles.refreshButtonText}>
              Actualizar
            </CText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          testID="witnessRecordsList"
          style={styles.imageList}
          showsVerticalScrollIndicator={false}>
          {isTablet
            ? // Two-column layout for tablets
              (() => {
                const pairs = [];
                for (let i = 0; i < witnessRecords.length; i += 2) {
                  pairs.push(witnessRecords.slice(i, i + 2));
                }
                return pairs.map((pair, pairIndex) => (
                  <View key={pairIndex} style={styles.tabletRow}>
                    {pair.map((witnessRecord, witnessIndex) => {
                      const globalIndex = pairIndex * 2 + witnessIndex;
                      return (
                        <View
                          key={witnessRecord.id}
                          style={styles.tabletColumn}>
                          <TouchableOpacity
                            testID={`witnessRecord_${globalIndex}`}
                            style={[
                              styles.imageCard,
                              selectedImageId === witnessRecord.id &&
                                styles.imageCardSelected,
                            ]}
                            onPress={() => handleImagePress(witnessRecord.id)}>
                            <View style={styles.imageHeader}>
                              <CText
                                testID={`witnessRecordMesa_${globalIndex}`}
                                style={styles.mesaText}>
                                {witnessRecord.mesa}
                              </CText>
                              <CText
                                testID={`witnessRecordDate_${globalIndex}`}
                                style={styles.fechaText}>
                                {witnessRecord.fecha} - {witnessRecord.hora}
                              </CText>
                            </View>
                            <Image
                              testID={`witnessRecordImage_${globalIndex}`}
                              source={{
                                uri: witnessRecord.imagen,
                                headers: {
                                  'User-Agent':
                                    'Mozilla/5.0 (compatible; ReactNative)',
                                  Accept: 'image/*',
                                },
                              }}
                              style={styles.imageDisplay}
                              resizeMode="contain"
                            />
                            {selectedImageId === witnessRecord.id && (
                              <>
                                {/* Corner borders - black color */}
                                <View
                                  testID={`witnessTopLeftCorner_${globalIndex}`}
                                  style={[
                                    styles.cornerBorder,
                                    styles.topLeftCorner,
                                  ]}
                                />
                                <View
                                  testID={`witnessTopRightCorner_${globalIndex}`}
                                  style={[
                                    styles.cornerBorder,
                                    styles.topRightCorner,
                                  ]}
                                />
                                <View
                                  testID={`witnessBottomLeftCorner_${globalIndex}`}
                                  style={[
                                    styles.cornerBorder,
                                    styles.bottomLeftCorner,
                                  ]}
                                />
                                <View
                                  testID={`witnessBottomRightCorner_${globalIndex}`}
                                  style={[
                                    styles.cornerBorder,
                                    styles.bottomRightCorner,
                                  ]}
                                />
                              </>
                            )}
                          </TouchableOpacity>
                          {selectedImageId === witnessRecord.id && (
                            <TouchableOpacity
                              testID={`tabletWitnessDetailsButton_${globalIndex}`}
                              style={styles.detailsButton}
                              onPress={handleVerMas}>
                              <CText
                                testID={`tabletWitnessDetailsButtonText_${globalIndex}`}
                                style={styles.detailsButtonText}>
                                {String.seeMore}
                              </CText>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                    {pair.length === 1 && <View style={styles.tabletColumn} />}
                  </View>
                ));
              })()
            : // Single column layout for phones
              witnessRecords.map((witnessRecord, index) => (
                <React.Fragment key={witnessRecord.id}>
                  <TouchableOpacity
                    testID={`phoneWitnessRecord_${index}`}
                    style={[
                      styles.imageCard,
                      selectedImageId === witnessRecord.id &&
                        styles.imageCardSelected,
                    ]}
                    onPress={() => handleImagePress(witnessRecord.id)}>
                    <View style={styles.imageHeader}>
                      <CText
                        testID={`phoneWitnessRecordMesa_${index}`}
                        style={styles.mesaText}>
                        {witnessRecord.mesa}
                      </CText>
                      <CText
                        testID={`phoneWitnessRecordDate_${index}`}
                        style={styles.fechaText}>
                        {witnessRecord.fecha} - {witnessRecord.hora}
                      </CText>
                    </View>
                    <Image
                      testID={`phoneWitnessRecordImage_${index}`}
                      source={{
                        uri: witnessRecord.imagen,
                        headers: {
                          'User-Agent': 'Mozilla/5.0 (compatible; ReactNative)',
                          Accept: 'image/*',
                        },
                      }}
                      style={styles.imageDisplay}
                      resizeMode="contain"
                    />
                    {selectedImageId === witnessRecord.id && (
                      <>
                        {/* Corner borders - black color */}
                        <View
                          testID={`phoneWitnessTopLeftCorner_${index}`}
                          style={[styles.cornerBorder, styles.topLeftCorner]}
                        />
                        <View
                          testID={`phoneWitnessTopRightCorner_${index}`}
                          style={[styles.cornerBorder, styles.topRightCorner]}
                        />
                        <View
                          testID={`phoneWitnessBottomLeftCorner_${index}`}
                          style={[styles.cornerBorder, styles.bottomLeftCorner]}
                        />
                        <View
                          testID={`phoneWitnessBottomRightCorner_${index}`}
                          style={[
                            styles.cornerBorder,
                            styles.bottomRightCorner,
                          ]}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                  {selectedImageId === witnessRecord.id && (
                    <TouchableOpacity
                      testID={`phoneWitnessDetailsButton_${index}`}
                      style={styles.detailsButton}
                      onPress={handleVerMas}>
                      <CText
                        testID={`phoneWitnessDetailsButtonText_${index}`}
                        style={styles.detailsButtonText}>
                        {String.seeMore}
                      </CText>
                    </TouchableOpacity>
                  )}
                </React.Fragment>
              ))}
        </ScrollView>
      )}

      {/* Modal de Error/Advertencia */}
      <CustomModal
        testID="witnessesErrorModal"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        confirmText={String.understood}
        onConfirm={() => setModalVisible(false)}
      />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(40, 50, 60),
  },
  loadingText: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#868686',
    marginTop: getResponsiveSize(8, 10, 12),
  },
  questionContainer: {
    backgroundColor: '#D1ECF1',
    borderColor: '#0C5460',
    borderWidth: 1,
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(8, 10, 14),
    paddingHorizontal: getResponsiveSize(10, 12, 16),
    marginHorizontal: getResponsiveSize(12, 16, 24),
    marginTop: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(12, 16, 20),
    alignItems: 'center',
  },
  questionText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#0C5460',
    fontWeight: '500',
    textAlign: 'center',
  },
  imageList: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(12, 16, 24),
  },
  // Tablet-specific styles
  tabletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(8, 12, 16),
  },
  tabletColumn: {
    flex: 0.48,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(6, 8, 10),
    padding: getResponsiveSize(6, 8, 12),
    marginBottom: getResponsiveSize(8, 12, 16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  imageCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(2, 4, 6),
  },
  mesaText: {
    fontSize: getResponsiveSize(12, 14, 16),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  fechaText: {
    fontSize: getResponsiveSize(10, 12, 14),
    color: '#868686',
  },
  imageDisplay: {
    width: '100%',
    height: getResponsiveSize(120, 150, 200),
    borderRadius: getResponsiveSize(3, 4, 6),
  },
  // Styles for the corner borders
  cornerBorder: {
    position: 'absolute',
    width: getResponsiveSize(16, 20, 24),
    height: getResponsiveSize(16, 20, 24),
    borderColor: '#2F2F2F',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: getResponsiveSize(6, 8, 12),
    left: getResponsiveSize(6, 8, 12),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: getResponsiveSize(6, 8, 12),
    right: getResponsiveSize(6, 8, 12),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: getResponsiveSize(6, 8, 12),
    left: getResponsiveSize(6, 8, 12),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: getResponsiveSize(6, 8, 12),
    right: getResponsiveSize(6, 8, 12),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  detailsButton: {
    backgroundColor: '#459151',
    paddingVertical: getResponsiveSize(10, 12, 16),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    marginTop: getResponsiveSize(-6, -8, -10),
    marginBottom: getResponsiveSize(8, 12, 16),
    marginHorizontal: isTablet ? 0 : getResponsiveSize(12, 16, 20),
  },
  detailsButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#fff',
  },
  noAttestationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 30, 40),
    paddingVertical: getResponsiveSize(40, 50, 60),
  },
  noAttestationsIconContainer: {
    width: getResponsiveSize(80, 100, 120),
    height: getResponsiveSize(80, 100, 120),
    borderRadius: getResponsiveSize(40, 50, 60),
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  noAttestationsIcon: {
    fontSize: getResponsiveSize(40, 50, 60),
  },
  noAttestationsTitle: {
    fontSize: getResponsiveSize(18, 20, 22),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(8, 12, 16),
  },
  noAttestationsMessage: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#868686',
    textAlign: 'center',
    lineHeight: getResponsiveSize(20, 24, 28),
    marginBottom: getResponsiveSize(20, 24, 32),
  },
  refreshButton: {
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(6, 8, 10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  refreshButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default MyWitnessesListScreen;

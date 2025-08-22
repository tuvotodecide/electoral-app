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
import UniversalHeader from '../../../components/common/UniversalHeader';
import CustomModal from '../../../components/common/CustomModal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants';
import {fetchActasByMesa} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const WhichIsCorrectScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {tableData, photoUri, isFromUnifiedFlow} = route.params || {};
  console.log('WhichIsCorrectScreen - Received params:', route.params);

  // State management
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [confirmedCorrectActa, setConfirmedCorrectActa] = useState(null);
  const [showConfirmationView, setShowConfirmationView] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });
  const [isLoadingActas, setIsLoadingActas] = useState(true);
  const [actaImages, setActaImages] = useState([]);
  const [partyResults, setPartyResults] = useState([]);
  const [voteSummaryResults, setVoteSummaryResults] = useState([]);

  // Load actas when component mounts
  useEffect(() => {
    console.log('WhichIsCorrectScreen - useEffect triggered with tableData:', tableData);

    const mesaId = tableData?.id || tableData?.numero || tableData?.tableNumber || tableData?.number;
    console.log('WhichIsCorrectScreen - Extracted mesaId:', mesaId);

    if (mesaId) {
      loadActasByMesa(mesaId);
    } else {
      console.warn('WhichIsCorrectScreen - No valid mesa ID found, using fallback');
      setActaImages([
        {
          id: '1',
          uri: photoUri || 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
        },
      ]);
      setIsLoadingActas(false);
    }
  }, [tableData, photoUri]);

  const loadActasByMesa = async mesaId => {
    try {
      setIsLoadingActas(true);
      console.log('WhichIsCorrectScreen: Loading actas for mesa:', mesaId);

      let numericId = mesaId;
      if (typeof mesaId === 'string' && mesaId.includes('Mesa')) {
        const match = mesaId.match(/\d+/);
        if (match) {
          numericId = parseInt(match[0], 10);
        }
      }

      console.log('WhichIsCorrectScreen: Using numeric ID:', numericId);
      const response = await fetchActasByMesa(numericId);

      if (response.success) {
        console.log('WhichIsCorrectScreen: Actas loaded successfully:', response.data);
        setActaImages(response.data.images);
        setPartyResults(response.data.partyResults);
        setVoteSummaryResults(response.data.voteSummaryResults);
      } else {
        console.error('WhichIsCorrectScreen: Failed to load actas');
        showModal('error', String.error, String.couldNotLoadActas);
        // Fallback data
        setActaImages([
          {
            id: '1',
            uri: photoUri || 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
          },
        ]);
        setPartyResults([
          {id: 'unidad', partido: 'Unidad', presidente: '45', diputado: '42'},
          {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '12', diputado: '8'},
          {id: 'pdc', partido: 'PDC', presidente: '28', diputado: '31'},
          {id: 'morena', partido: 'Morena', presidente: '3', diputado: '2'},
        ]);
        setVoteSummaryResults([
          {id: 'validos', label: 'Válidos', value1: '88', value2: '83'},
          {id: 'blancos', label: 'Blancos', value1: '15', value2: '12'},
          {id: 'nulos', label: 'Nulos', value1: '4', value2: '7'},
        ]);
      }
    } catch (error) {
      console.error('WhichIsCorrectScreen: Error loading actas:', error);
      showModal('error', String.error, String.errorLoadingActas);
      // Fallback data
      setActaImages([
        {
          id: '1',
          uri: photoUri || 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
        },
      ]);
      setPartyResults([
        {id: 'unidad', partido: 'Unidad', presidente: '45', diputado: '42'},
        {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '12', diputado: '8'},
        {id: 'pdc', partido: 'PDC', presidente: '28', diputado: '31'},
        {id: 'morena', partido: 'Morena', presidente: '3', diputado: '2'},
      ]);
      setVoteSummaryResults([
        {id: 'validos', label: 'Válidos', value1: '88', value2: '83'},
        {id: 'blancos', label: 'Blancos', value1: '15', value2: '12'},
        {id: 'nulos', label: 'Nulos', value1: '4', value2: '7'},
      ]);
    } finally {
      setIsLoadingActas(false);
    }
  };

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleImagePress = imageId => {
    setSelectedImageId(imageId);
  };

  const handleVerMasDetalles = () => {
    if (selectedImageId) {
      const selectedImage = actaImages.find(img => img.id === selectedImageId);
      if (selectedImage) {
        navigation.navigate('ActaDetailScreen', {
          selectedActa: selectedImage,
          tableData: tableData,
          partyResults: partyResults,
          voteSummaryResults: voteSummaryResults,
          actaImages: actaImages,
          allActas: actaImages,
          onCorrectActaSelected: handleCorrectActaSelected,
          onUploadNewActa: handleUploadNewActa,
        });
      }
    } else {
      showModal('warning', String.selectionRequired, String.pleaseSelectImageFirst);
    }
  };

  const handleCorrectActaSelected = actaId => {
    console.log('WhichIsCorrectScreen - Correct acta selected:', actaId);
    setConfirmedCorrectActa(actaId);
    setShowConfirmationView(true);
  };

  const handleUploadNewActa = () => {
    console.log('WhichIsCorrectScreen - Upload new acta requested');
    navigation.navigate(StackNav.TableDetail, {
      tableData: tableData,
      isFromUnifiedFlow: true,
      existingActas: actaImages,
    });
  };

  const handleContinueWithSelectedActa = () => {
    if (confirmedCorrectActa) {
      const selectedImage = actaImages.find(img => img.id === confirmedCorrectActa);
      if (selectedImage) {
        navigation.navigate('RecordReviewScreen', {
          photoUri: selectedImage.uri,
          tableData: tableData,
          partyResults: partyResults,
          voteSummaryResults: voteSummaryResults,
        });
      }
    }
  };

  const handleChangeOpinion = () => {
    console.log('WhichIsCorrectScreen - Change opinion requested');
    setConfirmedCorrectActa(null);
    setShowConfirmationView(false);
    setSelectedImageId(null);
  };

  const handleDatosNoCorrectos = () => {
    console.log('Estos datos no son correctos pressed');
    showModal('info', String.information, String.dataReportedAsIncorrect);
  };

  return (
    <CSafeAreaView style={styles.container}>
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={`${String.table} ${
          tableData?.tableNumber ||
          tableData?.numero ||
          tableData?.number ||
          'N/A'
        }`}
        showNotification={true}
      />

      {showConfirmationView ? (
        // Confirmation view showing selected acta with icons
        <>
          <View style={styles.questionContainer}>
            <CText style={styles.questionText}>{String.whichIsCorrect}</CText>
          </View>

          <ScrollView style={styles.imageList} showsVerticalScrollIndicator={false}>
            {actaImages.map(image => (
              <View key={image.id} style={styles.confirmationImageContainer}>
                <View
                  style={[
                    styles.imageCard,
                    image.id === confirmedCorrectActa && styles.imageCardCorrect,
                    image.id !== confirmedCorrectActa && styles.imageCardIncorrect,
                  ]}>
                  <Image
                    source={{uri: image.uri}}
                    style={styles.imageDisplay}
                    resizeMode="contain"
                  />

                  {/* Correct/Incorrect Icon */}
                  <View
                    style={[
                      styles.statusIcon,
                      image.id === confirmedCorrectActa
                        ? styles.correctIcon
                        : styles.incorrectIcon,
                    ]}>
                    <MaterialIcons
                      name={image.id === confirmedCorrectActa ? 'check-circle' : 'cancel'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Confirmation Buttons */}
          <View style={styles.confirmationButtonsContainer}>
            <TouchableOpacity
              style={[styles.continueButton, {backgroundColor: colors.primary || '#4F9858'}]}
              onPress={handleContinueWithSelectedActa}
              activeOpacity={0.8}>
              <CText style={styles.continueButtonText}>{String.continueButton}</CText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.changeOpinionButton, {borderColor: colors.textSecondary}]}
              onPress={handleChangeOpinion}
              activeOpacity={0.8}>
              <CText style={[styles.changeOpinionButtonText, {color: colors.textSecondary}]}>
                Cambiar de opinión
              </CText>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // Original selection view
        <>
          <View style={styles.questionContainer}>
            <CText style={styles.questionText}>{String.whichIsCorrect}</CText>
          </View>

          {isLoadingActas ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary || '#4F9858'} />
              <CText style={styles.loadingText}>{String.loadingActas}</CText>
            </View>
          ) : (
            <ScrollView style={styles.imageList} showsVerticalScrollIndicator={false}>
              {isTablet
                ? // Two-column layout for tablets
                  (() => {
                    const pairs = [];
                    for (let i = 0; i < actaImages.length; i += 2) {
                      pairs.push(actaImages.slice(i, i + 2));
                    }
                    return pairs.map((pair, pairIndex) => (
                      <View key={pairIndex} style={styles.tabletRow}>
                        {pair.map(image => (
                          <View key={image.id} style={styles.tabletColumn}>
                            <TouchableOpacity
                              style={[
                                styles.imageCard,
                                selectedImageId === image.id && styles.imageCardSelected,
                              ]}
                              onPress={() => handleImagePress(image.id)}>
                              <Image
                                source={{uri: image.uri}}
                                style={styles.imageDisplay}
                                resizeMode="contain"
                              />
                              {selectedImageId === image.id && (
                                <>
                                  <View style={[styles.cornerBorder, styles.topLeftCorner]} />
                                  <View style={[styles.cornerBorder, styles.topRightCorner]} />
                                  <View style={[styles.cornerBorder, styles.bottomLeftCorner]} />
                                  <View style={[styles.cornerBorder, styles.bottomRightCorner]} />
                                </>
                              )}
                            </TouchableOpacity>
                            {selectedImageId === image.id && (
                              <TouchableOpacity
                                style={styles.detailsButton}
                                onPress={handleVerMasDetalles}>
                                <CText style={styles.detailsButtonText}>
                                  {String.seeMoreDetails}
                                </CText>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                        {pair.length === 1 && <View style={styles.tabletColumn} />}
                      </View>
                    ));
                  })()
                : // Single column layout for phones
                  actaImages.map(image => (
                    <React.Fragment key={image.id}>
                      <TouchableOpacity
                        style={[
                          styles.imageCard,
                          selectedImageId === image.id && styles.imageCardSelected,
                        ]}
                        onPress={() => handleImagePress(image.id)}>
                        <Image
                          source={{uri: image.uri}}
                          style={styles.imageDisplay}
                          resizeMode="contain"
                        />
                        {selectedImageId === image.id && (
                          <>
                            <View style={[styles.cornerBorder, styles.topLeftCorner]} />
                            <View style={[styles.cornerBorder, styles.topRightCorner]} />
                            <View style={[styles.cornerBorder, styles.bottomLeftCorner]} />
                            <View style={[styles.cornerBorder, styles.bottomRightCorner]} />
                          </>
                        )}
                      </TouchableOpacity>
                      {selectedImageId === image.id && (
                        <TouchableOpacity
                          style={styles.detailsButton}
                          onPress={handleVerMasDetalles}>
                          <CText style={styles.detailsButtonText}>
                            {String.seeMoreDetails}
                          </CText>
                        </TouchableOpacity>
                      )}
                    </React.Fragment>
                  ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.datosNoCorrectosButton} onPress={handleDatosNoCorrectos}>
            <CText style={styles.datosNoCorrectosButtonText}>{String.dataNotCorrect}</CText>
          </TouchableOpacity>
        </>
      )}

      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
      />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  questionContainer: {
    padding: getResponsiveSize(12, 16, 20),
    backgroundColor: '#FFFFFF',
    marginHorizontal: getResponsiveSize(8, 12, 16),
    marginTop: getResponsiveSize(8, 12, 16),
    borderRadius: getResponsiveSize(6, 8, 10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '600',
    textAlign: 'center',
    color: '#2F2F2F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 30, 40),
  },
  loadingText: {
    marginTop: getResponsiveSize(12, 15, 18),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    textAlign: 'center',
  },
  imageList: {
    flex: 1,
    padding: getResponsiveSize(8, 12, 16),
  },
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
  imageCardCorrect: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  imageCardIncorrect: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  imageDisplay: {
    width: '100%',
    height: getResponsiveSize(120, 150, 200),
    borderRadius: getResponsiveSize(3, 4, 6),
  },
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
  statusIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctIcon: {
    backgroundColor: '#4CAF50',
  },
  incorrectIcon: {
    backgroundColor: '#F44336',
  },
  confirmationImageContainer: {
    marginBottom: 16,
  },
  confirmationButtonsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  changeOpinionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  changeOpinionButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  datosNoCorrectosButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: getResponsiveSize(12, 14, 18),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    marginTop: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(20, 24, 32),
    marginHorizontal: getResponsiveSize(12, 16, 20),
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  datosNoCorrectosButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#D32F2F',
  },
});

export default WhichIsCorrectScreen;

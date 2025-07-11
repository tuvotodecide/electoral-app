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
import CText from '../../../components/common/CText'; // Adjust path as needed
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CustomModal from '../../../components/common/CustomModal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants'; // Adjust path as needed
import {fetchActasByMesa} from '../../../data/mockMesas';
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
  const {tableData, photoUri} = route.params || {};
  console.log('WhichIsCorrectScreen - Received params:', route.params);
  console.log('WhichIsCorrectScreen - tableData:', tableData);
  console.log('WhichIsCorrectScreen - photoUri:', photoUri);

  // State to keep track of the currently selected image
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });

  // Estados para las actas de la mesa
  const [isLoadingActas, setIsLoadingActas] = useState(true);
  const [actaImages, setActaImages] = useState([]);
  const [partyResults, setPartyResults] = useState([]);
  const [voteSummaryResults, setVoteSummaryResults] = useState([]);

  // Cargar actas de la mesa al montar el componente
  useEffect(() => {
    if (tableData?.id) {
      loadActasByMesa(tableData.id);
    }
  }, [tableData]);

  const loadActasByMesa = async mesaId => {
    try {
      setIsLoadingActas(true);
      console.log('WhichIsCorrectScreen: Loading actas for mesa:', mesaId);
      const response = await fetchActasByMesa(mesaId);

      if (response.success) {
        console.log(
          'WhichIsCorrectScreen: Actas loaded successfully:',
          response.data,
        );
        setActaImages(response.data.images);
        setPartyResults(response.data.partyResults);
        setVoteSummaryResults(response.data.voteSummaryResults);
      } else {
        console.error('WhichIsCorrectScreen: Failed to load actas');
        showModal('error', String.error, String.couldNotLoadActas);
        // Fallback con imagen por defecto
        setActaImages([
          {
            id: '1',
            uri:
              photoUri ||
              'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
          },
        ]);
      }
    } catch (error) {
      console.error('WhichIsCorrectScreen: Error loading actas:', error);
      showModal('error', String.error, String.errorLoadingActas);
      // Fallback con imagen por defecto
      setActaImages([
        {
          id: '1',
          uri:
            photoUri ||
            'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
        },
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
        // Navigate to RecordReviewScreen, passing the specific photoUri, tableData, and results
        navigation.navigate('RecordReviewScreen', {
          photoUri: selectedImage.uri,
          mesaData: tableData,
          partyResults: partyResults,
          voteSummaryResults: voteSummaryResults,
        });
      }
    } else {
      showModal(
        'warning',
        String.selectionRequired,
        String.pleaseSelectImageFirst,
      );
    }
  };

  const handleDatosNoCorrectos = () => {
    console.log('Estos datos no son correctos pressed');
    showModal('info', String.information, String.dataReportedAsIncorrect);
  };

  return (
    <CSafeAreaView style={styles.container}>
      {/* Header */}
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={`${String.table} ${tableData?.numero || 'N/A'}`}
        showNotification={true}
      />

      {/* Question Text */}
      <View style={styles.questionContainer}>
        <CText style={styles.questionText}>{String.whichIsCorrect}</CText>
      </View>

      {/* Loading indicator for actas */}
      {isLoadingActas ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#4F9858'} />
          <CText style={styles.loadingText}>{String.loadingActas}</CText>
        </View>
      ) : (
        /* Image List */
        <ScrollView
          style={styles.imageList}
          showsVerticalScrollIndicator={false}>
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
                            selectedImageId === image.id &&
                              styles.imageCardSelected,
                          ]}
                          onPress={() => handleImagePress(image.id)}>
                          <Image
                            source={{uri: image.uri}}
                            style={styles.imageDisplay}
                            resizeMode="contain"
                          />
                          {selectedImageId === image.id && (
                            <>
                              {/* Corner borders - black color */}
                              <View
                                style={[
                                  styles.cornerBorder,
                                  styles.topLeftCorner,
                                ]}
                              />
                              <View
                                style={[
                                  styles.cornerBorder,
                                  styles.topRightCorner,
                                ]}
                              />
                              <View
                                style={[
                                  styles.cornerBorder,
                                  styles.bottomLeftCorner,
                                ]}
                              />
                              <View
                                style={[
                                  styles.cornerBorder,
                                  styles.bottomRightCorner,
                                ]}
                              />
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
                        {/* Corner borders - black color */}
                        <View
                          style={[styles.cornerBorder, styles.topLeftCorner]}
                        />
                        <View
                          style={[styles.cornerBorder, styles.topRightCorner]}
                        />
                        <View
                          style={[styles.cornerBorder, styles.bottomLeftCorner]}
                        />
                        <View
                          style={[
                            styles.cornerBorder,
                            styles.bottomRightCorner,
                          ]}
                        />
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
          {/* "Estos datos no son correctos" button remains at the bottom of the ScrollView */}
          {selectedImageId && (
            <TouchableOpacity
              style={styles.datosNoCorrectosButton}
              onPress={handleDatosNoCorrectos}>
              <CText style={styles.datosNoCorrectosButtonText}>
                {String.dataNotCorrect}
              </CText>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Custom Modal */}
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
    backgroundColor: '#ffffff', // White background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(40, 50, 60),
  },
  loadingText: {
    marginTop: getResponsiveSize(12, 15, 18),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: '#D1ECF1', // Light blue background
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
    color: '#0C5460', // Green text color
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
    position: 'relative', // Needed for absolute positioning of corner borders
  },
  imageCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50', // Green border when selected
  },
  imageDisplay: {
    width: '100%',
    height: getResponsiveSize(120, 150, 200),
    borderRadius: getResponsiveSize(3, 4, 6),
  },
  // Styles for the corner borders
  cornerBorder: {
    position: 'absolute',
    width: getResponsiveSize(16, 20, 24), // Length of the corner lines
    height: getResponsiveSize(16, 20, 24), // Length of the corner lines
    borderColor: '#2F2F2F', // Black color for corner lines
    borderWidth: 2, // Thickness of the corner lines
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
    backgroundColor: '#459151', // Green button
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
    backgroundColor: '#FFFFFF', // White background
    paddingVertical: getResponsiveSize(12, 14, 18),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    marginTop: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(20, 24, 32),
    marginHorizontal: getResponsiveSize(12, 16, 20),
    borderWidth: 1, // Add border
    borderColor: '#D32F2F', // Red border color
  },
  datosNoCorrectosButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#D32F2F', // Red text color
  },
});

export default WhichIsCorrectScreen;

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
  const {
    tableData,
    photoUri,
    isFromUnifiedFlow,
    actaImages: preloadedActaImages,
    existingRecords,
    mesaInfo,
    totalRecords,
    isFromAPI,
  } = route.params || {};

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

  // Component for handling IPFS images
  const IPFSImage = ({
    image,
    style,
    resizeMode = 'contain',
    onError,
    onLoad,
  }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleImageError = error => {
      setHasError(true);
      setIsLoading(false);
      if (onError) onError(error);
    };

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
      if (onLoad) onLoad();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    if (hasError) {
      return (
        <View style={[style, styles.imageError]}>
          <MaterialIcons name="broken-image" size={40} color="#999" />
          <CText style={styles.imageErrorText}>Error cargando imagen</CText>
          <CText style={styles.imageErrorSubtext}>
            URL: {image.uri?.substring(0, 50)}...
          </CText>
        </View>
      );
    }

    return (
      <View style={style}>
        <Image
          source={{
            uri: image.uri,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ReactNative)',
              Accept: 'image/*',
            },
          }}
          style={[style, isLoading && styles.imageLoading]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {isLoading && (
          <View style={[style, styles.imageLoadingOverlay]}>
            <ActivityIndicator
              size="small"
              color={colors.primary || '#4F9858'}
            />
            <CText style={styles.loadingIndicatorText}>
              Cargando imagen...
            </CText>
          </View>
        )}
      </View>
    );
  };

  // Load actas when component mounts
  useEffect(() => {
    // If we have preloaded acta images from API, use them directly
    if (isFromAPI && preloadedActaImages && preloadedActaImages.length > 0) {
      setActaImages(preloadedActaImages);
      setIsLoadingActas(false);
      return;
    }

    // If we don't have API data and have a photoUri, create a single acta image
    if (photoUri) {
      setActaImages([
        {
          id: '1',
          uri: photoUri,
        },
      ]);
      setIsLoadingActas(false);
      return;
    }

    setActaImages([]);
    setPartyResults([]);
    setVoteSummaryResults([]);
    setIsLoadingActas(false);
  }, [tableData, photoUri, isFromAPI, preloadedActaImages, existingRecords]);

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
    const selectedImage = actaImages.find(img => img.id === imageId);
    if (!selectedImage) return;

    navigation.navigate('ActaDetailScreen', {
      selectedActa: selectedImage,
      tableData: tableData,
      partyResults: selectedImage.partyResults || [],
      voteSummaryResults: selectedImage.voteSummaryResults || [],
      actaImages: actaImages,
      allActas: actaImages,
      onCorrectActaSelected: handleCorrectActaSelected,
      onUploadNewActa: handleUploadNewActa,
    });
  };


  const handleCorrectActaSelected = actaId => {
    // Clear any previous selection and set the new one
    setSelectedImageId(null);
    setConfirmedCorrectActa(actaId);
    setShowConfirmationView(true);
  };

  const handleUploadNewActa = () => {
    navigation.navigate(StackNav.TableDetail, {
      tableData: tableData,
      isFromUnifiedFlow: true,
      existingActas: actaImages,
    });
  };

  const handleContinueWithSelectedActa = () => {
    if (confirmedCorrectActa) {
      const selectedImage = actaImages.find(
        img => img.id === confirmedCorrectActa,
      );
      if (selectedImage) {
        // Transformar voteSummaryResults a array aquí
        const transformedVoteSummary = [
          {
            label: 'Válidos',
            value1: selectedImage.voteSummaryResults?.presValidVotes || 0,
            value2: selectedImage.voteSummaryResults?.depValidVotes || 0,
          },
          {
            label: 'Blancos',
            value1: selectedImage.voteSummaryResults?.presBlankVotes || 0,
            value2: selectedImage.voteSummaryResults?.depBlankVotes || 0,
          },
          {
            label: 'Nulos',
            value1: selectedImage.voteSummaryResults?.presNullVotes || 0,
            value2: selectedImage.voteSummaryResults?.depNullVotes || 0,
          },
          {
            label: 'Total',
            value1: selectedImage.voteSummaryResults?.presTotalVotes || 0,
            value2: selectedImage.voteSummaryResults?.depTotalVotes || 0,
          },
        ];

        navigation.navigate('RecordReviewScreen', {
          recordId: selectedImage.recordId,
          photoUri: selectedImage.uri,
          tableData: tableData,
          mesaInfo: mesaInfo,
          partyResults: selectedImage.partyResults || [],
          voteSummaryResults: transformedVoteSummary,
        });
      }
    }
  };

  const handleChangeOpinion = () => {
    setConfirmedCorrectActa(null);
    setShowConfirmationView(false);
    setSelectedImageId(null);
  };

  const handleDatosNoCorrectos = () => {
    if (isFromAPI) {
      // If we came from API, go to camera to add new acta

      navigation.navigate(StackNav.CameraScreen, {
        tableData: tableData,
        mesa: tableData,
        mesaData: tableData,
        existingActas: actaImages,
        isAddingToExisting: actaImages.length > 0,
      });
    } else {
      // For legacy cases without API data, show info modal
      showModal('info', String.information, String.dataReportedAsIncorrect);
    }
  };

  return (
    <CSafeAreaView style={styles.container} addTabPadding={false}>
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

          <ScrollView
            style={styles.imageList}
            showsVerticalScrollIndicator={false}>
            {actaImages.map(image => {
              const isCorrect = image.id === confirmedCorrectActa;

              return (
                <View
                  key={`confirmation-${image.id}`}
                  style={styles.confirmationImageContainer}>
                  <View
                    style={[
                      styles.imageCard,
                      isCorrect
                        ? styles.imageCardCorrect
                        : styles.imageCardIncorrect,
                    ]}>
                    <IPFSImage
                      image={image}
                      style={styles.imageDisplay}
                      resizeMode="contain"
                    />

                    {/* Status Icon - Check for correct, X for incorrect */}
                    <View
                      style={[
                        styles.statusIcon,
                        isCorrect ? styles.correctIcon : styles.incorrectIcon,
                      ]}>
                      <MaterialIcons
                        name={isCorrect ? 'check-circle' : 'cancel'}
                        size={24}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Confirmation Buttons */}
          <View style={styles.confirmationButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                {backgroundColor: colors.primary || '#4F9858'},
              ]}
              onPress={handleContinueWithSelectedActa}
              activeOpacity={0.8}>
              <CText style={styles.continueButtonText}>
                {String.continueButton}
              </CText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.changeOpinionButton,
                  {backgroundColor: '#ff0000ff'},
              ]}
              onPress={handleChangeOpinion}
              activeOpacity={0.8}>
              <CText
                style={[
                  styles.changeOpinionButtonText,
                ]}>
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
            {isFromAPI && actaImages.length > 0 && (
              <View style={styles.apiInfoContainer}>
                <CText style={styles.apiInfoText}>
                  Se encontraron {actaImages.length} acta
                  {actaImages.length > 1 ? 's' : ''} atestiguada
                  {actaImages.length > 1 ? 's' : ''} para esta mesa
                </CText>
              </View>
            )}
          </View>

          {isLoadingActas ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary || '#4F9858'}
              />
              <CText style={styles.loadingText}>{String.loadingActas}</CText>
            </View>
          ) : actaImages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <CText style={styles.noImagesText}>
                No se encontraron imágenes para mostrar
              </CText>
              <CText style={styles.debugText}>
                Debug: isFromAPI={String(isFromAPI)}, preloadedLength=
                {preloadedActaImages?.length || 0}
              </CText>
            </View>
          ) : (
            <ScrollView
              style={styles.imageList}
              showsVerticalScrollIndicator={false}>
              {isTablet
                ? (() => {
                    const pairs = [];
                    for (let i = 0; i < actaImages.length; i += 2) {
                      pairs.push(actaImages.slice(i, i + 2));
                    }
                    return pairs.map((pair, pairIndex) => (
                      <View key={pairIndex} style={styles.tabletRow}>
                        {pair.map(image => (
                          <View key={image.id} style={styles.tabletColumn}>
                            <TouchableOpacity
                              style={styles.imageCard}
                              onPress={() => handleImagePress(image.id)}>
                              <IPFSImage
                                image={image}
                                style={styles.imageDisplay}
                                resizeMode="contain"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                        {pair.length === 1 && (
                          <View style={styles.tabletColumn} />
                        )}
                      </View>
                    ));
                  })()
                : actaImages.map(image => (
                    <TouchableOpacity
                      key={image.id}
                      style={styles.imageCard}
                      onPress={() => handleImagePress(image.id)}>
                      <IPFSImage
                        image={image}
                        style={styles.imageDisplay}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              styles.datosNoCorrectosButton,
              isFromAPI && styles.addNewActaButton,
            ]}
            onPress={handleDatosNoCorrectos}>
            <CText
              style={[
                styles.datosNoCorrectosButtonText,
                isFromAPI && styles.addNewActaButtonText,
              ]}>
              {isFromAPI ? 'Agregar Nueva Acta' : String.dataNotCorrect}
            </CText>
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
  apiInfoContainer: {
    marginTop: getResponsiveSize(8, 10, 12),
    paddingTop: getResponsiveSize(8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  apiInfoText: {
    fontSize: getResponsiveSize(13, 14, 15),
    textAlign: 'center',
    color: '#4F9858',
    fontWeight: '500',
    fontStyle: 'italic',
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
  noImagesText: {
    fontSize: getResponsiveSize(16, 18, 20),
    color: '#999',
    textAlign: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  debugText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
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
    color: '#FFFFFF',
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
  addNewActaButton: {
    borderColor: '#4F9858',
    backgroundColor: '#F8F9FA',
  },
  addNewActaButtonText: {
    color: '#4F9858',
  },
  imageError: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveSize(3, 4, 6),
  },
  imageErrorText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#999',
    marginTop: getResponsiveSize(4, 6, 8),
    textAlign: 'center',
  },
  imageErrorSubtext: {
    fontSize: getResponsiveSize(10, 12, 14),
    color: '#ccc',
    marginTop: getResponsiveSize(2, 4, 6),
    textAlign: 'center',
  },
  loadingIndicatorText: {
    fontSize: getResponsiveSize(10, 12, 14),
    color: '#666',
    marginTop: getResponsiveSize(4, 6, 8),
    textAlign: 'center',
  },
  imageLoading: {
    opacity: 0.5,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: getResponsiveSize(3, 4, 6),
  },
});

export default WhichIsCorrectScreen;

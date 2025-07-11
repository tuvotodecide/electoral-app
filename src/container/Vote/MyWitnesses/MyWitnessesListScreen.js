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
import {fetchMyWitnesses} from '../../../data/mockMesas';

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
  const {mesaData} = route.params || {};

  // Estados para la carga de datos
  const [witnessRecords, setWitnessRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({});
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Cargar atestiguamientos al montar el componente
  useEffect(() => {
    loadWitnessRecords();
  }, []);

  const loadWitnessRecords = async () => {
    setLoading(true);
    try {
      console.log('MyWitnessesListScreen: Fetching witness records...');
      const response = await fetchMyWitnesses();
      if (response.success) {
        console.log(
          'MyWitnessesListScreen: Data loaded successfully:',
          response.data,
        );
        setWitnessRecords(response.data);
      } else {
        setModalData({
          title: String.error,
          message: response.message || String.errorLoadingWitnesses,
          type: 'error',
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.log(
        'MyWitnessesListScreen: Error loading witness records:',
        error,
      );
      setModalData({
        title: String.connectionError,
        message: String.connectionErrorMessage,
        type: 'error',
      });
      setModalVisible(true);
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
        item => item.id.toString() === selectedImageId,
      );
      if (selectedWitnessRecord) {
        // Navigate to MyWitnessesDetailScreen
        navigation.navigate(StackNav.MyWitnessesDetailScreen, {
          photoUri: selectedWitnessRecord.imagen,
          mesaData: selectedWitnessRecord,
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

  // Dummy data for attestation images
  const dummyImages = [
    {
      id: '1',
      uri: 'https://placehold.co/400x200/cccccc/000000?text=Acta+Atestiguada+1',
      fecha: '15/12/2024',
      mesa: 'Mesa 001',
    },
    {
      id: '2',
      uri: 'https://placehold.co/400x200/cccccc/000000?text=Acta+Atestiguada+2',
      fecha: '14/12/2024',
      mesa: 'Mesa 045',
    },
    {
      id: '3',
      uri: 'https://placehold.co/400x200/cccccc/000000?text=Acta+Atestiguada+3',
      fecha: '13/12/2024',
      mesa: 'Mesa 102',
    },
  ];

  return (
    <CSafeAreaView style={styles.container}>
      {/* Header */}
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={String.myWitnessesTitle}
        showNotification={true}
      />

      {/* Question Text */}
      <View style={styles.questionContainer}>
        <CText style={styles.questionText}>
          {String.selectDocumentToReview}
        </CText>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#459151'} />
          <CText style={styles.loadingText}>{String.loadingWitnesses}</CText>
        </View>
      ) : (
        <ScrollView
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
                    {pair.map(witnessRecord => (
                      <View key={witnessRecord.id} style={styles.tabletColumn}>
                        <TouchableOpacity
                          style={[
                            styles.imageCard,
                            selectedImageId === witnessRecord.id.toString() &&
                              styles.imageCardSelected,
                          ]}
                          onPress={() =>
                            handleImagePress(witnessRecord.id.toString())
                          }>
                          <View style={styles.imageHeader}>
                            <CText style={styles.mesaText}>
                              {witnessRecord.mesa}
                            </CText>
                            <CText style={styles.fechaText}>
                              {witnessRecord.fecha} - {witnessRecord.hora}
                            </CText>
                          </View>
                          <Image
                            source={{uri: witnessRecord.imagen}}
                            style={styles.imageDisplay}
                            resizeMode="contain"
                          />
                          {selectedImageId === witnessRecord.id.toString() && (
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
                        {selectedImageId === witnessRecord.id.toString() && (
                          <TouchableOpacity
                            style={styles.detailsButton}
                            onPress={handleVerMas}>
                            <CText style={styles.detailsButtonText}>
                              {String.seeMore}
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
              witnessRecords.map(witnessRecord => (
                <React.Fragment key={witnessRecord.id}>
                  <TouchableOpacity
                    style={[
                      styles.imageCard,
                      selectedImageId === witnessRecord.id.toString() &&
                        styles.imageCardSelected,
                    ]}
                    onPress={() =>
                      handleImagePress(witnessRecord.id.toString())
                    }>
                    <View style={styles.imageHeader}>
                      <CText style={styles.mesaText}>
                        {witnessRecord.mesa}
                      </CText>
                      <CText style={styles.fechaText}>
                        {witnessRecord.fecha} - {witnessRecord.hora}
                      </CText>
                    </View>
                    <Image
                      source={{uri: witnessRecord.imagen}}
                      style={styles.imageDisplay}
                      resizeMode="contain"
                    />
                    {selectedImageId === witnessRecord.id.toString() && (
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
                  {selectedImageId === witnessRecord.id.toString() && (
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={handleVerMas}>
                      <CText style={styles.detailsButtonText}>
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
});

export default MyWitnessesListScreen;

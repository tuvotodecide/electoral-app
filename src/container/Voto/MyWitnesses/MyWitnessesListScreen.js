import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import String from '../../../i18n/String';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CustomModal from '../../../components/common/CustomModal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';
import {fetchMyWitnesses} from '../../../data/mockMesas';

const MyWitnessesListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {mesaData} = route.params || {};

  // Estados para la carga de datos
  const [atestiguamientos, setAtestiguamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({});
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Cargar atestiguamientos al montar el componente
  useEffect(() => {
    loadAtestiguamientos();
  }, []);

  const loadAtestiguamientos = async () => {
    setLoading(true);
    try {
      console.log('MyWitnessesListScreen: Fetching atestiguamientos...');
      const response = await fetchMyWitnesses();
      if (response.success) {
        console.log(
          'MyWitnessesListScreen: Data loaded successfully:',
          response.data,
        );
        setAtestiguamientos(response.data);
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
        'MyWitnessesListScreen: Error loading atestiguamientos:',
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
      const selectedAtestiguamiento = atestiguamientos.find(
        item => item.id.toString() === selectedImageId,
      );
      if (selectedAtestiguamiento) {
        // Navigate to MyWitnessesDetailScreen
        navigation.navigate(StackNav.MyWitnessesDetailScreen, {
          photoUri: selectedAtestiguamiento.imagen,
          mesaData: selectedAtestiguamiento,
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
          {atestiguamientos.map(atestiguamiento => (
            <React.Fragment key={atestiguamiento.id}>
              <TouchableOpacity
                style={[
                  styles.imageCard,
                  selectedImageId === atestiguamiento.id.toString() &&
                    styles.imageCardSelected,
                ]}
                onPress={() => handleImagePress(atestiguamiento.id.toString())}>
                <View style={styles.imageHeader}>
                  <CText style={styles.mesaText}>{atestiguamiento.mesa}</CText>
                  <CText style={styles.fechaText}>
                    {atestiguamiento.fecha} - {atestiguamiento.hora}
                  </CText>
                </View>
                <Image
                  source={{uri: atestiguamiento.imagen}}
                  style={styles.imageDisplay}
                  resizeMode="contain"
                />
                {selectedImageId === atestiguamiento.id.toString() && (
                  <>
                    {/* Corner borders - black color */}
                    <View style={[styles.cornerBorder, styles.topLeftCorner]} />
                    <View
                      style={[styles.cornerBorder, styles.topRightCorner]}
                    />
                    <View
                      style={[styles.cornerBorder, styles.bottomLeftCorner]}
                    />
                    <View
                      style={[styles.cornerBorder, styles.bottomRightCorner]}
                    />
                  </>
                )}
              </TouchableOpacity>
              {selectedImageId === atestiguamiento.id.toString() && (
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
    paddingVertical: moderateScale(50),
  },
  loadingText: {
    fontSize: moderateScale(16),
    color: '#868686',
    marginTop: moderateScale(10),
  },
  questionContainer: {
    backgroundColor: '#D1ECF1',
    borderColor: '#0C5460',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(16),
    alignItems: 'center',
  },
  questionText: {
    fontSize: moderateScale(14),
    color: '#0C5460',
    fontWeight: '500',
  },
  imageList: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    marginBottom: moderateScale(12),
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
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(4),
  },
  mesaText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  fechaText: {
    fontSize: moderateScale(12),
    color: '#868686',
  },
  imageDisplay: {
    width: '100%',
    height: moderateScale(150),
    borderRadius: moderateScale(4),
  },
  // Styles for the corner borders
  cornerBorder: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderColor: '#2F2F2F',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  detailsButton: {
    backgroundColor: '#459151',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: moderateScale(-8),
    marginBottom: moderateScale(12),
    marginHorizontal: moderateScale(16),
  },
  detailsButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
});

export default MyWitnessesListScreen;

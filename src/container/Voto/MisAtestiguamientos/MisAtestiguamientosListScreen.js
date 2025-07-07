import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import UniversalHeader from '../../../components/common/UniversalHeader';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';

const MisAtestiguamientosListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {mesaData} = route.params || {};

  // State to keep track of the currently selected image
  const [selectedImageId, setSelectedImageId] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleImagePress = imageId => {
    setSelectedImageId(imageId);
  };

  const handleVerMas = () => {
    if (selectedImageId) {
      const selectedImage = dummyImages.find(img => img.id === selectedImageId);
      if (selectedImage) {
        // Navigate to MisAtestiguamientosDetailScreen
        navigation.navigate(StackNav.MisAtestiguamientosDetailScreen, {
          photoUri: selectedImage.uri,
          mesaData: mesaData,
        });
      }
    } else {
      Alert.alert(
        'Selección Requerida',
        'Por favor, selecciona una imagen primero.',
      );
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
        title="Mis Atestiguamientos"
        showNotification={true}
      />

      {/* Question Text */}
      <View style={styles.questionContainer}>
        <CText style={styles.questionText}>
          Selecciona el acta que deseas revisar
        </CText>
      </View>

      {/* Image List */}
      <ScrollView
        style={styles.imageList}
        showsVerticalScrollIndicator={false}>
        {dummyImages.map(image => (
          <React.Fragment key={image.id}>
            <TouchableOpacity
              style={[
                styles.imageCard,
                selectedImageId === image.id && styles.imageCardSelected,
              ]}
              onPress={() => handleImagePress(image.id)}>
              <View style={styles.imageHeader}>
                <CText style={styles.mesaText}>{image.mesa}</CText>
                <CText style={styles.fechaText}>{image.fecha}</CText>
              </View>
              <Image
                source={{uri: image.uri}}
                style={styles.imageDisplay}
                resizeMode="contain"
              />
              {selectedImageId === image.id && (
                <>
                  {/* Corner borders - black color */}
                  <View style={[styles.cornerBorder, styles.topLeftCorner]} />
                  <View style={[styles.cornerBorder, styles.topRightCorner]} />
                  <View
                    style={[styles.cornerBorder, styles.bottomLeftCorner]}
                  />
                  <View
                    style={[styles.cornerBorder, styles.bottomRightCorner]}
                  />
                </>
              )}
            </TouchableOpacity>
            {selectedImageId === image.id && (
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={handleVerMas}>
                <CText style={styles.detailsButtonText}>Ver más</CText>
              </TouchableOpacity>
            )}
          </React.Fragment>
        ))}
      </ScrollView>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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

export default MisAtestiguamientosListScreen;

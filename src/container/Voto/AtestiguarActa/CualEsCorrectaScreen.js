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
import CText from '../../../components/common/CText'; // Adjust path as needed
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import UniversalHeader from '../../../components/common/UniversalHeader';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants'; // Adjust path as needed

const CualEsCorrectaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {mesaData, photoUri} = route.params || {};

  // State to keep track of the currently selected image
  const [selectedImageId, setSelectedImageId] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleImagePress = imageId => {
    setSelectedImageId(imageId);
  };

  const handleVerMasDetalles = () => {
    if (selectedImageId) {
      const selectedImage = dummyImages.find(img => img.id === selectedImageId);
      if (selectedImage) {
        // Navigate to ActaReviewScreen, passing the specific photoUri and mesaData
        navigation.navigate('ActaReviewScreen', {
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

  const handleDatosNoCorrectos = () => {
    console.log('Estos datos no son correctos pressed');
    Alert.alert(
      'Información',
      'Se ha reportado que los datos no son correctos.',
    );
  };

  // Dummy data for multiple images (you'll replace this with actual logic)
  const dummyImages = [
    {
      id: '1',
      uri: photoUri || 'https://placehold.co/400x200/cccccc/000000?text=Acta+1',
    },
    {id: '2', uri: 'https://placehold.co/400x200/cccccc/000000?text=Acta+2'},
    {id: '3', uri: 'https://placehold.co/400x200/cccccc/000000?text=Acta+3'},
  ];

  return (
    <CSafeAreaView style={styles.container}>
      {/* Header */}
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={`Mesa ${mesaData?.numero || 'N/A'}`}
        showNotification={true}
      />

      {/* Question Text */}
      <View style={styles.questionContainer}>
        <CText style={styles.questionText}>
          ¿Cuál de estas es la correcta?
        </CText>
      </View>

      {/* Image List */}
      <ScrollView style={styles.imageList} showsVerticalScrollIndicator={false}>
        {dummyImages.map(image => (
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
                onPress={handleVerMasDetalles}>
                <CText style={styles.detailsButtonText}>Ver mas detalles</CText>
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
              Estos datos no son correctos
            </CText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
  },
  questionContainer: {
    backgroundColor: '#D1ECF1', // Light blue background
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
    color: '#0C5460', // Green text color
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
    marginBottom: moderateScale(12), // Adjusted margin to accommodate the button below
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
    height: moderateScale(150),
    borderRadius: moderateScale(4),
  },
  // Styles for the corner borders
  cornerBorder: {
    position: 'absolute',
    width: moderateScale(20), // Length of the corner lines
    height: moderateScale(20), // Length of the corner lines
    borderColor: '#2F2F2F', // Black color for corner lines
    borderWidth: 2, // Thickness of the corner lines
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
  // Removed actionButtonsContainer as buttons are now rendered conditionally within the ScrollView
  detailsButton: {
    backgroundColor: '#459151', // Green button
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: moderateScale(-8), // Adjust this margin to position it correctly below the image card
    marginBottom: moderateScale(12), // Space between this button and the next image card
    marginHorizontal: moderateScale(16), // Match horizontal padding of imageCard
  },
  detailsButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  datosNoCorrectosButton: {
    backgroundColor: '#FFFFFF', // White background
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: moderateScale(16), // Margin to separate from the last details button or image card
    marginBottom: moderateScale(24), // Space before bottom nav
    marginHorizontal: moderateScale(16), // Match horizontal padding of imageCard
    borderWidth: 1, // Add border
    borderColor: '#D32F2F', // Red border color
  },
  datosNoCorrectosButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#D32F2F', // Red text color
  },
});

export default CualEsCorrectaScreen;

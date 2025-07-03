import React from 'react';
import {View, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText'; // Assuming this path is correct for your project
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import MaterialIcons
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the bell icon
import {moderateScale} from '../../../common/constants'; // Assuming this path is correct for your project

const {width: screenWidth} = Dimensions.get('window');

const PhotoConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme); // Assuming colors are managed by Redux
  const {mesaData} = route.params || {}; // Destructure mesaData from route params

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePublishAndCertify = () => {
    // Logic for publishing and certifying
    Alert.alert('Publicado', 'La acta ha sido publicada y certificada.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="keyboard-arrow-left"
            size={moderateScale(36)}
            color={colors.black || '#2F2F2F'}
          />
        </TouchableOpacity>
        <CText style={styles.headerTitle}>
          Mesa {mesaData?.numero || 'N/A'}
        </CText>
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.bellIcon}>
          <Ionicons
            name="notifications-outline"
            size={moderateScale(36)}
            color={colors.text || '#2F2F2F'}
          />
        </TouchableOpacity>
      </View>

      {/* Information Ready to Load Text */}
      <View style={styles.infoContainer}>
        <CText style={styles.infoText}>Información lista para cargar</CText>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <CText style={styles.mainText}>
          Yo Juan Perez Cuellar.... texto mas amplio
        </CText>
        <CText style={styles.subText}>Yo Juan Perez Cuellar</CText>

        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublishAndCertify}>
          <CText style={styles.publishButtonText}>Publico y Certifico</CText>
        </TouchableOpacity>

        <CText style={styles.confirmationText}>
          que es la ACTA CORRECTA de la mesa {mesaData?.numero || 'N/A'}
        </CText>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}>
          <Ionicons
            name="home-outline"
            size={moderateScale(24)}
            color={colors.primary || '#459151'}
          />
          <CText style={styles.navText}>Inicio</CText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}>
          <Ionicons
            name="person-outline"
            size={moderateScale(24)}
            color={colors.text || '#868686'}
          />
          <CText style={styles.navText}>Perfil</CText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for the entire screen
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderBottomWidth: 0, // No border at the bottom
    borderBottomColor: 'transparent',
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#2F2F2F',
    marginLeft: moderateScale(8),
  },
  headerSpacer: {
    flex: 1,
  },
  bellIcon: {
    padding: moderateScale(8),
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(12),
    marginTop: moderateScale(0),
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#868686',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32), // Increased horizontal padding for content
  },
  mainText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: moderateScale(10),
  },
  subText: {
    fontSize: moderateScale(16),
    fontWeight: 'normal',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  publishButton: {
    backgroundColor: '#4CAF50', // Green color
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  publishButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  confirmationText: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    textAlign: 'center',
    lineHeight: moderateScale(24),
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: moderateScale(10),
  },
  navItem: {
    alignItems: 'center',
    padding: moderateScale(8),
  },
  navText: {
    fontSize: moderateScale(12),
    color: '#868686',
    marginTop: moderateScale(4),
  },
});

export default PhotoConfirmationScreen;

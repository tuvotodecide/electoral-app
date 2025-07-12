import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';
import UniversalHeader from '../../../components/common/UniversalHeader';
import nftImage from '../../../assets/images/nft-medal.png';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const SuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const [showNFTCertificate, setShowNFTCertificate] = useState(false);

  const handleBack = () => {
    try {
      navigation.popToTop();
    } catch {
      navigation.navigate(StackNav.TabNavigation);
    }
  };

  const handleContinue = () => {
    try {
      navigation.popToTop();
    } catch {
      navigation.navigate(StackNav.TabNavigation);
    }
  };

  // Simulando nombre (puedes traerlo de tus datos)
  const nombre = 'Juan Pérez Cuéllar';

  return (
    <CSafeAreaView style={styles.container}>
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={String.confirmation}
        showNotification={false}
      />

      <View style={styles.mainContent}>
        {/* Título principal */}
        <CText style={styles.bigTitle}>¡Certificado NFT{'\n'}obtenido!</CText>

        {/* Botón Ver mi NFT */}
        <TouchableOpacity
          style={styles.nftButton}
          onPress={() => setShowNFTCertificate(true)}>
          <CText style={styles.nftButtonText}>Ver mi NFT</CText>
        </TouchableOpacity>

        {/* Botón de continuar (el que ya existía) */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}>
          <CText style={styles.continueButtonText}>{String.backToHome}</CText>
        </TouchableOpacity>
      </View>

      {/* Vista tipo modal del certificado NFT */}
      {showNFTCertificate && (
        <View style={styles.nftModalOverlay}>
          <View style={styles.nftCertificate}>
            {/* Borde decorativo */}
            <View style={styles.certificateBorder}>
              {/* Medallón NFT (usa un ícono o imagen, aquí placeholder) */}
              <View style={styles.medalContainer}>
                {/* Aquí puedes poner una imagen real */}
                <Image
                  source={nftImage}
                  style={styles.medalImage}
                  resizeMode="contain"
                />
                {/* Si no tienes imagen, descomenta el ícono */}
                {/* <Ionicons name="medal" size={60} color="#CBA233" /> */}
                <CText style={styles.nftMedalText}>NFT</CText>
              </View>
              {/* Datos del certificado */}
              <CText style={styles.nftName}>{nombre}</CText>
              <CText style={styles.nftCertTitle}>CERTIFICADO DE</CText>
              <CText style={styles.nftCertTitle}>PARTICIPACIÓN ELECTORAL</CText>
              <CText style={styles.nftCertDetail}>ELECCIONES GENERALES</CText>
              <CText style={styles.nftCertDetail}>BOLIVIA 2025</CText>
            </View>
            {/* Cerrar */}
            <TouchableOpacity
              onPress={() => setShowNFTCertificate(false)}
              style={styles.closeModalBtn}>
              <CText style={styles.closeModalText}>Cerrar</CText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSize(16, 24, 32),
  },
  bigTitle: {
    fontSize: getResponsiveSize(26, 32, 38),
    fontWeight: '800',
    color: '#17694A',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
    lineHeight: 38,
  },
  nftButton: {
    backgroundColor: '#17694A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 36,
    marginBottom: 22,
    width: '85%',
    alignSelf: 'center',
  },
  nftButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 22,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#a5bdb4',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginBottom: 10,
    width: '85%',
    alignSelf: 'center',
  },
  continueButtonText: {
    color: '#2a2a2a',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },

  // Certificado NFT (tipo modal)
  nftModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  nftCertificate: {
    backgroundColor: '#f8fff8',
    borderRadius: 22,
    padding: 28,
    width: '88%',
    alignItems: 'center',
    elevation: 8,
  },
  certificateBorder: {
    borderWidth: 2.5,
    borderColor: '#a5deb5',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#edffe8',
    borderStyle: 'dashed',
  },
  medalContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: 96,
    height: 96,
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: '#ffe9b8',
    borderWidth: 4,
    borderColor: '#fff7e0',
    marginTop: -38,
  },
  medalImage: {
    width: 62,
    height: 62,
    position: 'absolute',
    left: 17,
    top: 17,
  },
  nftMedalText: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 30,
    color: '#CBA233',
    letterSpacing: 3,
  },
  nftName: {
    fontWeight: '700',
    fontSize: 22,
    marginVertical: 6,
    color: '#17694A',
    textAlign: 'center',
  },
  nftCertTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#17694A',
    textAlign: 'center',
  },
  nftCertDetail: {
    fontWeight: '400',
    fontSize: 15,
    color: '#17694A',
    textAlign: 'center',
  },
  closeModalBtn: {
    marginTop: 8,
    backgroundColor: '#17694A',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeModalText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SuccessScreen;

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Linking,
  Share,
} from 'react-native';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {StackNav, TabNav} from '../../../navigation/NavigationKey';
import UniversalHeader from '../../../components/common/UniversalHeader';
import nftImage from '../../../assets/images/nft-medal.png';
import {title} from 'process';
import {url} from 'inspector';
import {getCredentialSubjectFromPayload} from '../../../utils/Cifrate';

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

  const {nftData, ipfsData} = route.params;

  const handleBack = () => {
    const parent = navigation.getParent();
    if (parent?.navigate) {
      parent.navigate(TabNav.HomeScreen, {screen: 'HomeMain'});
    } else {
      navigation.navigate('HomeMain');
    }
  };

  const handleViewNFT = async () => {
    try {
      const supported = await Linking.canOpenURL(nftData.nftUrl);
      if (supported) {
        await Linking.openURL(nftData.nftUrl);
      } else {
      }
    } catch (error) {}
  };

  const handleShareNft = async () => {
    try {
      if (!nftData || !nftData.nftUrl) {
        return;
      }
      const shareOptions = {
        title: 'Compartir certificado NFT',
        message: `¡He obtenido un certificado NFT por participar como testigo electoral! Puedes verlo aquí: ${nftData.nftUrl}`,
        url: nftData.nftUrl,
        subject: 'Certificado NFT - Elecciones Bolivia 2025',
      };

      const result = await Share.share(shareOptions, {
        dialogTitle: 'Compartir certificado NFT',
        subject: 'Certificado NFT - Elecciones Bolivia 2025',
      });

      if (result.action === Share.sharedAction) {
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {}
  };

  const handleShareActa = async () => {
    try {
      // Puedes elegir imageUrl (foto del acta) o jsonUrl (metadata completa)
      const url = ipfsData?.imageUrl || ipfsData?.jsonUrl;
      if (!url) return;
      const shareOptions = {
        title: 'Compartir acta (IPFS)',
        message: `Acta publicada en IPFS: ${url}`,
        url,
        subject: 'Acta en IPFS - Elecciones Bolivia 2025',
      };
      await Share.share(shareOptions, {
        dialogTitle: 'Compartir acta (IPFS)',
        subject: 'Acta en IPFS - Elecciones Bolivia 2025',
      });
    } catch (error) {}
  };

  // Obtener nombre real del usuario desde Redux
  const userData = useSelector(state => state.wallet.payload);
  const subject = getCredentialSubjectFromPayload(userData) || {};
  const nombre = subject?.fullName || '(sin nombre)';

  return (
    <CSafeAreaView style={styles.container}>
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        // title={String.confirmation}
        title="NFT: Elecciones Generales Bolivia 2025"
        showNotification={false}
      />

      <View style={styles.mainContent}>
        {/* Título principal */}
        <CText style={styles.bigTitle}>
          {String.nftCertificate}
          {'\n'}
          {String.obtain}
        </CText>

        {/* Certificado NFT como vista normal */}
        <View style={styles.nftCertificate}>
          <View style={styles.certificateBorder}>
            {/* Medallón NFT */}
            <View style={styles.medalContainer}>
              <Image
                source={nftImage}
                style={styles.medalImage}
                resizeMode="contain"
              />
              {/* <CText style={styles.nftMedalText}>NFT</CText> */}
            </View>
            {/* Datos del certificado */}
            <CText style={styles.nftName}>{nombre}</CText>
            <CText style={styles.nftCertTitle}>CERTIFICADO DE</CText>
            <CText style={styles.nftCertTitle}>PARTICIPACIÓN ELECTORAL</CText>
            <CText style={styles.nftCertDetail}>ELECCIONES GENERALES</CText>
            <CText style={styles.nftCertDetail}>BOLIVIA 2025</CText>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          {/* <TouchableOpacity style={styles.nftButton} onPress={handleViewNFT}>
            <CText style={styles.nftButtonText}>Ver mi NFT</CText>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.shareButton} onPress={handleShareNft}>
            <Ionicons
              name="share-outline"
              size={20}
              color="#fff"
              style={styles.shareIcon}
            />
            <CText style={styles.shareButtonText}>Compartir NFT</CText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareActa}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#fff"
              style={styles.shareIcon}
            />
            <CText style={styles.shareButtonText}>
              Compartir NFT del acta{' '}
            </CText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backHomeButton} onPress={handleBack}>
            <CText style={styles.backHomeButtonText}>Regresar al inicio</CText>
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsiveSize(16, 24, 32),
    paddingTop: getResponsiveSize(20, 30, 40),
  },
  bigTitle: {
    fontSize: getResponsiveSize(22, 26, 30),
    fontWeight: '800',
    color: '#17694A',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 25, 30),
    lineHeight: getResponsiveSize(28, 32, 36),
  },
  // Certificado NFT como vista normal
  nftCertificate: {
    backgroundColor: '#f8fff8',
    borderRadius: 18,
    padding: getResponsiveSize(20, 24, 28),
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  certificateBorder: {
    borderWidth: 2,
    borderColor: '#a5deb5',
    borderRadius: 15,
    padding: getResponsiveSize(18, 22, 26),
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#edffe8',
    borderStyle: 'dashed',
  },
  medalContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: getResponsiveSize(70, 80, 90),
    height: getResponsiveSize(70, 80, 90),
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: '#ffe9b8',
    borderWidth: 3,
    borderColor: '#fff7e0',
    marginTop: getResponsiveSize(-25, -30, -35),
  },
  medalImage: {
    width: getResponsiveSize(45, 55, 65),
    height: getResponsiveSize(45, 55, 65),
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: getResponsiveSize(-22, -27, -32),
    marginLeft: getResponsiveSize(-22, -27, -32),
  },
  nftMedalText: {
    position: 'absolute',
    bottom: getResponsiveSize(6, 8, 10),
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#CBA233',
    letterSpacing: 1,
  },
  nftName: {
    fontWeight: '700',
    fontSize: getResponsiveSize(18, 20, 22),
    marginVertical: getResponsiveSize(4, 6, 8),
    color: '#17694A',
    textAlign: 'center',
  },
  nftCertTitle: {
    fontWeight: '700',
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#17694A',
    textAlign: 'center',
    marginVertical: 1,
  },
  nftCertDetail: {
    fontWeight: '400',
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#17694A',
    textAlign: 'center',
    marginVertical: 1,
  },
  // Contenedor de botones
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: getResponsiveSize(12, 16, 20),
  },
  nftButton: {
    backgroundColor: '#17694A',
    borderRadius: 12,
    paddingVertical: getResponsiveSize(14, 16, 18),
    paddingHorizontal: getResponsiveSize(30, 36, 42),
    width: '85%',
    alignSelf: 'center',
  },
  nftButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: getResponsiveSize(16, 18, 20),
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: '#17694A',
    borderRadius: 12,
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(30, 36, 42),
    width: '85%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: getResponsiveSize(14, 16, 18),
    textAlign: 'center',
  },
  backHomeButton: {
    backgroundColor: '#a5bdb4',
    borderRadius: 12,
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(30, 36, 42),
    width: '85%',
    alignSelf: 'center',
  },
  backHomeButtonText: {
    color: '#2a2a2a',
    fontWeight: '700',
    fontSize: getResponsiveSize(14, 16, 18),
    textAlign: 'center',
  },
});

export default SuccessScreen;

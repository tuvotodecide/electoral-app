import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import InfoModal from '../../../components/modal/InfoModal';
import UniversalHeader from '../../../components/common/UniversalHeader';
import { StackNav, TabNav } from '../../../navigation/NavigationKey';
import { getCredentialSubjectFromPayload } from '../../../utils/Cifrate';
import { normalizeUri } from '../../../utils/normalizedUri';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const parseParamObject = value => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? value : {};
};

const pickFirstUrl = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

const SuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);

  const params = route?.params || {};
  const ipfsData = parseParamObject(params.ipfsData);
  const nftData = parseParamObject(params.nftData);
  const tableData = parseParamObject(params.tableData);
  const certificateData = parseParamObject(params.certificateData);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [infoModalData, setInfoModalData] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const closeInfoModal = useCallback(
    () => setInfoModalData({ visible: false, title: '', message: '' }),
    [],
  );
  console.log('route.params', route.params);
  const fromNotifications = params.fromNotifications === true;

  const ipfsUrl = pickFirstUrl(
    ipfsData.jsonUrl,
    ipfsData.ipfsUri,
    ipfsData.url,
    params.ipfsUrl,
    params.url,
  );
  const certificateUrl = pickFirstUrl(
    certificateData.imageUrl,
    certificateData.jsonUrl,
    certificateData.ipfsUri,
    certificateData.url,
    certificateData.certificateUrl,
    params.certificateUrl,
    nftData.nftUrl,
    nftData.url,
    ipfsData.imageUrl,
    ipfsData.jsonUrl,
    ipfsData.ipfsUri,
    ipfsData.url,
  );
  const normalizedCertificateUrl = normalizeUri(certificateUrl);
  const actaUrl = pickFirstUrl(
    ipfsData.imageUrl,
    ipfsData.jsonUrl,
    ipfsData.ipfsUri,
    ipfsData.url,
    params.actaUrl,
    params.imageUrl,
    tableData.imageUrl,
    tableData.image,
    ipfsUrl,
  );

  const normalizedActaUrl = normalizeUri(actaUrl);

  useEffect(() => {
    if (!__DEV__) return;
    try {
      console.log('[SUCCESS] route.params', JSON.stringify(params, null, 2));
    } catch {
      console.log('[SUCCESS] route.params (raw)', params);
    }
    console.log('[SUCCESS] resolved urls', {
      certificateUrl,
      normalizedCertificateUrl,
      actaUrl,
      normalizedActaUrl,
    });
  }, []);

  const navigateHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: { screen: TabNav.HomeScreen },
        },
      ],
    });
    return true;
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (fromNotifications) {
      navigation.goBack();
    } else {
      navigateHome();
    }
  }, [fromNotifications, navigateHome, navigation]);
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (fromNotifications) {
          navigation.goBack();
        } else {
          navigateHome();
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [fromNotifications, navigateHome, navigation]),
  );

  const handleViewNFT = async () => {
    try {
      const supported = await Linking.canOpenURL(nftData.nftUrl);
      if (supported) {
        await Linking.openURL(nftData.nftUrl);
      } else {
      }
    } catch (error) {
      console.error('[SUCCESS] open nft url error', error);
      setInfoModalData({
        visible: true,
        title: 'Error',
        message: 'No se pudo abrir el menú de compartir.',
      });
    }
  };

  const handleShareNft = async () => {
    try {
      if (!normalizedCertificateUrl) {
        setInfoModalData({
          visible: true,
          title: 'No disponible',
          message: 'No encontramos el enlace del NFT para compartir.',
        });
        return;
      }
      const shareOptions = {
        title: 'Compartir mi certificado',
        message: `He obtenido un certificado NFT por participar como testigo electoral. Puedes verlo aqui: ${normalizedCertificateUrl}`,
        url: normalizedCertificateUrl,
        subject: 'Certificado NFT ',
      };

      const result = await Share.share(shareOptions, {
        dialogTitle: 'Compartir mi certificado',
        subject: 'Certificado NFT',
      });

      if (result.action === Share.sharedAction) {
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {
      console.error('[SUCCESS] share nft error', error);
      setInfoModalData({
        visible: true,
        title: 'Error',
        message: 'No se pudo abrir el menú de compartir.',
      });
    }
  };

  const handleShareActa = async () => {
    try {
      if (!normalizedActaUrl) {
        setInfoModalData({
          visible: true,
          title: 'No disponible',
          message: 'No encontramos el enlace del acta para compartir.',
        });
        return;
      }
      const shareOptions = {
        title: 'Compartir acta (resultados)',
        message: `Acta publicada en IPFS: ${normalizedActaUrl}`,
        url: normalizedActaUrl,
        subject: 'Acta en IPFS',
      };
      await Share.share(shareOptions, {
        dialogTitle: 'Compartir acta (resultados)',
        subject: 'Acta en IPFS',
      });
    } catch (error) {
      console.error('[SUCCESS] share acta error', error);
      setInfoModalData({
        visible: true,
        title: 'Error',
        message: 'No se pudo abrir el menú de compartir.',
      });
    }
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
        title="NFT"
        showNotification={false}
      />

      <ScrollView contentContainerStyle={styles.mainContent} bounces={false}>
        {/* Título principal */}
        {normalizedCertificateUrl && (
          <View style={styles.certificateImageWrapper}>
            {imageLoading && !imageError && (
              <View style={styles.imageLoaderOverlay}>
                <ActivityIndicator size="large" color="#17694A" />
              </View>
            )}
            <Image
              source={{ uri: normalizedCertificateUrl }}
              style={styles.certificateImage}
              resizeMode="contain"
              onLoadStart={() => {
                setImageLoading(true);
                setImageError(false);
              }}
              onLoad={() => {
                setImageLoading(false);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </View>
        )}
        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          {/* <TouchableOpacity style={styles.nftButton} onPress={handleViewNFT}>
            <CText style={styles.nftButtonText}>Ver mi NFT</CText>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.sharePrimaryButton}
            onPress={handleShareNft}>
            <Ionicons
              name="share-outline"
              size={20}
              color="#fff"
              style={styles.shareIcon}
            />
            <CText style={styles.sharePrimaryButtonText}>
              Compartir mi certificado
            </CText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareSecondaryButton}
            onPress={handleShareActa}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#17694A"
              style={styles.shareIcon}
            />
            <CText style={styles.shareSecondaryButtonText}>
              Compartir acta (resultados)
            </CText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backHomeButton} onPress={handleBack}>
            <CText style={styles.backHomeButtonText}>Regresar al inicio</CText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <InfoModal
        visible={infoModalData.visible}
        title={infoModalData.title}
        message={infoModalData.message}
        onClose={closeInfoModal}
      />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  certificateImageWrapper: {
    width: '100%',
    maxWidth: isTablet ? 500 : 380,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveSize(24, 28, 32),
  },
  certificateImage: {
    width: '100%',
    height: '100%',
  },
  imageLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },

  mainContent: {
    flexGrow: 1,
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
    shadowOffset: { width: 0, height: 2 },
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
  sharePrimaryButton: {
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
    borderColor: '#17694A',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  shareIcon: {
    marginRight: 8,
  },
  sharePrimaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: getResponsiveSize(14, 16, 18),
    textAlign: 'center',
  },
  shareSecondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(30, 36, 42),
    width: '85%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#17694A',
  },
  shareSecondaryButtonText: {
    color: '#17694A',
    fontWeight: '700',
    fontSize: getResponsiveSize(14, 16, 18),
    textAlign: 'center',
  },
  backHomeButton: {
    backgroundColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(30, 36, 42),
    width: '85%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#B8BEC8',
  },
  backHomeButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: getResponsiveSize(14, 16, 18),
    textAlign: 'center',
  },
});

export default SuccessScreen;

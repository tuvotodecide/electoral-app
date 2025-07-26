import {
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Linking,
  ScrollView,
  FlatList,
  Image,
  ImageBackground,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../../../redux/slices/authSlice';
import { clearWallet } from '../../../redux/action/walletAction';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import { AuthNav, StackNav } from '../../../navigation/NavigationKey';
import { useSelector } from 'react-redux';
import { store } from '../../../redux/store';
import { clearSession } from '../../../utils/Session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JWT_KEY } from '../../../common/constants';
import axios from 'axios';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

// Responsive grid calculations
const getCardLayout = () => {
  if (isTablet) {
    const CARD_MARGIN = getResponsiveSize(12, 16, 20);
    let CARDS_PER_ROW;
    if (isLandscape) {
      CARDS_PER_ROW = screenWidth > 1000 ? 4 : 3;
    } else {
      CARDS_PER_ROW = 2;
    }
    const CARD_WIDTH =
      (screenWidth - (CARDS_PER_ROW + 1) * CARD_MARGIN) / CARDS_PER_ROW;
    return { CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW };
  } else {
    const CARD_MARGIN = getResponsiveSize(8, 10, 12);
    const CARDS_PER_ROW = 2;
    const CARD_WIDTH = (screenWidth - 3 * CARD_MARGIN) / CARDS_PER_ROW;
    return { CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW };
  }
};

const { CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW } = getCardLayout();

// Carousel Item Component
const CarouselItem = ({ item }) => (
  <View style={stylesx.carouselItem}>
    <View style={stylesx.carouselContent}>
      <View style={stylesx.carouselMainContent}>
        {/* Imagen específica para cada elemento del carrusel */}
        <Image 
          source={item.image}
          style={stylesx.bcLogoImage}
          resizeMode="contain"
        />
        
        <View style={stylesx.carouselTextContainer}>
          <CText style={stylesx.carouselTitle}>{item.title}</CText>
          <CText style={stylesx.carouselSubtitle}>{item.subtitle}</CText>
        </View>
      </View>
      
      {/* Botón en la esquina inferior derecha */}
      <TouchableOpacity
        style={stylesx.carouselButton}
        onPress={item.onPress}
        activeOpacity={0.8}>
        <CText style={stylesx.carouselButtonText}>{item.buttonText}</CText>
      </TouchableOpacity>
    </View>
  </View>
);

const MiVotoLogo = () => (
  <View style={stylesx.logoRow}>
    {/* Bandera */}
    <View style={stylesx.flagBox}>
      <View
        style={[stylesx.flagStripe, { backgroundColor: '#E72F2F', top: 0 }]}
      />
      <View
        style={[
          stylesx.flagStripe,
          { backgroundColor: '#FFD800', top: getResponsiveSize(6, 7, 8) },
        ]}
      />
      <View
        style={[
          stylesx.flagStripe,
          { backgroundColor: '#4FC144', top: getResponsiveSize(12, 14, 16) },
        ]}
      />
      <View style={stylesx.flagCheckOutline} />
    </View>
    <View style={{ marginLeft: getResponsiveSize(6, 8, 10) }}>
      <CText style={stylesx.logoTitle}>Mi Voto</CText>
      <CText style={stylesx.logoSubtitle}>Control ciudadano del voto</CText>
    </View>
  </View>
);

// === Banner Blockchain Consultora ===
const BlockchainConsultoraBanner = () => (
  <View style={stylesx.bannerBC}>
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <View style={{ marginLeft: 10, flex: 1 }}>
        <CText style={stylesx.bannerTitle}>{String.needBlockchainApp}</CText>
        <CText style={stylesx.bannerSubtitle}>
          {String.blockchainConsultBanner}
        </CText>
      </View>
    </View>
    <TouchableOpacity
      onPress={() => Linking.openURL('https://blockchainconsultora.com/es')}
      style={stylesx.bannerButton}
      activeOpacity={0.8}>
      <CText style={stylesx.bannerButtonText}>{String.learnMore}</CText>
    </TouchableOpacity>
  </View>
);

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const wallet = useSelector(s => s.wallet.payload);
  const account = useSelector(state => state.account);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef(null);

  // Datos del carrusel
  const carouselData = [
    {
      id: 1,
      title: '¿Necesita un app blockchain?',
      subtitle: 'Blockchain Consultora desarrollo esta aplicación, contáctelos',
      buttonText: 'Más Info',
      backgroundColor: '#e8f5e8',
      image: require('../../../assets/images/block-con.png'),
      onPress: () => Linking.openURL('https://blockchainconsultora.com/es'),
    },
    {
      id: 2,
      title: 'Asoblockchain',
      subtitle: 'Impulsamos el Futuro con Blockchain',
      buttonText: 'Conocer más',
      backgroundColor: '#e8f0ff',
      image: require('../../../assets/images/block-aso.png'),
      onPress: () => Linking.openURL('https://asoblockchainbolivia.org/'),
    },
    // {
    //   id: 3,
    //   title: 'Transparencia y confianza',
    //   subtitle: 'Tecnología blockchain para procesos electorales seguros',
    //   buttonText: 'Descubrir',
    //   backgroundColor: '#fff5e8',
    //   image: require('../../../assets/images/block-con.png'),
    //   onPress: () => console.log('Blockchain info pressed'),
    // },
    // {
    //   id: 4,
    //   title: 'Seguridad garantizada',
    //   subtitle: 'Protegemos la integridad de cada voto con tecnología avanzada',
    //   buttonText: 'Ver más',
    //   backgroundColor: '#f0f8ff',
    //   image: require('../../../assets/images/block-con.png'),
    //   onPress: () => console.log('Security info pressed'),
    // },
  ];

  // Auto-scroll del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const nextIndex = (currentCarouselIndex + 1) % carouselData.length;
        carouselRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentCarouselIndex(nextIndex);
      }
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [currentCarouselIndex, carouselData.length]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(JWT_KEY);
      delete axios.defaults.headers.common['Authorization'];
      await clearSession();
      dispatch(clearWallet());
      dispatch(clearAuth());

      navigation.reset({
        index: 0,
        routes: [{ name: StackNav.AuthNavigation }],
      });
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const userData = useSelector(state => state.wallet.payload);
  const vc = userData?.vc;
  const subject = vc?.credentialSubject || {};
  const data = {
    name: subject.fullName || '(sin nombre)',
    hash: userData?.account?.slice(0, 10) + '…' || '(sin hash)',
  };
  const userFullName = data.name || '(sin nombre)';

  const onPressNotification = () => navigation.navigate(StackNav.Notification);
  const onPressLogout = () => setLogoutModalVisible(true);

  const menuItems = [
    {
      icon: 'people-outline',
      title: String.participate,
      description: String.participateDescription,
      onPress: () =>
        navigation.navigate(StackNav.ElectoralLocations, {
          targetScreen: 'UnifiedParticipation',
        }),
      iconComponent: Ionicons,
    },
    {
      icon: 'megaphone-outline',
      title: String.announceCount,
      description: String.announceCountDescription,
      onPress: () =>
        navigation.navigate(StackNav.ElectoralLocations, {
          targetScreen: 'AnnounceCount',
        }),
      iconComponent: Ionicons,
    },
    {
      icon: 'bar-chart-outline',
      title: String.myWitnesses,
      description: String.myWitnessesDescription,
      onPress: () => navigation.navigate(StackNav.MyWitnessesListScreen),
      iconComponent: Ionicons,
    },
  ];

  return (
    <CSafeAreaView style={stylesx.bg}>
      {/* Modal de cerrar sesión */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 28,
              alignItems: 'center',
              width: '80%',
            }}>
            <CText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              {String.areYouSureWantToLogout ||
                '¿Seguro que quieres cerrar sesión?'}
            </CText>
            <View style={{ flexDirection: 'row', marginTop: 18, gap: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#f5f5f5',
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={() => setLogoutModalVisible(false)}>
                <CText style={{ color: '#222', fontWeight: '600' }}>
                  {String.cancel || 'Cancelar'}
                </CText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#E72F2F',
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 8,
                }}
                onPress={handleLogout}>
                <CText style={{ color: '#fff', fontWeight: '600' }}>
                  {String.logOut || 'Cerrar sesión'}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tablet Landscape Layout */}
      {isTablet && isLandscape ? (
        <View style={stylesx.tabletLandscapeContainer}>
          {/* Left Column: Header and Welcome */}
          <View style={stylesx.tabletLeftColumn}>
            <View style={stylesx.headerRow}>
              <MiVotoLogo />
              <View style={stylesx.headerIcons}>
                <TouchableOpacity onPress={onPressNotification}>
                  <Ionicons
                    name={'notifications-outline'}
                    size={getResponsiveSize(24, 28, 32)}
                    color={'#222'}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={onPressLogout}>
                  <Ionicons
                    name="log-out-outline"
                    size={getResponsiveSize(24, 28, 32)}
                    color="#E72F2F"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={stylesx.welcomeContainer}>
              <View style={stylesx.welcomeHeader}>
                <View style={stylesx.welcomeTextContainer}>
                  <CText style={stylesx.bienvenido}>{String.homeWelcome}</CText>
                  <CText style={stylesx.nombre}>{userFullName}!</CText>
                </View>
              </View>
            </View>

            {/* Carrusel deslizable */}
            <View style={stylesx.carouselContainer}>
              <FlatList
                ref={carouselRef}
                data={carouselData}
                renderItem={({ item }) => <CarouselItem item={item} />}
                keyExtractor={item => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={event => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / screenWidth,
                  );
                  setCurrentCarouselIndex(index);
                }}
              />
              <View style={stylesx.pageIndicators}>
                {carouselData.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      stylesx.pageIndicator,
                      index === currentCarouselIndex &&
                      stylesx.activePageIndicator,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Right Column: Menu Cards */}
          <View style={stylesx.tabletRightColumn}>
            {/* --- AQUÍ CAMBIA EL GRID DE BOTONES --- */}
            <View style={stylesx.gridParent}>
              {/* Participar (arriba, ocupa dos columnas) */}
              <TouchableOpacity
                style={[stylesx.gridDiv1, stylesx.card]}
                activeOpacity={0.87}
                onPress={menuItems[0].onPress}>
                {React.createElement(menuItems[0].iconComponent, {
                  name: menuItems[0].icon,
                  size: getResponsiveSize(30, 36, 42),
                  color: "#41A44D",
                  style: { marginBottom: getResponsiveSize(6, 8, 10) }
                })}
                
                <CText style={stylesx.cardTitle}>{menuItems[0].title}</CText>
                <CText style={stylesx.cardDescription}>
                  {menuItems[0].description}
                </CText>
              </TouchableOpacity>

              <View style={stylesx.gridRow2}>
                {/* Anunciar conteo */}
                <TouchableOpacity
                  style={[stylesx.gridDiv2, stylesx.card]}
                  activeOpacity={0.87}
                  onPress={menuItems[1].onPress}>
                  {React.createElement(menuItems[1].iconComponent, {
                    name: menuItems[1].icon,
                    size: getResponsiveSize(30, 36, 42),
                    color: "#41A44D",
                    style: { marginBottom: getResponsiveSize(6, 8, 10) }
                  })}
                  <CText style={stylesx.cardTitle}>{menuItems[1].title}</CText>
                  <CText style={stylesx.cardDescription}>
                    {menuItems[1].description}
                  </CText>
                </TouchableOpacity>
                {/* Mis atestiguamientos */}
                <TouchableOpacity
                  style={[stylesx.gridDiv3, stylesx.card]}
                  activeOpacity={0.87}
                  onPress={menuItems[2].onPress}>
                  {React.createElement(menuItems[2].iconComponent, {
                    name: menuItems[2].icon,
                    size: getResponsiveSize(30, 36, 42),
                    color: "#41A44D",
                    style: { marginBottom: getResponsiveSize(6, 8, 10) }
                  })}
                  <CText style={stylesx.cardTitle}>{menuItems[2].title}</CText>
                  <CText style={stylesx.cardDescription}>
                    {menuItems[2].description}
                  </CText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* Regular Layout: Phones and Tablet Portrait */
        <View style={stylesx.regularContainer}>
          <View style={stylesx.headerRow}>
            <MiVotoLogo />
            <View style={stylesx.headerIcons}>
              <TouchableOpacity onPress={onPressNotification}>
                <Ionicons
                  name={'notifications-outline'}
                  size={getResponsiveSize(24, 28, 32)}
                  color={'#222'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onPressLogout}>
                <Ionicons
                  name="log-out-outline"
                  size={getResponsiveSize(24, 28, 32)}
                  color="#E72F2F"
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* ===== Bienvenida ===== */}
          <View style={stylesx.welcomeContainer}>
            <View style={stylesx.welcomeHeader}>
              <View style={stylesx.welcomeTextContainer}>
                <CText style={stylesx.bienvenido}>{String.homeWelcome}</CText>
                <CText style={stylesx.nombre}>{userFullName}!</CText>
              </View>
            </View>
          </View>
          {/* Carrusel deslizable */}
          <View style={stylesx.carouselContainer}>
            <FlatList
              ref={carouselRef}
              data={carouselData}
              renderItem={({ item }) => <CarouselItem item={item} />}
              keyExtractor={item => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={event => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / screenWidth,
                );
                setCurrentCarouselIndex(index);
              }}
            />
            <View style={stylesx.pageIndicators}>
              {carouselData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    stylesx.pageIndicator,
                    index === currentCarouselIndex &&
                    stylesx.activePageIndicator,
                  ]}
                />
              ))}
            </View>
          </View>
          {/* --- AQUÍ CAMBIA EL GRID DE BOTONES --- */}
          <View style={stylesx.gridParent}>
            {/* Participar (arriba, ocupa dos columnas) */}
            <TouchableOpacity
              style={[stylesx.gridDiv1, stylesx.card]}
              activeOpacity={0.87}
              onPress={menuItems[0].onPress}>
              {React.createElement(menuItems[0].iconComponent, {
                name: menuItems[0].icon,
                size: getResponsiveSize(30, 36, 42),
                color: "#41A44D",
                style: { marginBottom: getResponsiveSize(6, 8, 10) }
              })}
              <CText style={stylesx.cardTitle}>{menuItems[0].title}</CText>
              <CText style={stylesx.cardDescription}>
                {menuItems[0].description}
              </CText>
            </TouchableOpacity>
            <View style={stylesx.gridRow2}>
              {/* Anunciar conteo */}
              <TouchableOpacity
                style={[stylesx.gridDiv2, stylesx.card]}
                activeOpacity={0.87}
                onPress={menuItems[1].onPress}>
                {React.createElement(menuItems[1].iconComponent, {
                  name: menuItems[1].icon,
                  size: getResponsiveSize(30, 36, 42),
                  color: "#41A44D",
                  style: { marginBottom: getResponsiveSize(6, 8, 10) }
                })}
                <CText style={stylesx.cardTitle}>{menuItems[1].title}</CText>
                <CText style={stylesx.cardDescription}>
                  {menuItems[1].description}
                </CText>
              </TouchableOpacity>
              {/* Mis atestiguamientos */}
              <TouchableOpacity
                style={[stylesx.gridDiv3, stylesx.card]}
                activeOpacity={0.87}
                onPress={menuItems[2].onPress}>
                {React.createElement(menuItems[2].iconComponent, {
                  name: menuItems[2].icon,
                  size: getResponsiveSize(30, 36, 42),
                  color: "#41A44D",
                  style: { marginBottom: getResponsiveSize(6, 8, 10) }
                })}
                <CText style={stylesx.cardTitle}>{menuItems[2].title}</CText>
                <CText style={stylesx.cardDescription}>
                  {menuItems[2].description}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </CSafeAreaView>
  );
}


const stylesx = StyleSheet.create({
  gridParent: {
    width: '100%',
    marginTop: getResponsiveSize(10, 13, 16),
    paddingRight: getResponsiveSize(16, 20, 24),
    paddingLeft: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(10, 13, 16),
  },
  gridDiv1: {
    flexDirection: 'column',
    width: '100%',
    marginBottom: getResponsiveSize(10, 13, 16),
  },
  gridRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridDiv2: {
    flex: 1,
    marginRight: getResponsiveSize(6, 10, 14),
  },
  gridDiv3: {
    flex: 1,
    // No marginRight aquí, así queda a la derecha
  },
  bg: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 0,
  },
  // Tablet Landscape Layout Styles
  tabletLandscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletLeftColumn: {
    flex: 0.4,
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  tabletRightColumn: {
    flex: 0.6,
    paddingLeft: getResponsiveSize(8, 12, 16),
  },
  regularContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(12, 16, 20),
    paddingBottom: getResponsiveSize(2, 4, 6),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagBox: {
    width: getResponsiveSize(32, 38, 44),
    height: getResponsiveSize(32, 38, 44),
    marginRight: getResponsiveSize(1, 2, 3),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  flagStripe: {
    position: 'absolute',
    left: getResponsiveSize(9, 11, 13),
    width: getResponsiveSize(16, 19, 22),
    height: getResponsiveSize(4, 5.3, 6),
    borderRadius: 2,
    zIndex: 2,
  },
  flagCheckOutline: {
    position: 'absolute',
    left: getResponsiveSize(1, 2, 3),
    top: getResponsiveSize(4, 5, 6),
    width: getResponsiveSize(24, 28, 32),
    height: getResponsiveSize(24, 28, 32),
    borderWidth: getResponsiveSize(2.8, 3.3, 3.8),
    borderColor: '#292D32',
    borderRadius: getResponsiveSize(5, 6, 7),
    zIndex: 1,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: getResponsiveSize(7, 8, 9),
  },
  logoTitle: {
    fontSize: getResponsiveSize(22, 26, 30),
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: -1,
  },
  logoSubtitle: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#8B9399',
    fontWeight: '400',
    marginTop: -2,
    marginLeft: 2,
  },
  welcomeContainer: {
    marginTop: getResponsiveSize(10, 13, 16),
    marginLeft: getResponsiveSize(18, 21, 24),
    marginBottom: getResponsiveSize(12, 16, 20),
    ...(isTablet &&
      isLandscape && {
      marginTop: getResponsiveSize(40, 50, 60),
      marginBottom: getResponsiveSize(20, 25, 30),
    }),
  },
  bienvenido: {
    fontSize: getResponsiveSize(18, 22, 26),
    color: '#41A44D',
    fontWeight: '700',
    marginBottom: -2,
    letterSpacing: -0.5,
    ...(isTablet &&
      isLandscape && {
      fontSize: getResponsiveSize(24, 28, 32),
    }),
  },
  nombre: {
    fontSize: getResponsiveSize(18, 22, 26),
    color: '#232323',
    fontWeight: '700',
    marginBottom: 0,
    letterSpacing: -0.5,
    ...(isTablet &&
      isLandscape && {
      fontSize: getResponsiveSize(24, 28, 32),
    }),
  },
  // Banner Blockchain Consultora
  bannerBC: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: getResponsiveSize(12, 20, 24),
    marginBottom: getResponsiveSize(16, 18, 22),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bcLogoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#41A44D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  bcLogoImage: {
    width: getResponsiveSize(40, 45, 50),
    height: getResponsiveSize(40, 45, 50),
    marginRight: getResponsiveSize(12, 16, 20),
  },
  bcLogoText: {
    color: '#41A44D',
    fontWeight: 'bold',
    fontSize: 24,
    letterSpacing: -1,
    fontFamily: undefined,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#232323',
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#232323',
    marginTop: 2,
    opacity: 0.87,
  },
  bannerButton: {
    backgroundColor: '#4CA950',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 18,
    marginLeft: 14,
    alignSelf: 'center',
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      CARDS_PER_ROW === 4
        ? 'space-around'
        : isTablet
          ? 'flex-start'
          : 'space-between',
    paddingHorizontal: getResponsiveSize(8, 12, 16),
    marginTop: getResponsiveSize(6, 10, 14),
    ...(isTablet && {
      gap:
        CARDS_PER_ROW === 4
          ? getResponsiveSize(8, 12, 16)
          : getResponsiveSize(12, 16, 20),
    }),
    ...(isTablet &&
      isLandscape && {
      marginTop: getResponsiveSize(20, 25, 30),
      paddingHorizontal: getResponsiveSize(12, 16, 20),
    }),
  },
  card: {
    minHeight: getResponsiveSize(100, 116, 140),
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(14, 17, 20),
    borderWidth: getResponsiveSize(1.1, 1.3, 1.5),
    borderColor: '#E0E0E0',
    alignItems: 'flex-start',
    padding: getResponsiveSize(14, 18, 22),
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    ...(isTablet &&
      CARDS_PER_ROW === 2 && {
      marginRight: getResponsiveSize(8, 12, 16),
    }),
  },
  cardTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#232323',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  cardDescription: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#282828',
    fontWeight: '400',
    marginTop: 1,
    marginBottom: -3,
    opacity: 0.78,
  },
  // Gas Indicator Styles
  gasContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: getResponsiveSize(10, 12, 14),
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    minWidth: getResponsiveSize(80, 90, 100),
  },
  gasLabel: {
    fontSize: getResponsiveSize(10, 11, 12),
    color: '#6c757d',
    fontWeight: '500',
  },
  gasPrice: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#4CAF50',
    fontWeight: '700',
  },
  // Welcome Section Styles
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: getResponsiveSize(20, 24, 28),
  },
  // Header Styles
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8, 12, 16),
  },
  // Carousel Styles
  carouselContainer: {
    marginVertical: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(50, 24, 28),
  },
  carouselItem: {
    width: screenWidth - getResponsiveSize(32, 40, 48),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    borderRadius: getResponsiveSize(12, 16, 20),
    minHeight: getResponsiveSize(130, 160, 170),
    backgroundColor: '#E8F5E9', // Fondo verde claro como en la imagen
    padding: getResponsiveSize(16, 20, 24),
    position: 'relative', // Para permitir posicionamiento absoluto del botón
  },
  carouselContent: {
    flex: 1,
  },
  carouselMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  carouselTextContainer: {
    flex: 1,
    marginLeft: getResponsiveSize(12, 16, 20),
    marginRight: getResponsiveSize(8, 12, 16),
  },
  carouselArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveSize(28, 32, 36),
    height: getResponsiveSize(28, 32, 36),
  },
  carouselContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  carouselTextContainer: {
    flex: 1,
  },
  carouselTitle: {
    fontSize: getResponsiveSize(16, 18, 22),
    fontWeight: '700',
    color: '#232323', // Texto oscuro como en la imagen
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  carouselSubtitle: {
    fontSize: getResponsiveSize(13, 14, 16),
    color: '#232323', // Texto oscuro como en la imagen
    lineHeight: getResponsiveSize(18, 20, 22),
    marginBottom: getResponsiveSize(8, 12, 16),
    opacity: 0.87,
  },
  carouselButton: {
    backgroundColor: '#4CA950', // Verde como en la imagen
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    position: 'absolute',
    bottom: getResponsiveSize(16, 20, 24),
    right: getResponsiveSize(16, 20, 24),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  carouselButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '700',
    color: '#fff',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSize(12, 16, 20),
    gap: getResponsiveSize(6, 8, 10),
  },
  pageIndicator: {
    width: getResponsiveSize(6, 8, 10),
    height: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(3, 4, 5),
    backgroundColor: '#d1d5db',
  },
  activePageIndicator: {
    backgroundColor: '#4CAF50',
    width: getResponsiveSize(16, 20, 24),
  },
});

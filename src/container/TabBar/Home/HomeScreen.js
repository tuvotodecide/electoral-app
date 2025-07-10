import {
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
} from 'react-native';
import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {clearAuth} from '../../../redux/slices/authSlice';
import {clearWallet} from '../../../redux/action/walletAction';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {StackNav} from '../../../navigation/NavigationKey';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

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
    // Tablets: Different layouts for landscape vs portrait
    const CARD_MARGIN = getResponsiveSize(12, 16, 20);
    let CARDS_PER_ROW;

    if (isLandscape) {
      // Landscape: 4 cards per row for large tablets, 3 for medium tablets
      CARDS_PER_ROW = screenWidth > 1000 ? 4 : 3;
    } else {
      // Portrait: 2 cards per row
      CARDS_PER_ROW = 2;
    }

    const CARD_WIDTH =
      (screenWidth - (CARDS_PER_ROW + 1) * CARD_MARGIN) / CARDS_PER_ROW;
    return {CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW};
  } else {
    // Phones: 2 cards per row
    const CARD_MARGIN = getResponsiveSize(8, 10, 12);
    const CARDS_PER_ROW = 2;
    const CARD_WIDTH = (screenWidth - 3 * CARD_MARGIN) / CARDS_PER_ROW;
    return {CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW};
  }
};

const {CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW} = getCardLayout();

const MiVotoLogo = () => (
  <View style={stylesx.logoRow}>
    {/* Bandera */}
    <View style={stylesx.flagBox}>
      <View
        style={[stylesx.flagStripe, {backgroundColor: '#E72F2F', top: 0}]}
      />
      <View
        style={[
          stylesx.flagStripe,
          {backgroundColor: '#FFD800', top: getResponsiveSize(6, 7, 8)},
        ]}
      />
      <View
        style={[
          stylesx.flagStripe,
          {backgroundColor: '#4FC144', top: getResponsiveSize(12, 14, 16)},
        ]}
      />
      <View style={stylesx.flagCheckOutline} />
    </View>
    <View style={{marginLeft: getResponsiveSize(6, 8, 10)}}>
      <CText style={stylesx.logoTitle}>Tu voto decide</CText>
      <CText style={stylesx.logoSubtitle}>Control ciudadano del voto</CText>
    </View>
  </View>
);

export default function HomeScreen({navigation}) {
  const dispatch = useDispatch();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const handleLogout = () => {
    setLogoutModalVisible(false);
    dispatch(clearAuth());
    dispatch(clearWallet());
    navigation.replace('Login'); // Cambia esto por la ruta de tu login si es diferente
  };
  const userData = useSelector(state => state.wallet.payload);
  const vc = userData?.vc;

  const subject = vc?.credentialSubject || {};
  const data = {
    name: subject.fullName || '(sin nombre)',
    hash: userData?.account?.slice(0, 10) + '…' || '(sin hash)',
  };
  const userFullName = data.name || '(sin nombre)';

  // const userFullName = 'Usuario';

  const onPressNotification = () => navigation.navigate(StackNav.Notification);
  const onPressLogout = () => setLogoutModalVisible(true);

  const menuItems = [
    {
      icon: 'camera-outline',
      title: String.uploadActa,
      description: String.uploadActaDescription,
      onPress: () => navigation.navigate(StackNav.SearchTable),
      iconComponent: Ionicons,
    },
    {
      icon: 'eye-outline',
      title: String.witnessActa,
      description: String.witnessActaDescription,
      onPress: () => navigation.navigate(StackNav.WitnessRecord),
      iconComponent: Ionicons,
    },
    {
      icon: 'megaphone-outline',
      title: String.announceCount,
      description: String.announceCountDescription,
      onPress: () => navigation.navigate(StackNav.AnnounceCount),
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
            <CText style={{fontSize: 18, fontWeight: 'bold', marginBottom: 12}}>
              {String.areYouSureWantToLogout ||
                '¿Seguro que quieres cerrar sesión?'}
            </CText>
            <View style={{flexDirection: 'row', marginTop: 18, gap: 16}}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#f5f5f5',
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={() => setLogoutModalVisible(false)}>
                <CText style={{color: '#222', fontWeight: '600'}}>
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
                <CText style={{color: '#fff', fontWeight: '600'}}>
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
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                <TouchableOpacity onPress={onPressNotification}>
                  <Ionicons
                    name={'notifications-outline'}
                    size={getResponsiveSize(24, 28, 32)}
                    color={'#222'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onPressLogout}
                  style={{marginLeft: 8}}>
                  <Ionicons
                    name="log-out-outline"
                    size={getResponsiveSize(24, 28, 32)}
                    color="#E72F2F"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={stylesx.welcomeContainer}>
              <CText style={stylesx.bienvenido}>{String.homeWelcome}</CText>
              <CText style={stylesx.nombre}>{userFullName}!</CText>
            </View>
          </View>

          {/* Right Column: Menu Cards */}
          <View style={stylesx.tabletRightColumn}>
            <View style={stylesx.gridContainer}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.title}
                  style={[
                    stylesx.card,
                    {
                      width: CARD_WIDTH,
                      marginBottom: getResponsiveSize(10, 15, 20),
                    },
                  ]}
                  activeOpacity={0.87}
                  onPress={item.onPress}>
                  <item.iconComponent
                    name={item.icon}
                    size={getResponsiveSize(30, 36, 42)}
                    color="#41A44D"
                    style={{marginBottom: getResponsiveSize(6, 8, 10)}}
                  />
                  <CText style={stylesx.cardTitle}>{item.title}</CText>
                  <CText style={stylesx.cardDescription}>
                    {item.description}
                  </CText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        /* Regular Layout: Phones and Tablet Portrait */
        <View style={stylesx.regularContainer}>
          <View style={stylesx.headerRow}>
            <MiVotoLogo />
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <TouchableOpacity onPress={onPressNotification}>
                <Ionicons
                  name={'notifications-outline'}
                  size={getResponsiveSize(24, 28, 32)}
                  color={'#222'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onPressLogout} style={{marginLeft: 8}}>
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
            <CText style={stylesx.bienvenido}>{String.homeWelcome}</CText>
            <CText style={stylesx.nombre}>{userFullName}!</CText>
          </View>

          {/* ===== Cards de Menú ===== */}
          <View style={stylesx.gridContainer}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  stylesx.card,
                  {
                    width: CARD_WIDTH,
                    marginBottom: getResponsiveSize(10, 15, 20),
                  },
                ]}
                activeOpacity={0.87}
                onPress={item.onPress}>
                <item.iconComponent
                  name={item.icon}
                  size={getResponsiveSize(30, 36, 42)}
                  color="#41A44D"
                  style={{marginBottom: getResponsiveSize(6, 8, 10)}}
                />
                <CText style={stylesx.cardTitle}>{item.title}</CText>
                <CText style={stylesx.cardDescription}>
                  {item.description}
                </CText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </CSafeAreaView>
  );
}

const stylesx = StyleSheet.create({
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
    flex: 0.4, // 40% width for header and welcome
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  tabletRightColumn: {
    flex: 0.6, // 60% width for menu cards
    paddingLeft: getResponsiveSize(8, 12, 16),
  },
  // Regular Layout Container
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
        // In tablet landscape, center vertically and give more space
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
        // Larger text in landscape
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
        // Larger text in landscape
        fontSize: getResponsiveSize(24, 28, 32),
      }),
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
      // For tablets, add gap between cards
      gap:
        CARDS_PER_ROW === 4
          ? getResponsiveSize(8, 12, 16)
          : getResponsiveSize(12, 16, 20),
    }),
    ...(isTablet &&
      isLandscape && {
        // In landscape, start from top and use all available space
        marginTop: getResponsiveSize(20, 25, 30),
        paddingHorizontal: getResponsiveSize(12, 16, 20),
      }),
  },
  card: {
    // Width is set dynamically in the component
    minHeight: getResponsiveSize(100, 116, 140),
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(14, 17, 20),
    borderWidth: getResponsiveSize(1.1, 1.3, 1.5),
    borderColor: '#E0E0E0',
    alignItems: 'flex-start',
    padding: getResponsiveSize(14, 18, 22),
    elevation: 0,
    shadowOpacity: 0,
    ...(isTablet &&
      CARDS_PER_ROW === 2 && {
        // For 2-column tablet layout, add margin
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
  bannerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 0,
    marginBottom: 0,
  },
  bannerImage: {
    width: '100%',
    height: getResponsiveSize(70, 80, 90),
    borderRadius: getResponsiveSize(10, 12, 14),
    marginTop: getResponsiveSize(8, 10, 12),
  },
});

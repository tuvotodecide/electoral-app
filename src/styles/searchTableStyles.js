import {StyleSheet, Dimensions} from 'react-native';
import {moderateScale} from '../common/constants';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

// Use fixed sizes instead of moderateScale for better consistency
const getFixedSize = size => {
  if (isSmallPhone) return size * 0.85;
  if (isTablet) return size * 1.1;
  return size;
};

export const createSearchTableStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: getResponsiveSize(14, 16, 20),
      paddingVertical: getResponsiveSize(10, 12, 14),
      backgroundColor: '#fff',
      borderBottomWoidth: 0,
      borderBottomColor: 'transparent',
    },
    backButton: {
      padding: getResponsiveSize(6, 8, 10),
    },
    headerTitle: {
      fontSize: getResponsiveSize(16, 18, 20),
      fontWeight: '600',
      color: '#2F2F2F',
      marginLeft: getResponsiveSize(6, 8, 10),
    },
    headerSpacer: {
      flex: 1,
    },
    bellIcon: {
      padding: getResponsiveSize(6, 7, 8),
    },
    chooseTableContainer: {
      backgroundColor: '#ffffff',
      paddingHorizontal: getResponsiveSize(14, 16, 20),
      paddingVertical: getResponsiveSize(6, 8, 10),
    },
    chooseTableText: {
      fontSize: getResponsiveSize(16, 18, 20),
      paddingLeft: getResponsiveSize(6, 8, 10),
      color: '#000000',
      fontWeight: '500',
    },
    locationInfoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D1ECF1',
      borderRadius: getResponsiveSize(8, 10, 12),
      paddingVertical: getResponsiveSize(8, 10, 12),
      paddingHorizontal: getResponsiveSize(10, 12, 14),
      marginHorizontal: getResponsiveSize(14, 16, 20),
      marginBottom: getResponsiveSize(12, 16, 20),
      borderColor: '#0C5460',
      borderWidth: 1,
    },
    locationIcon: {
      marginRight: getResponsiveSize(6, 8, 10),
      color: '#0C5460',
      fontSize: getResponsiveSize(18, 20, 22),
    },
    locationInfoText: {
      fontSize: getResponsiveSize(11, 12, 14),
      color: '#0C5460',
      fontWeight: '500',
    },
    searchInputContainer: {
      backgroundColor: '#ffffff',
      paddingHorizontal: getResponsiveSize(14, 16, 20),
      paddingBottom: getResponsiveSize(10, 12, 14),
    },
    searchInput: {
      height: getResponsiveSize(36, 40, 44),
      backgroundColor: '#fff',
      borderRadius: getResponsiveSize(6, 8, 10),
      paddingHorizontal: getResponsiveSize(10, 12, 14),
      fontSize: getResponsiveSize(13, 14, 16),
      color: '#2F2F2F',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    tableList: {
      flex: 1,
      paddingHorizontal: getResponsiveSize(14, 16, 20),
    },
    tableCard: {
      backgroundColor: '#fff',
      borderRadius: getResponsiveSize(6, 8, 10),
      padding: getResponsiveSize(12, 16, 18),
      paddingLeft: getResponsiveSize(20, 30, 35),
      marginBottom: getResponsiveSize(8, 12, 14),
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tableCardTitle: {
      fontSize: getResponsiveSize(16, 18, 20),
      fontWeight: '700',
      color: '#2F2F2F',
      marginBottom: getResponsiveSize(3, 4, 5),
    },
    tableCardDetail: {
      fontSize: getResponsiveSize(12, 14, 16),
      color: '#868686',
      marginBottom: getResponsiveSize(1, 2, 3),
    },
    // Keep mesa styles for backward compatibility
    mesaList: {
      flex: 1,
      paddingHorizontal: getResponsiveSize(14, 16, 20),
    },
    mesaCard: {
      backgroundColor: '#fff',
      borderRadius: getResponsiveSize(6, 8, 10),
      padding: getResponsiveSize(12, 16, 18),
      paddingLeft: getResponsiveSize(20, 30, 35),
      marginBottom: getResponsiveSize(8, 12, 14),
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    mesaCardTitle: {
      fontSize: getResponsiveSize(16, 18, 20),
      fontWeight: '700',
      color: '#2F2F2F',
      marginBottom: getResponsiveSize(3, 4, 5),
    },
    mesaCardDetail: {
      fontSize: getResponsiveSize(12, 14, 16),
      color: '#868686',
      marginBottom: getResponsiveSize(1, 2, 3),
    },
    chooseMesaContainer: {
      backgroundColor: '#ffffff',
      paddingHorizontal: getResponsiveSize(14, 16, 20),
      paddingVertical: getResponsiveSize(6, 8, 10),
    },
    chooseMesaText: {
      fontSize: getResponsiveSize(16, 18, 20),
      paddingLeft: getResponsiveSize(6, 8, 10),
      color: '#000000',
      fontWeight: '500',
    },
  });
};

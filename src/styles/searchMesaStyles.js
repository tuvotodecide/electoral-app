import {StyleSheet} from 'react-native';
import {moderateScale} from '../common/constants';

export const createSearchMesaStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(12),
      backgroundColor: '#fff',
      borderBottomWidth: 0,
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
      padding: moderateScale(7),
    },
    chooseMesaContainer: {
      backgroundColor: '#ffffff',
      fontSize: moderateScale(14),
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(8),
    },
    chooseMesaText: {
      fontSize: moderateScale(18),
      paddingLeft: moderateScale(8),
      color: '#000000',
      fontWeight: '500',
    },
    locationInfoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D1ECF1',
      borderRadius: moderateScale(10),
      paddingVertical: moderateScale(10),
      paddingHorizontal: moderateScale(12),
      marginHorizontal: moderateScale(16),
      marginBottom: moderateScale(16),
      borderColor: '#0C5460',
      borderWidth: 1,
    },
    locationIcon: {
      marginRight: moderateScale(8),
      color: '#0C5460',
      fontSize: moderateScale(20),
    },
    locationInfoText: {
      fontSize: moderateScale(12),
      color: '#0C5460',
      fontWeight: '500',
    },
    searchInputContainer: {
      backgroundColor: '#ffffff',
      paddingHorizontal: moderateScale(16),
      paddingBottom: moderateScale(12),
    },
    searchInput: {
      height: moderateScale(40),
      backgroundColor: '#fff',
      borderRadius: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      fontSize: moderateScale(14),
      color: '#2F2F2F',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    mesaList: {
      flex: 1,
      paddingHorizontal: moderateScale(16),
    },
    mesaCard: {
      backgroundColor: '#fff',
      borderRadius: moderateScale(8),
      padding: moderateScale(16),
      paddingLeft: moderateScale(30),
      marginBottom: moderateScale(12),
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    mesaCardTitle: {
      fontSize: moderateScale(18),
      fontWeight: '700',
      color: '#2F2F2F',
      marginBottom: moderateScale(4),
    },
    mesaCardDetail: {
      fontSize: moderateScale(14),
      color: '#868686',
      marginBottom: moderateScale(2),
    },
    bottomNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#FFFFFF',
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
};

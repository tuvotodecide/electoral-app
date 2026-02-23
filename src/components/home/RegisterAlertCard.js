import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from '../common/CText';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

function RegisterAlertCard({
  title,
  description,
  onPress,
}) {
  return (
    <View style={stylesx.registerAlertCard}>
      <View style={{ flex: 1 }}>
        <CText style={stylesx.registerAlertTitle}>{title}</CText>
        <CText style={stylesx.registerAlertSubtitle}>
          {description}
        </CText>
      </View>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={stylesx.registerAlertCta}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <Ionicons
          name="arrow-forward"
          size={getResponsiveSize(16, 18, 20)}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
};

const stylesx = StyleSheet.create({
  registerAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2', // rojo claro
    borderColor: '#FCA5A5', // borde rojo suave
    borderWidth: 1,
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(14, 16, 20),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    // marginTop: getResponsiveSize(10, 12, 16),
    marginBottom: getResponsiveSize(8, 10, 12),
    // sombra sutil
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  registerAlertTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#7F1D1D',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  registerAlertSubtitle: {
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#7F1D1D',
    opacity: 0.9,
  },
  registerAlertCta: {
    width: getResponsiveSize(36, 40, 44),
    height: getResponsiveSize(36, 40, 44),
    borderRadius: 999,
    backgroundColor: '#E72F2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getResponsiveSize(10, 12, 16),
  },
});


export default RegisterAlertCard;
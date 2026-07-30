import { Ionicons } from "@expo/vector-icons";
import { Dimensions, TouchableOpacity, StyleSheet, View } from "react-native";
import CText from '@/src/components/common/CText';
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import  { TvdTokenCalls } from "@/src/api/tvdToken";
import { formatEther } from "viem";

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;


const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const getBalances = async (address) => {
  const walletBalance = await TvdTokenCalls.balanceOf(address);
  return formatEther(walletBalance.rawBalance);
}

export const TokenRewardsCard = ({currency, onPress}) => {
  const userData = useSelector(state => state.wallet.payload);
  const [balance, setBalance] = useState('-');

  useEffect(() => {
    if (userData?.account) {
      getBalances(userData.account)
        .then(bal => setBalance(bal))
        .catch(() => {
          setBalance('-');
        });
    }
  }, [userData]);


  return (
    <TouchableOpacity
      testID="homeRewardsTokenCard"
      accessibilityRole="button"
      accessibilityLabel="Ver mis recompensas"
      activeOpacity={0.84}
      onPress={onPress}
      style={styles.tokenCard}>
      <View style={styles.tokenIconBox}>
        <Ionicons name="star-outline" size={getResponsiveSize(18, 20, 22)} color="#459151" />
      </View>
      <CText testID="homeRewardsTokenAmount" style={styles.tokenAmount}>
        {balance}
      </CText>
      <CText testID="homeRewardsTokenCurrency" style={styles.tokenCurrency}>
        {currency}
      </CText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    tokenCard: {
    minWidth: getResponsiveSize(102, 118, 136),
    height: getResponsiveSize(52, 58, 66),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12, 14, 16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSize(10, 12, 14),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  tokenIconBox: {
    width: getResponsiveSize(24, 26, 30),
    height: getResponsiveSize(24, 26, 30),
    borderRadius: getResponsiveSize(12, 13, 15),
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(5, 6, 7),
  },
  tokenAmount: {
    color: '#232323',
    fontSize: getResponsiveSize(20, 22, 26),
    fontWeight: '800',
    marginRight: getResponsiveSize(3, 4, 5),
  },
  tokenCurrency: {
    color: '#232323',
    fontSize: getResponsiveSize(11, 12, 14),
    fontWeight: '800',
  },
})

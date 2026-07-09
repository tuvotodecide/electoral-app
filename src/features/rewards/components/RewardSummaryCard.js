import React from 'react';
import {StyleSheet, View} from 'react-native';
import CText from '../../../components/common/CText';
import {moderateScale} from '../../../common/constants';

const RewardSummaryCard = ({total = 0, currency = 'TVD'}) => (
  <View testID="rewardsSummaryCard" style={styles.container}>
    <CText style={styles.label}>Tus recompensas por participar</CText>
    <CText style={styles.amount}>{total}</CText>
    <CText style={styles.currency}>{currency} disponibles</CText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#459151',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(18),
    marginHorizontal: moderateScale(14),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(14),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    color: '#E8F5E9',
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginBottom: moderateScale(8),
  },
  amount: {
    color: '#FFFFFF',
    fontSize: moderateScale(40),
    fontWeight: '800',
    lineHeight: moderateScale(46),
  },
  currency: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginTop: moderateScale(2),
  },
});

export default RewardSummaryCard;

import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import CText from '../../../components/common/CText';
import {moderateScale} from '../../../common/constants';

const RewardListItem = ({reward, onPress}) => (
  <TouchableOpacity
    testID={`rewardItem_${reward.id}`}
    accessibilityRole="button"
    accessibilityLabel={`Ver detalle de ${reward.title}`}
    activeOpacity={0.82}
    onPress={() => onPress(reward)}
    style={styles.container}>
    <View style={styles.iconBox}>
      <Ionicons name="gift-outline" size={moderateScale(22)} color="#459151" />
    </View>
    <View style={styles.content}>
      <CText style={styles.title} numberOfLines={1}>
        {reward.title}
      </CText>
      <CText style={styles.meta} numberOfLines={2}>
        {reward.processLabel}
      </CText>
      <View style={styles.statusBadge}>
        <CText style={styles.statusText}>{reward.statusLabel}</CText>
      </View>
    </View>
    <View style={styles.amountBlock}>
      <CText style={styles.amount}>+{reward.amount}</CText>
      <CText style={styles.currency}>{reward.currency}</CText>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    minHeight: moderateScale(84),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: moderateScale(14),
    marginBottom: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 2,
  },
  iconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(9),
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#232323',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  meta: {
    color: '#8B9399',
    fontSize: moderateScale(11),
    marginTop: moderateScale(3),
    lineHeight: moderateScale(15),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: moderateScale(4),
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    marginTop: moderateScale(7),
  },
  statusText: {
    color: '#459151',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  amountBlock: {
    alignItems: 'flex-end',
    marginLeft: moderateScale(10),
  },
  amount: {
    color: '#459151',
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  currency: {
    color: '#459151',
    fontSize: moderateScale(10),
    fontWeight: '700',
    marginTop: moderateScale(2),
  },
});

export default RewardListItem;

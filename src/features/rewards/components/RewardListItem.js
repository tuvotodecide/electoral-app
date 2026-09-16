import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import CText from '../../../components/common/CText';
import {moderateScale} from '../../../common/constants';

const STATUS_ICONS = {
  pending: {name: 'time-outline', color: '#9CA3AF', background: '#F3F4F6'},
  available: {name: 'gift-outline', color: '#F59E0B', background: '#FEF3C7'},
  received: {name: 'checkmark-circle-outline', color: '#459151', background: '#E8F5E9'},
};

const RewardListItem = ({reward, onPress}) => {
  const statusIcon = STATUS_ICONS[reward.status] || STATUS_ICONS.available;

  return (
    <TouchableOpacity
      testID={`rewardItem_${reward.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${reward.title}`}
      activeOpacity={0.82}
      onPress={() => onPress(reward)}
      style={styles.container}>
      <View
        testID={`rewardItemIconBox_${reward.id}`}
        style={[styles.iconBox, {backgroundColor: statusIcon.background}]}>
        <Ionicons
          testID={`rewardItemIcon_${reward.id}`}
          name={statusIcon.name}
          size={moderateScale(22)}
          color={statusIcon.color}
        />
      </View>
      <View style={styles.content}>
        <CText style={styles.title} numberOfLines={1}>
          {reward.title}
        </CText>
        <CText style={styles.meta} numberOfLines={2}>
          {reward.processLabel + ' - ' + reward.statusLabel}
        </CText>
        {reward.status === 'available' &&
          <View style={styles.statusBadge}>
            <CText style={styles.statusText}>Reclamar</CText>
          </View>
        }
      </View>
      <View style={styles.amountBlock}>
        <CText style={styles.amount}>{(reward.status === 'received' ? '+':'') + reward.amount + ' ' + reward.currency}</CText>
      </View>
    </TouchableOpacity>
  );
};

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
    fontSize: moderateScale(13),
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

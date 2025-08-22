import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import CText from '../common/CText';
import {useSelector} from 'react-redux';
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import {StackNav} from '../../navigation/NavigationKey';
import {useNavigation} from '@react-navigation/native';

export default function CollectionItemComponents({item}) {
  const colors = useSelector(state => state.theme.theme);

  const navigation = useNavigation();

  const onPressSelectItem = item => {
    navigation.navigate(StackNav.CollectionItemDetails, (item = {item}));
  };

  return (
    <TouchableOpacity
      onPress={() => onPressSelectItem(item)}
      style={[
        localStyle.collectionItemContainer,
        {
          borderColor: colors.dark ? colors.grayScale700 : colors.grayScale200,
        },
      ]}>
      <Image source={item.images} style={localStyle.collectionImage} />
      <View style={localStyle.textAndIcon}>
        <CText
          type={'B10'}
          color={colors.grayScale500}
          style={localStyle.userNameText}>
          {item.userName}
        </CText>
        {item.svgIcon}
      </View>
      <CText type={'B12'}>{item.name}</CText>
      <View
        style={[
          localStyle.bottomContainer,
          {
            backgroundColor: colors.inputBackground,
          },
        ]}>
        <View style={localStyle.bottomInnerItemContainer}>
          <CText type={'S8'} color={colors.grayScale500}>
            {item.priceText}
          </CText>
          <CText type={'S8'} color={colors.grayScale500}>
            {item.current}
          </CText>
        </View>
        <View style={localStyle.priceAndBidContainer}>
          <CText type={'B10'} color={colors.primary}>
            {item.price}
          </CText>
          <CText type={'B10'}>{item.currentBid}</CText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const localStyle = StyleSheet.create({
  collectionItemContainer: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    width: '47%',
    height: moderateScale(235),
    ...styles.mr15,
    ...styles.mv10,
    ...styles.p10,
  },
  collectionImage: {
    height: moderateScale(120),
    width: moderateScale(140),
    borderRadius: moderateScale(8),
  },
  textAndIcon: {
    ...styles.mt5,
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  userNameText: {
    ...styles.mr5,
  },
  bottomContainer: {
    height: moderateScale(47),
    width: '100%',
    borderRadius: moderateScale(6),
    ...styles.ph5,
    ...styles.pv10,
    ...styles.mt15,
  },
  bottomInnerItemContainer: {
    ...styles.rowSpaceBetween,
  },
  priceAndBidContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mv5,
  },
});

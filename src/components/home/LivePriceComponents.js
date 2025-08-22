import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import {styles} from '../../themes';
import {deviceWidth, moderateScale} from '../../common/constants';
import CText from '../common/CText';
import {useSelector} from 'react-redux';

export default function LivePriceComponents(props) {
  let {onPressItem, item} = props;
  const colors = useSelector(state => state.theme.theme);
  return (
    <TouchableOpacity
      onPress={onPressItem}
      style={[
        localStyle.livePriceContainer,
        {
          borderColor: colors.dark ? colors.grayScale700 : colors.grayScale200,
        },
      ]}>
      <View style={styles.flexRow}>
        <Image source={item.image} style={localStyle.livePriceImage} />
        <View style={localStyle.titleText}>
          <CText type={'B14'}>{item.title}</CText>
          <View style={styles.rowCenter}>
            <CText
              type={'S10'}
              color={colors.grayScale500}
              style={localStyle.newsTypeText}>
              {item.name}
            </CText>
            {item.amountInDollar ? (
              <View style={[styles.rowCenter, styles.selfCenter]}>
                <View
                  style={[
                    localStyle.dotStyle,
                    {backgroundColor: colors.grayScale500},
                  ]}
                />
                <CText type={'R12'} color={colors.grayScale500}>
                  {item.amountInDollar}
                </CText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.selfEnd}>
        <CText
          type={'B16'}
          color={
            item.name
              ? colors.textColor
              : item.profitValue
              ? colors.green
              : colors.alertColor
          }>
          {item.amount ? item.amount : item.profitValue}
        </CText>
        <View style={localStyle.profitAndLossContainer}>
          {item.profit ? (
            <Ionicons
              name={'arrow-up-circle-outline'}
              color={colors.green}
              size={moderateScale(20)}
              style={localStyle.iconStyle}
            />
          ) : (
            <Ionicons
              name={'arrow-down-circle-outline'}
              color={colors.alertColor}
              size={moderateScale(20)}
              style={localStyle.iconStyle}
            />
          )}
          {item.profit ? (
            <CText
              type={'S12'}
              color={colors.green}
              style={localStyle.profitAndLossText}>
              {item.profit}
            </CText>
          ) : (
            <CText
              type={'S12'}
              color={colors.alertColor}
              style={localStyle.profitAndLossText}>
              {item.loss}
            </CText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const localStyle = StyleSheet.create({
  sortText: {
    ...styles.ml5,
  },
  livePriceContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt15,
    ...styles.ph10,
    ...styles.pv15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.rowSpaceBetween,
    width: deviceWidth - moderateScale(40),
  },
  profitAndLossContainer: {
    ...styles.flexRow,
  },
  livePriceImage: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  titleText: {
    ...styles.ml10,
    ...styles.mt5,
  },
  profitAndLossText: {
    ...styles.ml5,
    ...styles.mt2,
  },
  dotStyle: {
    height: moderateScale(4),
    width: moderateScale(4),
    borderRadius: moderateScale(4),
    ...styles.mh5,
    ...styles.ml5,
  },
});

import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';

// custom import
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import {styles} from '../../../../themes';
import {deviceWidth, moderateScale} from '../../../../common/constants';
import {useSelector} from 'react-redux';
import {LivePriceData, TrendingData} from '../../../../api/constant';
import {Sort_Dark, Sort_Light} from '../../../../assets/svg';
import {StackNav} from '../../../../navigation/NavigationKey';
import LivePriceComponents from '../../../../components/home/LivePriceComponents';

export default function CryptoScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressSort = () => {
    navigation.navigate(StackNav.SearchCryptoSort);
  };

  const trending = ({item, indx}) => {
    return (
      <View
        style={[
          localStyle.trendingContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.flexRow}>
          <Image source={item.image} style={localStyle.trendingImage} />
          <View style={localStyle.trendingTitleText}>
            <CText type={'B14'}>{item.title}</CText>
            <CText type={'R10'} color={colors.grayScale500}>
              {item.name}
            </CText>
          </View>
        </View>
        <View style={localStyle.trendingProfitContainer}>
          <View>
            <CText type={'B12'}>{item.amount}</CText>

            <View style={styles.flexRow}>
              {item.upArrow === true ? (
                <Ionicons
                  name={'arrow-up-circle-outline'}
                  color={colors.green}
                  size={moderateScale(16)}
                  style={localStyle.iconStyle}
                />
              ) : (
                <Ionicons
                  name={'arrow-down-circle-outline'}
                  color={colors.alertColor}
                  size={moderateScale(16)}
                  style={localStyle.iconStyle}
                />
              )}
              {item.profit ? (
                <CText
                  type={'S10'}
                  color={colors.green}
                  style={localStyle.profitAndLossText}>
                  {item.profit}
                </CText>
              ) : (
                <CText
                  type={'S10'}
                  color={colors.alertColor}
                  style={localStyle.profitAndLossText}>
                  {item.loss}
                </CText>
              )}
            </View>
          </View>
          <Image source={item.profitImage} style={localStyle.chartImage} />
        </View>
      </View>
    );
  };

  const livePriceCategory = ({item, index}) => {
    return <LivePriceComponents item={item} onPressItem={onPressSort} />;
  };

  const ListHeaderComponent = () => {
    return (
      <View>
        <View style={localStyle.trendingHeader}>
          <View style={styles.flexRow}>
            <CText type={'B16'}>{String.trending}</CText>
            <Ionicons
              name={'chevron-down-outline'}
              size={moderateScale(16)}
              color={colors.grayScale500}
              style={localStyle.dropDownIcon}
            />
          </View>
          <TouchableOpacity>
            <CText type={'S12'} color={colors.primary}>
              {String.seeAll}
            </CText>
          </TouchableOpacity>
        </View>
        <FlatList
          data={TrendingData}
          renderItem={trending}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
        />
        <View style={localStyle.trendingHeader}>
          <CText type={'B16'}>{String.livePrices}</CText>
          <TouchableOpacity onPress={onPressSort}>
            <View style={styles.flexRow}>
              {colors.dark ? <Sort_Dark /> : <Sort_Light />}
              <CText
                type={'M14'}
                color={colors.grayScale500}
                style={localStyle.sortText}>
                {String.sort}
              </CText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={LivePriceData}
      renderItem={livePriceCategory}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyExtractor={(item, index) => index.toString()}
      ListHeaderComponent={<ListHeaderComponent />}
      contentContainerStyle={styles.mb20}
    />
  );
}

const localStyle = StyleSheet.create({
  trendingHeader: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  dropDownIcon: {
    ...styles.ml5,
    ...styles.mt5,
  },
  trendingImage: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  trendingTitleText: {
    ...styles.ml10,
    ...styles.mt5,
  },
  trendingProfitContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  trendingContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt20,
    ...styles.ph10,
    ...styles.pv15,
    borderWidth: moderateScale(1),
    width: moderateScale(212),
    ...styles.mr20,
  },
  chartImage: {
    height: moderateScale(38),
    width: moderateScale(97),
    ...styles.ml20,
  },
  profitAndLossText: {
    ...styles.ml5,
    ...styles.mt2,
  },
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
});

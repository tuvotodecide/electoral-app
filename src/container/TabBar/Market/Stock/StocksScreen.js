import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import {styles} from '../../../../themes';
import LivePriceComponents from '../../../../components/home/LivePriceComponents';
import {StackNav} from '../../../../navigation/NavigationKey';
import {moderateScale} from '../../../../common/constants';
import {
  AllStocksData,
  SectorsData,
  StockFuturesData,
} from '../../../../api/constant';
import {Sort_Dark, Sort_Light} from '../../../../assets/svg';

export default function StocksScreen() {
  const colors = useSelector(state => state.theme.theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();

  const onPressSeeAll = () => {
    navigation.navigate(StackNav.MarketSectors);
  };
  const onPressStockFutures = item => {
    navigation.navigate(StackNav.StockFutures, {item: item});
  };
  const onPressSort = () => {
    navigation.navigate(StackNav.SearchStocks);
  };
  const _onViewableItemsChanged = useCallback(({viewableItems}) => {
    setCurrentIndex(viewableItems[0]?.index);
  }, []);
  const _onViewabilityConfig = {itemVisiblePercentThreshold: 50};

  const stockFutures = ({item, indx}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressStockFutures(item)}
        style={[
          localStyle.stockContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
            backgroundColor: item.id === 1 ? colors.primary : null,
          },
        ]}>
        <View style={styles.flexRow}>
          <Image source={item.image} style={localStyle.stockFutureImage} />
          <View style={localStyle.stockFutureText}>
            <CText
              type={'B14'}
              color={item.id === 1 ? colors.white : colors.textColor}>
              {item.title}
            </CText>
            <CText
              type={'R10'}
              color={item.id === 1 ? colors.primary2 : colors.grayScale500}>
              {item.name}
            </CText>
          </View>
        </View>
        <View style={localStyle.chartAndProfitContainer}>
          <View>
            <CText
              type={'B12'}
              color={item.id === 1 ? colors.white : colors.grayScale500}>
              {item.amount}
            </CText>
            <View style={localStyle.profitIcon}>
              <Ionicons
                name={'arrow-up-circle-outline'}
                color={colors.green}
                size={moderateScale(16)}
                style={localStyle.iconStyle}
              />
              <CText
                type={'S10'}
                color={colors.green}
                style={localStyle.profitAndLossText}>
                {item.profit}
              </CText>
            </View>
          </View>
          <Image source={item.chartImage} style={localStyle.chartImage} />
        </View>
      </TouchableOpacity>
    );
  };

  const sectorCategory = ({item, index}) => {
    return (
      <View>
        <TouchableOpacity
          style={[
            localStyle.sectorsContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          {item.svgIcon}
        </TouchableOpacity>
        <CText
          type={'B12'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.sectorText}>
          {item.titleName}
        </CText>
      </View>
    );
  };

  const allStocks = ({item, index}) => {
    return <LivePriceComponents item={item} onPressItem={onPressSort} />;
  };

  return (
    <CSafeAreaView>
      <View>
        <View style={localStyle.stockFuturesHeader}>
          <CText type={'B16'}>{String.stockFutures}</CText>
          <View style={localStyle.bottomIndicatorContainer}>
            {StockFuturesData.map((_, index) => (
              <View
                style={[
                  localStyle.bottomIndicatorStyle,
                  {
                    width:
                      index !== currentIndex
                        ? moderateScale(10)
                        : moderateScale(30),
                    backgroundColor:
                      index !== currentIndex
                        ? colors.dark
                          ? colors.grayScale700
                          : colors.grayScale200
                        : colors.primary,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <FlatList
          data={StockFuturesData}
          renderItem={stockFutures}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={_onViewableItemsChanged}
          bounces={false}
          _onViewabilityConfig={_onViewabilityConfig}
          pagingEnabled
        />
        <View style={localStyle.sectorContainer}>
          <CText type={'B16'}>{String.sectors}</CText>
          <TouchableOpacity onPress={onPressSeeAll}>
            <CText type={'M14'} color={colors.primary}>
              {String.seeAll}
            </CText>
          </TouchableOpacity>
        </View>
        <FlatList
          data={SectorsData}
          renderItem={sectorCategory}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          bounces={false}
          showsHorizontalScrollIndicator={false}
        />
        <View style={localStyle.sectorContainer}>
          <CText type={'B16'}>{String.allStocks}</CText>
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
        <FlatList
          data={AllStocksData}
          renderItem={allStocks}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mb20}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  stockFuturesHeader: {
    ...styles.rowSpaceBetween,
    ...styles.mt10,
  },
  imageAndBankNameContainer: {
    ...styles.flexRow,
  },
  chartAndProfitContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
  },
  stockFutureImage: {
    height: moderateScale(40),
    width: moderateScale(40),
  },
  chartImage: {
    height: moderateScale(38),
    width: moderateScale(97),
    ...styles.ml20,
  },
  stockContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt20,
    ...styles.ph20,
    ...styles.pv20,
    ...styles.mr20,
    borderWidth: moderateScale(1),
  },
  stockFutureText: {
    ...styles.ml10,
  },
  profitIcon: {
    ...styles.flexRow,
    ...styles.mt5,
  },
  iconStyle: {
    ...styles.mr5,
  },
  bottomIndicatorContainer: {
    ...styles.flexRow,
    ...styles.ml15,
  },
  bottomIndicatorStyle: {
    height: moderateScale(10),
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(2),
    ...styles.alignStart,
  },
  sectorContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  sectorsContainer: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(56 / 2),
    ...styles.center,
    ...styles.mh15,
    borderWidth: moderateScale(1),
    ...styles.mt20,
  },
  sectorText: {
    ...styles.mt10,
  },
  sortText: {
    ...styles.ml5,
  },
});

import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CText from '../../../../components/common/CText';
import CHeader from '../../../../components/common/CHeader';
import {styles} from '../../../../themes';
import String from '../../../../i18n/String';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import CInput from '../../../../components/common/CInput';
import {PortfolioStockData, StockAssetsData} from '../../../../api/constant';
import {getHeight, moderateScale} from '../../../../common/constants';
import {Chart_PieIcon, VectorIcon} from '../../../../assets/svg';
import {StackNav} from '../../../../navigation/NavigationKey';

export default function StockPortfolio({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchData, setSearchData] = useState(StockAssetsData);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const BlurredStyle = {
    borderColor: colors.inputBackground,
  };
  const FocusedStyle = {
    borderColor: colors.primary,
  };

  const onFocusSelect = () => {
    onFocusInput(setSearchInputStyle);
  };
  const onBlurSelect = () => {
    onBlurInput(setSearchInputStyle);
  };

  const LeftIcon = () => {
    return (
      <TouchableOpacity>
        <Ionicons
          name={'search-outline'}
          size={moderateScale(20)}
          color={colors.grayScale500}
        />
      </TouchableOpacity>
    );
  };
  const RightIcon = () => {
    return (
      <View style={localStyle.iconContainer}>
        <TouchableOpacity style={localStyle.iconStyle}>
          <Chart_PieIcon />
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressHistory}>
          <VectorIcon />
        </TouchableOpacity>
      </View>
    );
  };
  const onChangeTextSearch = item => {
    setSearchText(item);
  };
  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route);
    }
  };
  useEffect(() => {
    filterData();
  }, [searchText]);

  const filterData = () => {
    if (!!searchText) {
      const filteredData = StockAssetsData.filter(item =>
        item?.title.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(StockAssetsData);
    }
  };

  const onPressHistory = () => {
    navigation.navigate(StackNav.StockHistory);
  };
  const financialCategory = ({item, index}) => {
    return (
      <View>
        <TouchableOpacity
          onPress={() => onPressItem(item)}
          style={[
            localStyle.portfolioContainer,
            {
              backgroundColor: colors.gradientBackground,
            },
          ]}>
          {item.svgIcon}
        </TouchableOpacity>
        <CText
          type={'B12'}
          align={'center'}
          color={colors.white}
          style={localStyle.portfolioText}>
          {item.title}
        </CText>
      </View>
    );
  };
  const stockAssets = ({item, indx}) => {
    return (
      <View
        style={[
          localStyle.stockAssetsContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={localStyle.mainAssetContainer}>
          <View style={localStyle.imageAndTextContainer}>
            <Image source={item.image} style={localStyle.stockAssetsImage} />
            <View style={localStyle.titleText}>
              <CText type={'B14'}>{item.title}</CText>
              <CText type={'S10'} color={colors.grayScale500}>
                {item.name}
              </CText>
            </View>
          </View>
          <Image source={item.chartImage} style={localStyle.chartImage} />
        </View>
        <View
          style={[
            localStyle.lineView,
            {
              backgroundColor: colors.dark
                ? colors.grayScale500
                : colors.grayScale200,
            },
          ]}
        />
        <View style={localStyle.mainAssetContainer}>
          <View style={localStyle.titleText}>
            <CText type={'R12'} color={colors.grayScale500}>
              {item.shares}
            </CText>
            <CText type={'B14'} style={localStyle.amountAndProLoss}>
              {item.amount}
            </CText>
          </View>
          <View style={localStyle.titleText}>
            <CText type={'R12'} color={colors.grayScale500}>
              {item.gainLoss}
            </CText>
            <CText
              type={'B14'}
              style={localStyle.amountAndProLoss}
              color={item.profit ? colors.green : colors.alertColor}>
              {item.profit ? item.profit : item.loss}
            </CText>
          </View>
        </View>
      </View>
    );
  };
  return (
    <CSafeAreaView>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1.6}}
        style={localStyle.headerContainer}
        colors={[colors.gradient1, colors.gradient2, colors.gradient1]}>
        <CHeader rightIcon={<RightIcon />} color={colors.white} />
        <View style={localStyle.mainContainer}>
          <CText type={'R14'} color={colors.primary2}>
            {String.totalAssetValue}
          </CText>
          <View style={localStyle.assetAndBtn}>
            <View style={[localStyle.assetContainer, {gap: moderateScale(10)}]}>
              <CText type={'B32'} color={colors.white}>
                {'$12,768.00'}
              </CText>
              <Ionicons
                name={'eye-outline'}
                size={moderateScale(24)}
                color={colors.white}
              />
            </View>
            <TouchableOpacity
              style={[localStyle.profitBtn, {backgroundColor: colors.green}]}>
              <Ionicons
                name={'arrow-up-circle-outline'}
                color={colors.white}
                size={moderateScale(20)}
                style={styles.mr5}
              />
              <CText color={colors.white}>{'9.10%'}</CText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={PortfolioStockData}
            renderItem={financialCategory}
            horizontal
            keyExtractor={(item, index) => index.toString()}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mt10}
          />
        </View>
      </LinearGradient>
      <KeyBoardAvoidWrapper contentContainerStyle={localStyle.footerContainer}>
        <CInput
          onChangeText={onChangeTextSearch}
          maxLength={30}
          autoCapitalize={'none'}
          inputContainerStyle={searchInputStyle}
          _onFocus={onFocusSelect}
          onBlur={onBlurSelect}
          insideLeftIcon={() => <LeftIcon />}
          placeHolder={String.searchAssets}
        />
        <FlatList
          data={searchData}
          renderItem={stockAssets}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mb30}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  headerContainer: {
    height: getHeight(312),
  },
  iconContainer: {
    ...styles.flexRow,
    ...styles.center,
  },
  iconStyle: {
    ...styles.mr10,
  },
  mainContainer: {
    ...styles.ph20,
  },
  assetAndBtn: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
  },
  assetContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  profitBtn: {
    height: moderateScale(30),
    width: moderateScale(75),
    borderRadius: moderateScale(15),
    ...styles.rowSpaceBetween,
    ...styles.ph10,
    ...styles.center,
  },
  portfolioContainer: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(56 / 2),
    ...styles.center,
    ...styles.mh15,
    ...styles.mt20,
  },
  portfolioText: {
    ...styles.mt10,
  },

  footerContainer: {
    ...styles.ph20,
    ...styles.mt20,
  },
  stockAssetsContainer: {
    width: moderateScale(327),
    height: moderateScale(156),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.mv10,
    ...styles.ph10,
    ...styles.pv20,
  },
  mainAssetContainer: {
    ...styles.rowSpaceBetween,
  },
  stockAssetsImage: {
    height: moderateScale(40),
    width: moderateScale(40),
  },
  imageAndTextContainer: {
    ...styles.rowCenter,
  },
  titleText: {
    ...styles.ml10,
  },
  chartImage: {
    width: moderateScale(90),
    height: moderateScale(38),
  },
  lineView: {
    height: moderateScale(1),
    width: '98%',
    ...styles.mv20,
  },
  amountAndProLoss: {
    ...styles.mt5,
  },
});

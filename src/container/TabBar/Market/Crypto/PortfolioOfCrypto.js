import {StyleSheet, View, TouchableOpacity, FlatList} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CText from '../../../../components/common/CText';
import CHeader from '../../../../components/common/CHeader';
import {Chart_PieIcon, VectorIcon} from '../../../../assets/svg';
import {styles} from '../../../../themes';
import String from '../../../../i18n/String';
import {getHeight, moderateScale} from '../../../../common/constants';
import {PortfolioCryptoData, PortfolioData} from '../../../../api/constant';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import CInput from '../../../../components/common/CInput';
import LivePriceComponents from '../../../../components/home/LivePriceComponents';
import {StackNav} from '../../../../navigation/NavigationKey';

export default function PortfolioOfCrypto({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchData, setSearchData] = useState(PortfolioCryptoData);

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
  const onPressHistory = () => {
    navigation.navigate(StackNav.CryptoHistory);
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
      const filteredData = PortfolioCryptoData.filter(item =>
        item?.title.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(PortfolioCryptoData);
    }
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
  const livePriceCategory = ({item, index}) => {
    return (
      <LivePriceComponents item={item} onPressItem={() => onPressItem(item)} />
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
                {'$56,890.00'}
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
            data={PortfolioData}
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
          renderItem={livePriceCategory}
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
  dotStyle: {
    height: moderateScale(4),
    width: moderateScale(4),
    borderRadius: moderateScale(4),
    ...styles.mh5,
  },
  footerContainer: {
    ...styles.ph20,
    ...styles.mt20,
  },
});

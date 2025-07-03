import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import CInput from '../../../components/common/CInput';
import {moderateScale} from '../../../common/constants';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {MarketCategoryData} from '../../../api/constant';
import CText from '../../../components/common/CText';
import CryptoScreen from './Crypto/CryptoScreen';
import NFTsScreen from './NFTs/NFTsScreen';
import GoldScreen from './Gold/GoldScreen';
import StocksScreen from './Stock/StocksScreen';

export default function MarketScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [isSelect, setIsSelect] = useState(String.cryptoAssets);
  const [searchData, setSearchData] = useState(MarketCategoryData);

  const onPressCategory = item => {
    setIsSelect(item.title);
  };

  const onChangeTextSearch = item => {
    setSearchText(item);
  };

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
  useEffect(() => {
    filterData();
  }, [searchText]);

  const filterData = () => {
    if (!!searchText) {
      const filteredData = MarketCategoryData.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(MarketCategoryData);
    }
  };
  const LeftIcon = () => {
    return (
      <TouchableOpacity>
        <Ionicons
          name={'search-outline'}
          size={moderateScale(20)}
          color={colors.grayScale500}
          style={styles.ml15}
        />
      </TouchableOpacity>
    );
  };

  const HeaderCategory = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressCategory(item)}
        style={[
          localStyle.itemContainer,
          {
            backgroundColor:
              isSelect === item.title ? colors.primary : colors.inputBackground,
          },
        ]}>
        {isSelect === item.title
          ? item.svgDark
          : colors.dark
          ? item.svgDark
          : item.svgLight}
        <CText
          type={'M14'}
          align={'center'}
          color={isSelect === item.title ? colors.white : colors.grayScale400}
          style={styles.mh15}>
          {item.title}
        </CText>
      </TouchableOpacity>
    );
  };

  const RenderInboxFiled = () => {
    switch (isSelect) {
      case String.cryptoAssets:
        return <CryptoScreen navigation={navigation} />;
      case String.uSStocks:
        return <StocksScreen />;
      case String.NFTs:
        return <NFTsScreen />;
      case String.gold:
        return <GoldScreen />;
      default:
        return <CryptoScreen navigation={navigation} />;
    }
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.market} />
      <KeyBoardAvoidWrapper contentContainerStyle={localStyle.mainContainer}>
        <CInput
          onChangeText={onChangeTextSearch}
          maxLength={30}
          autoCapitalize={'none'}
          inputContainerStyle={searchInputStyle}
          _onFocus={onFocusSelect}
          onBlur={onBlurSelect}
          insideLeftIcon={() => <LeftIcon />}
          placeHolder={String.search}
        />
        <FlatList
          data={searchData}
          renderItem={HeaderCategory}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          bounces={false}
          showsHorizontalScrollIndicator={false}
        />
        <View style={localStyle.bottomContainer}>
          <RenderInboxFiled />
        </View>
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  itemContainer: {
    ...styles.center,
    borderRadius: moderateScale(10),
    height: moderateScale(40),
    ...styles.mr10,
    ...styles.mv10,
    ...styles.flexRow,
    ...styles.ph10,
  },
  bottomContainer: {
    ...styles.flex,
  },
});

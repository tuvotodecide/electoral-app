import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import {SearchStockData} from '../../../../api/constant';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../../themes';
import {deviceWidth, moderateScale} from '../../../../common/constants';
import LivePriceComponents from '../../../../components/home/LivePriceComponents';
import {StackNav} from '../../../../navigation/NavigationKey';

// custom import

export default function SearchStocks({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchData, setSearchData] = useState(SearchStockData);

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
      const filteredData = SearchStockData.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(SearchStockData);
    }
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
  const onPressClose = () => {
    navigation.goBack();
  };
  const onPressItem = item => {
    navigation.navigate(StackNav.DetailsStock, {item: item});
  };
  const searchStock = ({item, index}) => {
    return (
      <LivePriceComponents item={item} onPressItem={() => onPressItem(item)} />
    );
  };
  return (
    <CSafeAreaView>
      <KeyBoardAvoidWrapper containerStyle={localStyle.mainContainer}>
        <View style={localStyle.headerContainer}>
          <CInput
            onChangeText={onChangeTextSearch}
            maxLength={30}
            autoCapitalize={'none'}
            inputContainerStyle={[localStyle.SearchInput, searchInputStyle]}
            _onFocus={onFocusSelect}
            onBlur={onBlurSelect}
            insideLeftIcon={() => <LeftIcon />}
            placeHolder={String.searchHere}
          />
          <TouchableOpacity onPress={onPressClose}>
            <Ionicons
              name={'close'}
              size={moderateScale(24)}
              style={styles.ml15}
              color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            />
          </TouchableOpacity>
        </View>
        <FlatList
          data={searchData}
          renderItem={searchStock}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mb20}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  SearchInput: {
    width: deviceWidth - moderateScale(80),
  },
  headerContainer: {
    ...styles.flexRow,
    ...styles.mt20,
    ...styles.center,
  },
});

import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CInput from '../../../../components/common/CInput';
import String from '../../../../i18n/String';
import {useSelector} from 'react-redux';
import {styles} from '../../../../themes';
import {deviceWidth, moderateScale} from '../../../../common/constants';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import LivePriceComponents from '../../../../components/home/LivePriceComponents';
import {SearchLivePriceData} from '../../../../api/constant';
import {StackNav} from '../../../../navigation/NavigationKey';

export default function SearchCryptoSort({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchData, setSearchData] = useState(SearchLivePriceData);

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
  const onPressItem = item => {
    navigation.navigate(StackNav.CryptoDetails, {item: item});
  };
  const livePriceCategory = ({item, index}) => {
    return (
      <LivePriceComponents item={item} onPressItem={() => onPressItem(item)} />
    );
  };
  useEffect(() => {
    filterData();
  }, [searchText]);

  const filterData = () => {
    if (!!searchText) {
      const filteredData = SearchLivePriceData.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(SearchLivePriceData);
    }
  };
  const onPressClose = () => {
    navigation.goBack();
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
          renderItem={livePriceCategory}
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

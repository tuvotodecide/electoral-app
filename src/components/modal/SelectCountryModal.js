import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CText from '../common/CText';
import {styles} from '../../themes';
import {deviceWidth, moderateScale} from '../../common/constants';
import {useSelector} from 'react-redux';
import {SelectCountryData} from '../../api/constant';
import String from '../../i18n/String';
import CSafeAreaView from '../common/CSafeAreaView';
import CInput from '../common/CInput';

export default function SelectCountryModal(props) {
  let {visible, selectedCountry , onPressClose} = props;

  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchData, setSearchData] = useState(SelectCountryData);
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);

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

  const onChangeTextSearch = item => {
    setSearchText(item);
  };

  useEffect(() => {
    filterData();
  }, [searchText]);

  const filterData = () => {
    if (!!searchText) {
      const filteredData = SelectCountryData.filter(item =>
        item.countryName.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(SelectCountryData);
    }
  };

  const onPressSelectCountry = item => {
    setIsSelect(item);
    selectedCountry(item);
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

  const RenderCountryData = ({item, index}) => {
    return (
      <View>
        <TouchableOpacity onPress={() => onPressSelectCountry(item)}>
          <View style={[localStyle.mainViewContainer]}>
            {item.svgIcon}
            <CText type={'M16'} style={styles.ml20}>
              {item.countryName}
            </CText>
          </View>
        </TouchableOpacity>
        {item.id === 4 ? null : (
          <View
            style={[
              localStyle.lineStyle,
              {
                borderColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale200,
              },
            ]}
          />
        )}
      </View>
    );
  };
  return (
    <Modal animationType="slide" visible={visible} transparent={true}>
      <CSafeAreaView>
        <TouchableOpacity
          onPress={onPressClose}
          style={localStyle.closeIconStyle}>
          <Ionicons
            size={moderateScale(24)}
            name={'close'}
            color={colors.textColor}
          />
        </TouchableOpacity>
        <View style={localStyle.mainContainer}>
          <CText type={'B24'}>{String.selectYourCountry}</CText>
          <CInput
            onChangeText={onChangeTextSearch}
            maxLength={30}
            autoCapitalize={'none'}
            inputContainerStyle={searchInputStyle}
            _onFocus={onFocusSelect}
            onBlur={onBlurSelect}
            insideLeftIcon={() => <LeftIcon />}
            placeHolder={String.selectYourCountry}
          />
          <View
            style={[
              localStyle.CountryContainer,
              {
                backgroundColor: colors.dark
                  ? colors.inputBackground
                  : colors.backgroundColor,
              },
            ]}>
            <FlatList
              data={searchData}
              renderItem={RenderCountryData}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              vertical
            />
          </View>
        </View>
      </CSafeAreaView>
    </Modal>
  );
}

const localStyle = StyleSheet.create({
  mainViewContainer: {
    ...styles.flexRow,
    ...styles.p10,
    ...styles.m10,
  },
  lineStyle: {
    width: deviceWidth - moderateScale(60),
    borderWidth: moderateScale(1),
    ...styles.ph10,
    ...styles.selfCenter,
  },
  mainContainer: {
    ...styles.ph20,
  },

  closeIconStyle: {
    ...styles.ml25,
    width: moderateScale(48),
    height: moderateScale(48),
    ...styles.center,
    borderRadius: moderateScale(25),
  },
  container: {
    ...styles.flexRow,
    ...styles.alignCenter,
    ...styles.mb20,
    ...styles.mt10,
  },
  CountryContainer: {
    height: '50%',
    ...styles.mt20,
    borderRadius: moderateScale(10),
  },
});

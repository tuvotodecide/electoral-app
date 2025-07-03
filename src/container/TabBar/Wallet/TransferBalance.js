import {
  Image,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Icons from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {useSelector} from 'react-redux';
import {moderateScale} from '../../../common/constants';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CInput from '../../../components/common/CInput';
import {styles} from '../../../themes';
import CText from '../../../components/common/CText';
import {TransferContactList} from '../../../api/constant';

export default function TransferBalance() {
  const colors = useSelector(state => state.theme.theme);

  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchData, setSearchData] = useState(TransferContactList);

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
      const filteredData = TransferContactList.map(section => ({
        data: section.data.filter(item =>
          item?.userName?.toLowerCase().includes(searchText.toLowerCase()),
        ),
      })).filter(section => section.data.length > 0);

      console.log('Filtered Data:', filteredData);

      setSearchData(filteredData);
    } else {
      setSearchData(TransferContactList);
    }
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Icons
          name={'plus-circle'}
          size={moderateScale(24)}
          color={colors.primary}
        />
      </TouchableOpacity>
    );
  };

  const TransferContact = ({item, index}) => {
    return (
      <View style={localStyle.transferContainer}>
        <Image source={item.image} style={localStyle.userImage} />
        <View style={localStyle.userNameContainer}>
          <CText type={'B16'}>{item.userName}</CText>
          <CText type={'R14'} color={colors.grayScale500}>
            {item.value}
          </CText>
        </View>
      </View>
    );
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

  const RenderHeader = ({title}) => {
    return (
      <CText type="B14" style={styles.mt20} color={colors.grayScale500}>
        {title}
      </CText>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.addressBook} rightIcon={<RightIcon />} />
      <KeyBoardAvoidWrapper containerStyle={localStyle.mainContainer}>
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

        <SectionList
          sections={searchData}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <TransferContact item={item} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({section: {title}}) => (
            <RenderHeader title={title} />
          )}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  transferContainer: {
    ...styles.flexRow,
    ...styles.mv10,
  },
  userImage: {
    width: moderateScale(48),
    height: moderateScale(48),
  },
  userNameContainer: {
    ...styles.ml10,
    ...styles.mt2,
  },
  mainContainer: {
    ...styles.ph20,
  },
});

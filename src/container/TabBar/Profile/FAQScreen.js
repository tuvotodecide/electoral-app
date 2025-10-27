import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import CInput from '../../../components/common/CInput';
import {useSelector} from 'react-redux';
import CHeader from '../../../components/common/CHeader';
import {getHeight, moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import FaqComponent from '../../../components/home/FaqComponents';
import {FaqData, SearchTopicsFaqs} from '../../../api/constant';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';

export default function FAQScreen() {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchData, setSearchData] = useState(SearchTopicsFaqs);

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('FAQScreen', true);
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
      const filteredData = SearchTopicsFaqs.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(SearchTopicsFaqs);
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

  const renderIem = ({item}) => {
    return (
      <FaqComponent
        title={item.title}
        description={<HelpAndSupportDescription item={item} />}
      />
    );
  };

  const HelpAndSupportDescription = ({item}) => {
    return (
      <View style={styles.ph10}>
        <CText type={'M14'} color={colors.GrayScale500}>
          {item.description}
        </CText>
      </View>
    );
  };

  const searchTopics = ({item, index}) => {
    return (
      <TouchableOpacity
        disabled={item === String.darkMode}
        key={index}
        activeOpacity={item.rightIcon ? 1 : 0.5}
        // onPress={() => onPressItem(item)}
        style={[
          localStyle.renderItemContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.rowCenter}>
          {item.svgIcon}

          <View style={styles.ml10}>
            <CText type={'B12'}>{item.title}</CText>
          </View>
        </View>

        <Ionicons
          name={'chevron-forward-outline'}
          size={moderateScale(20)}
          color={colors.dark ? colors.grayScale500 : colors.grayScale400}
          style={styles.mr10}
        />
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView>
      <KeyBoardAvoidWrapper>
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 2.1}}
          style={localStyle.askedQuestionHeader}
          colors={[colors.gradient1, colors.gradient2, colors.gradient1]}>
          <CHeader color={colors.white} />

          <View style={localStyle.askedQuestionTitle}>
            <CText type={'B24'} color={colors.white}>
              {String.frequentlyAskedQuestion}
            </CText>
            <CInput
              onChangeText={onChangeTextSearch}
              maxLength={30}
              autoCapitalize={'none'}
              inputContainerStyle={[localStyle.SearchInput, searchInputStyle]}
              _onFocus={onFocusSelect}
              onBlur={onBlurSelect}
              insideLeftIcon={() => <LeftIcon />}
              placeHolder={String.search}
              bgColor={colors.white}
              borderColor={colors.white}
              textColor={colors.black}
            />
          </View>
        </LinearGradient>
        <View style={localStyle.mainContainer}>
          <CText type={'B16'}>{String.popularQuestions}</CText>

          <FlatList
            data={FaqData}
            renderItem={renderIem}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            vertical
          />
          <CText type={'B16'}>{String.searchByTopics}</CText>
          <FlatList
            data={searchData}
            renderItem={searchTopics}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            vertical
            bounces={false}
          />
        </View>
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  askedQuestionHeader: {
    height: getHeight(250),
    ...styles.mt10,
  },
  askedQuestionTitle: {
    top: moderateScale(50),
    ...styles.ph20,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.mt20,
  },
  renderItemContainer: {
    height: moderateScale(56),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mv10,
    ...styles.ph10,
    borderWidth: moderateScale(1),
  },
});

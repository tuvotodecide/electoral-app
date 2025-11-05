import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {getHeight, moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import {useSelector} from 'react-redux';
import CInput from '../../../components/common/CInput';
import images from '../../../assets/images';
import {helpAndCenterData} from '../../../api/constant';
import {HeadSetIcon} from '../../../assets/svg';
import {StackNav} from '../../../navigation/NavigationKey';


export default function HelpCenter({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchData, setSearchData] = useState(helpAndCenterData);
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
      const filteredData = helpAndCenterData.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase()),
      );
      setSearchData(filteredData);
    } else {
      setSearchData(helpAndCenterData);
    }
  };

  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route, {item: item});
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

  const helpAndCenterDetails = ({item, index}) => {
    return (
      <TouchableOpacity
        disabled={item === String.darkMode}
        key={index}
        activeOpacity={item.rightIcon ? 1 : 0.5}
        onPress={() => onPressItem(item)}
        style={[
          localStyle.renderItemContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.rowCenter}>
          <View
            style={[
              localStyle.iconBackground,
              {
                backgroundColor: colors.dark
                  ? colors.inputBackground
                  : colors.iconBackgroundColor,
              },
            ]}>
            {item.svgIcon}
          </View>
          <View style={styles.ml10}>
            <CText type={'B12'}>{item.title}</CText>
            <CText type={'R10'} color={colors.grayScale500}>
              {item.description}
            </CText>
          </View>
        </View>

        <Ionicons
          name={'chevron-forward-outline'}
          size={moderateScale(24)}
          color={colors.dark ? colors.grayScale500 : colors.grayScale400}
          style={styles.mr10}
        />
      </TouchableOpacity>
    );
  };
  const rightBottomIcon = () => {
    return (
      <TouchableOpacity
        style={[
          localStyle.rightBottomIcon,
          {
            backgroundColor: colors.primary,
          },
        ]}>
        <HeadSetIcon />
      </TouchableOpacity>
    );
  };

  const onPressAskQuestion = () => {
    navigation.navigate(StackNav.FAQScreen);
  };
  return (
    <CSafeAreaView>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 2.1}}
        style={localStyle.activityHeader}
        colors={[colors.gradient1, colors.gradient2, colors.gradient1]}>
        <CHeader color={colors.white} />

        <View style={localStyle.helpCenterTitle}>
          <CText type={'B24'} color={colors.white}>
            {String.hiHowCanWeHelp}
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
        <TouchableOpacity
          onPress={onPressAskQuestion}
          style={[
            localStyle.askedQuestionContainer,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}>
          <Image
            source={images.HelpCenterImage}
            style={localStyle.helpCenterImage}
          />
          <View>
            <CText type={'B14'}>{String.frequentlyAskedQuestion}</CText>
            <CText type={'R10'} color={colors.grayScale500}>
              {String.findAllTheAnswersQuestions}
            </CText>
          </View>
        </TouchableOpacity>
        <CText style={localStyle.communityText} type={'B18'}>
          {String.community}
        </CText>
        <CText type={'R14'} color={colors.grayScale400}>
          {String.helpCenterText}
        </CText>
        <FlatList
          data={searchData}
          renderItem={helpAndCenterDetails}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
          ListFooterComponent={rightBottomIcon}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  activityHeader: {
    height: getHeight(250),
    ...styles.mt10,
  },
  helpCenterTitle: {
    top: moderateScale(50),
    ...styles.ph20,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.mt20,
  },
  askedQuestionContainer: {
    height: moderateScale(96),
    ...styles.flexRow,
    borderRadius: moderateScale(12),
    ...styles.ph20,
    ...styles.itemsCenter,
  },
  helpCenterImage: {
    height: moderateScale(48),
    width: moderateScale(51),
    ...styles.mr15,
  },
  communityText: {
    ...styles.mt20,
  },
  renderItemContainer: {
    height: moderateScale(72),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mv10,
    ...styles.ph10,
    borderWidth: moderateScale(1),
  },
  iconBackground: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
  },
  rightBottomIcon: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(28),
    ...styles.center,
    ...styles.selfEnd,
    ...styles.mt20,
  },
});

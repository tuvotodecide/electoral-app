import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useRef, useState} from 'react';
import {useSelector} from 'react-redux';

// custom import
import {
  deviceHeight,
  deviceWidth,
  getHeight,
  moderateScale,
} from '../common/constants';
import {styles} from '../themes';
import CText from '../components/common/CText';
import {OnBoardingData} from '../api/constant';
import CSafeAreaView from '../components/common/CSafeAreaView';
import CButton from '../components/common/CButton';
import String from '../i18n/String';
import {setOnBoarding} from '../utils/AsyncStorage';
import {AuthNav, StackNav} from '../navigation/NavigationKey';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function OnBoarding({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef(null);

  const _onViewableItemsChanged = useCallback(({viewableItems}) => {
    setCurrentIndex(viewableItems[0]?.index);
  }, []);

  const _onViewabilityConfig = {itemVisiblePercentThreshold: 50};

  const onPressGetStarted = async () => {
    if (currentIndex === 4) {
      await setOnBoarding(true);
      navigation.reset({
        index: 0,
        routes: [{name: StackNav.AuthNavigation}],
      });
    } else {
      slideRef.current._listRef._scrollRef.scrollTo({
        x: deviceWidth * (currentIndex + 1),
      });
    }
  };

  const onPressSkip = () => {
    navigation.navigate(StackNav.AuthNavigation, {screen: AuthNav.Connect});
  };

  const RenderItemData = useCallback(
    ({item, index}) => {
      return (
        <View style={localStyle.container}>
          <ImageBackground
            source={colors.dark ? item.darkImage : item.lightImage}
            style={localStyle.imageStyle}></ImageBackground>
          <View style={localStyle.boardingTextContainer}>
            <CText type={'B24'} style={localStyle.boardingTitleText}>
              {item.title}
            </CText>
            <CText
              type={'R14'}
              numberOfLines={4}
              color={colors.grayScale500}
              style={localStyle.boardingDescriptionText}>
              {item.description}
            </CText>
          </View>
        </View>
      );
    },
    [OnBoardingData],
  );

  return (
    <CSafeAreaView>
      <View style={localStyle.skipWrapper}>
        <TouchableOpacity
          style={[
            localStyle.skipIconContainer,
            {backgroundColor: colors.grayScale400},
          ]}
          onPress={onPressSkip}>
          <Icon name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={OnBoardingData}
        renderItem={({item, index}) => (
          <RenderItemData item={item} index={index} />
        )}
        ref={slideRef}
        showsHorizontalScrollIndicator={false}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        bounces={false}
        onViewableItemsChanged={_onViewableItemsChanged}
        _onViewabilityConfig={_onViewabilityConfig}
        pagingEnabled
      />

      <View style={localStyle.bottomIndicatorContainer}>
        {OnBoardingData.map((_, index) => (
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
      <CButton
        title={String.getStarted}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressGetStarted}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  imageStyle: {
    width: deviceWidth,
    height: deviceHeight - getHeight(390),
  },
  skipContainer: {
    ...styles.selfEnd,
    ...styles.pv10,
    ...styles.ph20,
    ...styles.mh20,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...styles.mt20,
    position: 'absolute',
    top: getHeight(50),
    right: moderateScale(20),
    zIndex: 99,
  },
  container: {
    width: deviceWidth,
  },
  boardingTextContainer: {
    width: '90%',
    ...styles.ph20,
  },
  boardingTitleText: {
    ...styles.mt10,
  },
  boardingDescriptionText: {
    ...styles.mt5,
  },
  bottomIndicatorContainer: {
    ...styles.flexRow,
    ...styles.ml15,
  },
  bottomIndicatorStyle: {
    height: moderateScale(10),
    borderRadius: moderateScale(10),
    ...styles.mh5,
    ...styles.alignStart,
    ...styles.mb20,
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
    ...styles.mb20,
  },
  browseAssetsText: {
    ...styles.mb20,
  },

  skipWrapper: {
    position: 'absolute',
    top: getHeight(50),
    right: moderateScale(20),
    zIndex: 99,
  },

  skipIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.62,
  },
});

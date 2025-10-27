import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useRef, useState} from 'react';
import {useSelector} from 'react-redux';

// custom import
import {deviceWidth, getHeight, moderateScale} from '../common/constants';
import {styles} from '../themes';
import CText from '../components/common/CText';
import {OnBoardingData} from '../api/constant';
import CSafeAreaViewAuth from '../components/common/CSafeAreaViewAuth';
import CButton from '../components/common/CButton';
import String from '../i18n/String';
import {setOnBoarding} from '../utils/AsyncStorage';
import {AuthNav, StackNav} from '../navigation/NavigationKey';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigationLogger} from '../hooks/useNavigationLogger';

export default function OnBoarding({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef(null);

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('OnBoarding', true);

  const _onViewableItemsChanged = useCallback(({viewableItems}) => {
    setCurrentIndex(viewableItems[0]?.index);
  }, []);

  const _onViewabilityConfig = {itemVisiblePercentThreshold: 50};

  const onPressGetStarted = async () => {
    if (currentIndex === 4) {
      await setOnBoarding(true);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: StackNav.AuthNavigation,
            params: {screen: AuthNav.Connect},
          },
        ],
      });
    } else {
      slideRef.current._listRef._scrollRef.scrollTo({
        x: deviceWidth * (currentIndex + 1),
      });
    }
  };

  const onPressSkip = () => {
    navigation.navigate(StackNav.AuthNavigation, {
      screen: AuthNav.Connect,
    });
  };

  const RenderItemData = useCallback(
    ({item, index}) => {
      return (
        <View style={localStyle.container} testID={`onboardingSlide_${index}`}>
          <View style={localStyle.imageContainer} testID={`onboardingSlideImageContainer_${index}`}>
            <Image
              source={colors.dark ? item.darkImage : item.lightImage}
              style={localStyle.imageStyle}
              resizeMode="contain"
              testID={`onboardingSlideImage_${index}`}
            />
          </View>
          <View style={localStyle.boardingTextContainer} testID={`onboardingSlideTextContainer_${index}`}>
            <CText type={'B24'} style={localStyle.boardingTitleText} testID={`onboardingSlideTitle_${index}`}>
              {item.title}
            </CText>
            <CText
              type={'R14'}
              numberOfLines={4}
              color={colors.grayScale500}
              style={localStyle.boardingDescriptionText}
              testID={`onboardingSlideDescription_${index}`}>
              {item.description}
            </CText>
          </View>
        </View>
      );
    },
    [colors.dark, colors.grayScale500],
  );

  return (
    <CSafeAreaViewAuth testID="onboardingContainer">
      <View style={localStyle.skipWrapper} testID="onboardingSkipWrapper">
        <TouchableOpacity
          style={[
            localStyle.skipIconContainer,
            {backgroundColor: colors.grayScale400},
          ]}
          onPress={onPressSkip}
          testID="onboardingSkipButton">
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
        testID="onboardingFlatList"
      />

      <View style={localStyle.bottomIndicatorContainer} testID="onboardingIndicatorContainer">
        {OnBoardingData.map((_, index) => (
          <View
            key={index}
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
            testID={`onboardingIndicator_${index}`}
          />
        ))}
      </View>
      <CButton
        title={String.getStarted}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressGetStarted}
        testID="onboardingGetStartedButton"
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  container: {
    width: deviceWidth,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(20),
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(40),
    paddingTop: moderateScale(60),
    paddingBottom: moderateScale(20),
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    maxWidth: moderateScale(300),
    maxHeight: moderateScale(400),
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
  boardingTextContainer: {
    width: '90%',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  boardingTitleText: {
    textAlign: 'center',
    marginBottom: moderateScale(12),
    lineHeight: moderateScale(32),
  },
  boardingDescriptionText: {
    textAlign: 'center',
    lineHeight: moderateScale(22),
    paddingHorizontal: moderateScale(10),
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.22,
    shadowRadius: 2.62,
  },
});

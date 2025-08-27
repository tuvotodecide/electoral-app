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
import {OnBoardingGuardiansData} from '../api/constant';
import CSafeAreaView from '../components/common/CSafeAreaView';
import CButton from '../components/common/CButton';
import String from '../i18n/String';
import {setOnBoarding} from '../utils/AsyncStorage';
import {AuthNav, StackNav} from '../navigation/NavigationKey';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function OnBoardingGuardians({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef(null);

  const _onViewableItemsChanged = useCallback(({viewableItems}) => {
    setCurrentIndex(viewableItems[0]?.index);
  }, []);

  const _onViewabilityConfig = {itemVisiblePercentThreshold: 50};

  const onPressGetStarted = async () => {
    if (currentIndex === OnBoardingGuardiansData.length - 1) {
      await setOnBoarding(true);
      navigation.goBack();
    } else {
      slideRef.current._listRef._scrollRef.scrollTo({
        x: deviceWidth * (currentIndex + 1),
      });
    }
  };

  const onPressSkip = () => {
    navigation.goBack();
  };

  const RenderItemData = useCallback(
    ({item, index}) => {
      return (
        <View testID={`onboardingGuardiansSlide_${index}`} style={localStyle.container}>
          <ImageBackground
            testID={`onboardingGuardiansImage_${index}`}
            source={colors.dark ? item.darkImage : item.lightImage}
            style={localStyle.imageStyle}></ImageBackground>
          <View testID={`onboardingGuardiansTextContainer_${index}`} style={localStyle.boardingTextContainer}>
            <CText testID={`onboardingGuardiansTitle_${index}`} type={'B24'} style={localStyle.boardingTitleText}>
              {item.title}
            </CText>
            <CText
              testID={`onboardingGuardiansDescription_${index}`}
              type={'R16'}
              numberOfLines={4}
              color={colors.grayScale500}
              style={localStyle.boardingDescriptionText}>
              {item.description}
            </CText>
          </View>
        </View>
      );
    },
    [OnBoardingGuardiansData],
  );

  return (
    <CSafeAreaView testID="onboardingGuardiansContainer">
      <View testID="onboardingGuardiansSkipWrapper" style={localStyle.skipWrapper}>
        <TouchableOpacity
          testID="onboardingGuardiansSkipButton"
          style={[
            localStyle.skipIconContainer,
            {backgroundColor: colors.grayScale400},
          ]}
          onPress={onPressSkip}>
          <Icon testID="onboardingGuardiansSkipIcon" name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      <FlatList
        testID="onboardingGuardiansFlatList"
        data={OnBoardingGuardiansData}
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

      <View testID="onboardingGuardiansIndicatorContainer" style={localStyle.bottomIndicatorContainer}>
        {OnBoardingGuardiansData.map((item, index) => (
          <View
            testID={`onboardingGuardiansIndicator_${index}`}
            key={item.id.toString()}
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
        testID="onboardingGuardiansGetStartedButton"
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
    width: '100%',
    ...styles.ph20,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

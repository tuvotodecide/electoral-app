import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import {styles} from '../../../../themes';
import {
  deviceWidth,
  getHeight,
  moderateScale,
} from '../../../../common/constants';
import {useSelector} from 'react-redux';
import images from '../../../../assets/images';
import {BuyGoldData, LatestNewsGoldData} from '../../../../api/constant';
import {StackNav} from '../../../../navigation/NavigationKey';
import {useNavigation} from '@react-navigation/native';

export default function GoldScreen() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const buyGoldCategory = ({item, index}) => {
    return (
      <View>
        <TouchableOpacity
          style={[
            localStyle.buyGoldCategory,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}>
          {item.svgIcon}
        </TouchableOpacity>
        <CText
          type={'B12'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.countryName}>
          {item.title}
        </CText>
      </View>
    );
  };
  const onPressGoldDetails = () => {
    navigation.navigate(StackNav.GoldDetails);
  };
  const latestNews = ({item, index}) => {
    return (
      <View>
        <View style={localStyle.newsContainer}>
          <View style={[styles.flex, styles.flexRow]}>
            <Image source={item.image} style={localStyle.newsImage} />
            <View>
              <CText type={'B14'} numOfLines={2} style={localStyle.newsText}>
                {item.title}
              </CText>
              <View style={localStyle.timeAndIconContainer}>
                <View style={[styles.rowCenter, styles.mt15]}>
                  <CText
                    type={'S10'}
                    color={colors.grayScale500}
                    style={localStyle.newsTypeText}>
                    {item.newsType}
                  </CText>
                  <View
                    style={[
                      localStyle.dotStyle,
                      {backgroundColor: colors.grayScale500},
                    ]}
                  />
                  <CText
                    type={'S10'}
                    color={colors.grayScale500}
                    style={styles.ml5}>
                    {item.time}
                  </CText>
                </View>
              </View>
            </View>
          </View>
          <Ionicons
            name={'ellipsis-horizontal-outline'}
            size={moderateScale(18)}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={styles.selfEnd}
          />
        </View>

        <View
          style={[
            localStyle.lineStyle,
            {
              backgroundColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}
        />
      </View>
    );
  };

  return (
    <View>
      <CText type={'B16'}>{String.goldPrice}</CText>
      <TouchableOpacity
        onPress={onPressGoldDetails}
        style={[
          localStyle.goldContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={localStyle.imageAndTitleContainer}>
          <Image source={images.GoldImage} style={localStyle.goldImage} />
          <View>
            <CText type={'B14'}>{String.gold}</CText>
            <CText
              type={'R12'}
              color={colors.grayScale500}
              style={localStyle.valueText}>
              {String.gold}
            </CText>
          </View>
        </View>
        <View>
          <CText type={'B14'}>{'$87,65.00'}</CText>
          <View style={styles.rowCenter}>
            <Ionicons
              name={'arrow-up-circle-outline'}
              color={colors.grayScale500}
              size={moderateScale(12)}
              style={styles.mr5}
            />
            <CText
              type={'R12'}
              color={colors.grayScale500}
              style={localStyle.valueText}>
              {'0.00%'}
            </CText>
          </View>
        </View>
      </TouchableOpacity>
      <View style={localStyle.buyGoldContainer}>
        <CText type={'B16'}>{String.buyGoldIn}</CText>
        <TouchableOpacity>
          <CText type={'M14'} color={colors.primary}>
            {String.seeAll}
          </CText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={BuyGoldData}
        renderItem={buyGoldCategory}
        showsHorizontalScrollIndicator={false}
        horizontal
        bounces={false}
        keyExtractor={(item, index) => index.toString()}
        estimatedItemSize={5}
      />
      <View style={localStyle.buyGoldContainer}>
        <CText type={'B16'}>{String.latestNews}</CText>
        <TouchableOpacity>
          <CText type={'M14'} color={colors.primary}>
            {String.seeAll}
          </CText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={LatestNewsGoldData}
        renderItem={latestNews}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        bounce={false}
      />
    </View>
  );
}

const localStyle = StyleSheet.create({
  goldContainer: {
    height: moderateScale(78),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.rowSpaceBetween,
    ...styles.p10,
    width: deviceWidth - moderateScale(40),
    ...styles.selfCenter,
    ...styles.mt20,
  },
  imageAndTitleContainer: {
    ...styles.flexRow,
  },
  goldImage: {
    width: moderateScale(40),
    height: moderateScale(40),
    ...styles.mr10,
  },
  valueText: {
    ...styles.mt5,
  },
  buyGoldContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  buyGoldCategory: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(56 / 2),
    ...styles.center,
    ...styles.mh15,
    ...styles.mt20,
  },
  countryName: {
    ...styles.mt10,
  },
  ewsContainer: {
    ...styles.flexRow,
    ...styles.mv20,
  },
  newsContainer: {
    ...styles.flexRow,
    ...styles.mv20,
  },
  newsImage: {
    width: moderateScale(84),
    height: moderateScale(68),
    borderRadius: moderateScale(8),
  },
  timeAndIconContainer: {
    ...styles.rowSpaceBetween,
    width: '60%',
  },
  newsText: {
    ...styles.ml10,
    width: '60%',
  },
  newsTypeText: {
    ...styles.ml10,
  },
  dotStyle: {
    height: moderateScale(4),
    width: moderateScale(4),
    borderRadius: moderateScale(4),
    ...styles.mh5,
  },
  lineStyle: {
    height: getHeight(1),
    width: '100%',
  },
});

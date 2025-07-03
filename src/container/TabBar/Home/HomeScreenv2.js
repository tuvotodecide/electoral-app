import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {styles} from '../../../themes';
import {Splash_Light} from '../../../assets/svg';
import {deviceWidth, getHeight, moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {useSelector} from 'react-redux';
import {
  CardData,
  LatestNewsData,
  TopGrainersData,
  WatchlistData,
  financialCategoryData,
} from '../../../api/constant';
import images from '../../../assets/images';
import {StackNav} from '../../../navigation/NavigationKey';

export default function HomeScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState('');

  const onPressCategory = item => {
    setIsSelect(item);
  };
  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route);
    }
  };

  const onPressNotification = () => {
    navigation.navigate(StackNav.Notification);
  };
  const onPressWatchListCategory = item => {
    navigation.navigate(StackNav.WatchListHomeCard, {item: item});
  };

  const onPressTopGrainersItem = item => {
    navigation.navigate(StackNav.TopGrainers, {item: item});
  };

  const financialCategory = ({item, index}) => {
    return (
      <View>
        <TouchableOpacity
          onPress={() => onPressItem(item)}
          style={[
            localStyle.financialContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          {item.svgIcon}
        </TouchableOpacity>
        <CText
          type={'B12'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.financialTextStyle}>
          {item.titleName}
        </CText>
      </View>
    );
  };

  const watchList = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressCategory(item.name)}
        style={[
          localStyle.watchListStyle,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
            backgroundColor: isSelect.includes(item.name)
              ? colors.primary
              : colors.backgroundColor,
          },
        ]}>
        <CText
          type={' B10'}
          color={
            isSelect === isSelect.includes(item.name)
              ? colors.white
              : colors.grayScale400
          }>
          {item.name}
        </CText>
      </TouchableOpacity>
    );
  };
  const card = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressWatchListCategory(item)}
        style={[
          localStyle.cardContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={localStyle.imageAndBankNameContainer}>
          <Image source={item.image} style={localStyle.cardImage} />

          <View style={localStyle.bankNameContainer}>
            <CText type={'B14'}>{item.cardName}</CText>
            <CText type={'R10'} color={colors.grayScale500}>
              {item.bankName}
            </CText>
          </View>
        </View>
        <View style={localStyle.chartAndProfitContainer}>
          <View>
            <CText type={'B14'}>{item.amount}</CText>
            <View style={localStyle.imageAndBankNameContainer}>
              {item.upArrow ? (
                <Ionicons
                  name={'arrow-up-circle-outline'}
                  color={colors.green}
                  size={moderateScale(20)}
                  style={localStyle.iconStyle}
                />
              ) : (
                <Ionicons
                  name={'arrow-down-circle-outline'}
                  color={colors.alertColor}
                  size={moderateScale(20)}
                  style={localStyle.iconStyle}
                />
              )}
              <CText
                type={'S12'}
                color={item.upArrow ? colors.green : colors.alertColor}>
                {item.profit}
              </CText>
            </View>
          </View>
          <Image source={item.chartImage} style={localStyle.chartImage} />
        </View>
      </TouchableOpacity>
    );
  };

  const topGrainers = ({item, indx}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressTopGrainersItem(item)}
        style={[
          localStyle.grainersContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.flexRow}>
          <Image source={item.image} style={localStyle.grainerImage} />
          <View style={localStyle.grainerTitleText}>
            <CText type={'B14'}>{item.title}</CText>
            <CText type={'R10'} color={colors.grayScale500}>
              {item.description}
            </CText>
          </View>
        </View>
        <View style={localStyle.grainerProfitContainer}>
          <CText type={'B12'}>{item.amount}</CText>
          <View style={styles.flexRow}>
            <Ionicons
              name={'arrow-up-circle-outline'}
              color={colors.green}
              size={moderateScale(14)}
              style={localStyle.iconStyle}
            />
            <CText type={'S10'} color={colors.green}>
              {item.profit}
            </CText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const latestNews = ({item, index}) => {
    return (
      <View>
        <View style={localStyle.newsContainer}>
          <Image source={item.image} style={localStyle.newsImage} />
          <View style={styles.flex}>
            <CText type={'B14'} numOfLines={2} style={localStyle.newsText}>
              {item.title}
            </CText>
            <View style={localStyle.timeAndIconContainer}>
              <View style={styles.rowCenter}>
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
              <Icons
                name={'dots-horizontal'}
                size={moderateScale(14)}
                color={colors.dark ? colors.grayScale500 : colors.grayScale400}
              />
            </View>
          </View>
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
    <CSafeAreaView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
        contentContainerStyle={localStyle.mainContainer}>
        <View style={localStyle.headerContainer}>
          <View style={localStyle.headerInnerContainer}>
            <Splash_Light
              height={moderateScale(24)}
              width={moderateScale(24)}
            />
            <CText type={'B16'} style={localStyle.financialText}>
              {String.financial}
            </CText>
          </View>
          <View style={localStyle.headerInnerContainer}>
            <TouchableOpacity>
              <Ionicons
                name={'search'}
                size={moderateScale(24)}
                color={colors.grayScale500}
                style={styles.mr10}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onPressNotification}>
              <Ionicons
                name={'notifications-outline'}
                size={moderateScale(24)}
                color={colors.grayScale500}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={[
            localStyle.assetAndProfitContainer,
            {
              backgroundColor: colors.dark
                ? colors.inputBackground
                : colors.black,
            },
          ]}>
          <CText type={'R14'} color={colors.grayScale400}>
            {String.totalAssetValue}
          </CText>

          <View style={[localStyle.assetContainer, {gap: moderateScale(10)}]}>
            <CText type={'B32'} color={colors.white}>
              {'$56,890.00'}
            </CText>
            <Ionicons
              name={'eye-outline'}
              size={moderateScale(24)}
              color={colors.grayScale400}
            />
          </View>
          <CText
            type={'R10'}
            color={colors.grayScale400}
            style={localStyle.profitText}>
            {String.profits}
          </CText>
          <View style={localStyle.profitContainer}>
            <CText type={'M14'} color={colors.white}>
              {'$16,988.0'}
            </CText>
            <TouchableOpacity
              style={[localStyle.profitBtn, {backgroundColor: colors.green}]}>
              <Ionicons
                name={'arrow-up-circle-outline'}
                color={colors.white}
                size={moderateScale(24)}
              />
              <CText color={colors.white}>{'23.00%'}</CText>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={financialCategoryData}
          renderItem={financialCategory}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          bounces={false}
          showsHorizontalScrollIndicator={false}
        />
        <View style={localStyle.watchListContainer}>
          <CText type={'B16'}>{String.watchList}</CText>
          <TouchableOpacity>
            <CText type={'B16'} color={colors.primary}>
              {String.editWatchList}
            </CText>
          </TouchableOpacity>
        </View>
        <FlatList
          data={WatchlistData}
          renderItem={watchList}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.id}
          bounces={false}
        />
        <FlatList
          data={CardData}
          renderItem={card}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
        />
        <View style={localStyle.grainersHeader}>
          <View style={styles.flexRow}>
            <CText type={'B16'}>{String.topGainers}</CText>
            <Ionicons
              name={'chevron-down-outline'}
              size={moderateScale(16)}
              color={colors.grayScale500}
              style={localStyle.dropDownIcon}
            />
          </View>
          <TouchableOpacity>
            <CText type={'S12'} color={colors.primary}>
              {String.seeAll}
            </CText>
          </TouchableOpacity>
        </View>
        <FlatList
          data={TopGrainersData}
          renderItem={topGrainers}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          bounces={false}
        />
        <Image source={images.BannerImage} style={localStyle.BannerImage} />
        <View style={localStyle.grainersHeader}>
          <CText type={'B16'}>{String.latestNews}</CText>

          <TouchableOpacity>
            <CText type={'S12'} color={colors.primary}>
              {String.seeAll}
            </CText>
          </TouchableOpacity>
        </View>
        <FlatList
          data={LatestNewsData}
          renderItem={latestNews}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          bounce={false}
        />
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.pb20,
  },
  headerContainer: {
    ...styles.rowSpaceBetween,
  },
  headerInnerContainer: {
    ...styles.flexRow,
  },
  financialText: {
    ...styles.ml10,
    marginTop: moderateScale(3),
  },
  assetAndProfitContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt20,
    ...styles.ph10,
    ...styles.pv20,
  },

  profitText: {
    ...styles.mt20,
  },
  profitContainer: {
    ...styles.rowSpaceBetween,
  },
  profitBtn: {
    height: moderateScale(30),
    width: moderateScale(75),
    borderRadius: moderateScale(15),
    ...styles.rowSpaceBetween,
    ...styles.ph10,
    ...styles.center,
  },
  financialContainer: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(56 / 2),
    ...styles.center,
    ...styles.mh15,
    borderWidth: moderateScale(1),
    ...styles.mt20,
  },
  financialTextStyle: {
    ...styles.mt10,
  },
  watchListContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  watchListStyle: {
    ...styles.mr10,
    ...styles.ph10,
    ...styles.center,
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    ...styles.mt15,
  },
  cardContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt20,
    ...styles.ph20,
    ...styles.pv20,
    ...styles.mr20,
    borderWidth: moderateScale(1),
  },
  imageAndBankNameContainer: {
    ...styles.flexRow,
  },
  chartAndProfitContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
  },
  cardImage: {
    height: moderateScale(40),
    width: moderateScale(40),
  },
  chartImage: {
    height: moderateScale(38),
    width: moderateScale(97),
    ...styles.ml20,
  },
  iconStyle: {
    ...styles.mr5,
  },
  bankNameContainer: {
    ...styles.ml10,
    marginTop: moderateScale(3),
  },
  grainersContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt20,
    ...styles.ph10,
    ...styles.p20,
    ...styles.mr20,
    borderWidth: moderateScale(1),
    width: moderateScale(145),
    height: moderateScale(100),
  },
  grainersHeader: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  dropDownIcon: {
    ...styles.ml5,
    ...styles.mt5,
  },
  grainerImage: {
    width: moderateScale(32),
    height: moderateScale(32),
  },
  grainerTitleText: {
    ...styles.ml10,
  },
  grainerProfitContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  BannerImage: {
    width: deviceWidth - moderateScale(25),
    borderRadius: moderateScale(12),
    ...styles.mt20,
    ...styles.selfCenter,
    height: moderateScale(124),
    ...styles.mb10,
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
  },
  newsText: {
    ...styles.ml10,
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
  assetContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mt10,
  },
});

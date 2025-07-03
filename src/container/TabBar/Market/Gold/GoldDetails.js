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
import {
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryTheme,
} from 'victory-native';
// import {LineChart} from 'react-native-chart-kit';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import {useSelector} from 'react-redux';
import {styles} from '../../../../themes';
import {History_Light, Notification_Light} from '../../../../assets/svg';
import {deviceWidth, moderateScale} from '../../../../common/constants';
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import images from '../../../../assets/images';
import {
  GoldTimeDetails,
  MoreWithGoldData,
  SampleDataGold,
  marketOverViewGoldData,
} from '../../../../api/constant';
import CButton from '../../../../components/common/CButton';
import {StackNav} from '../../../../navigation/NavigationKey';
import {VictoryClipContainer} from 'victory';

export default function GoldDetails({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(GoldTimeDetails);

  const onPressCategory = item => {
    setIsSelect(item.time);
  };
  const onPressHistoryIcon = () => {
    navigation.navigate(StackNav.GoldHistory);
  };
  const RightIcons = () => {
    return (
      <View style={localStyle.headerIconsContainer}>
        <TouchableOpacity style={localStyle.headerIcon}>
          {<Notification_Light />}
        </TouchableOpacity>
        <TouchableOpacity
          style={localStyle.headerIcon}
          onPress={onPressHistoryIcon}>
          {<History_Light />}
        </TouchableOpacity>
        <TouchableOpacity style={localStyle.headerIcon}>
          <Ionicons
            name={'star-outline'}
            color={colors.grayScale400}
            size={moderateScale(20)}
          />
        </TouchableOpacity>
      </View>
    );
  };
  const onPressItem = item => {
    if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const MoreWithGold = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        style={localStyle.moreWithGold}
        onPress={() => onPressItem(item)}>
        {item.svgIcon}

        <CText
          type={'S12'}
          color={colors.grayScale500}
          style={localStyle.moreWithGoldText}>
          {item.title}
        </CText>
      </TouchableOpacity>
    );
  };
  const MarketOverView = ({item, index}) => {
    return (
      <View key={index}>
        <View style={localStyle.marketOverViewContainer}>
          <CText type={'R14'} color={colors.grayScale500}>
            {item.title}
          </CText>
          <CText type={'M14'}>{item.value}</CText>
        </View>
        <View
          style={[
            localStyle.lineView,
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
  const timeDetails = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => onPressCategory(item)}
        style={[
          localStyle.watchListStyle,
          {
            backgroundColor:
              isSelect === item.time ? colors.primary : colors.backgroundColor,
            borderColor: item.svgIcon
              ? colors.grayScale700
              : colors.backgroundColor,
          },
        ]}>
        <CText
          type={' B10'}
          color={
            isSelect === item.time
              ? colors.white
              : colors.dark
              ? colors.grayScale400
              : colors.grayScale500
          }>
          {item.time}
        </CText>
      </TouchableOpacity>
    );
  };
  const onPressBuyGold = () => {
    navigation.navigate(StackNav.BuyGold);
  };

  return (
    <CSafeAreaView>
      <CHeader rightIcon={<RightIcons />} />
      <ScrollView
        contentContainerStyle={localStyle.mainViewContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={localStyle.headerGoldDetails}>
          <View>
            <CText type={'S12'} color={colors.grayScale500}>
              {String.gold}
            </CText>
            <CText type={'B32'}>{'$87,65.00'}</CText>
            <View style={localStyle.profitAndYearContainer}>
              <Ionicons
                name={'arrow-up-circle-outline'}
                color={colors.green}
                size={moderateScale(20)}
              />
              <CText type={'S12'} color={colors.green}>
                {'0.35% (+1.50%) '}
              </CText>
              <CText type={'R12'} color={colors.grayScale500}>
                {String.pastYears}
              </CText>
            </View>
          </View>
          <Image source={images.GoldImage} style={localStyle.GoldImage} />
        </View>
        <View>
          <VictoryChart
            // theme={VictoryTheme.material}
            padding={{top: 40, bottom: 80, left: 40, right: 80}}>
            <VictoryLine
              data={SampleDataGold}
              samples={25}
              width={deviceWidth - moderateScale(40)}
              style={{
                data: {stroke: colors.green},
                parent: {border: '1px solid #ccc'},
              }}
              labels={({datum}) => `${datum.date}: ${datum.label}`}
              labelComponent={<VictoryLabel dy={-10} />}
              x="date"
              y="label"
            />
          </VictoryChart>
        </View>

        <FlatList
          data={GoldTimeDetails}
          renderItem={timeDetails}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.id}
          bounces={false}
        />
        <CText type={'B16'} style={localStyle.moreWithGoldText}>
          {String.doMoreWithGold}
        </CText>
        <View
          style={[
            localStyle.moreWithGoldContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          {MoreWithGoldData.map((item, index) => {
            return <MoreWithGold item={item} />;
          })}
        </View>
        <CText type={'B16'} style={localStyle.moreWithGoldText}>
          {String.aboutGold}
        </CText>
        <CText
          type={'R14'}
          style={localStyle.moreWithGoldText}
          color={colors.grayScale500}>
          {String.aboutGoldText}
        </CText>
        <TouchableOpacity>
          <CText
            type={'B14'}
            color={colors.primary}
            style={localStyle.viewMoreText}>
            {String.viewMore}
          </CText>
        </TouchableOpacity>
        <CText type={'B16'} style={localStyle.moreWithGoldText}>
          {String.marketOverview}
        </CText>
        {marketOverViewGoldData.map((item, index) => {
          return <MarketOverView item={item} />;
        })}
        <CButton title={String.buyGold} type={'B16'} onPress={onPressBuyGold} />
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  headerIconsContainer: {
    ...styles.rowSpaceBetween,
  },
  headerIcon: {
    ...styles.mr10,
  },
  mainViewContainer: {
    ...styles.ph20,
  },
  headerGoldDetails: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
  },
  profitAndYearContainer: {
    ...styles.rowCenter,
  },
  GoldImage: {
    width: moderateScale(56),
    height: moderateScale(56),
  },
  moreWithGoldText: {
    ...styles.mt10,
  },
  moreWithGoldContainer: {
    ...styles.p10,
    borderRadius: moderateScale(12),
    height: moderateScale(97),
    borderWidth: moderateScale(1),
    ...styles.rowSpaceBetween,
    ...styles.mt10,
  },
  moreWithGold: {
    ...styles.mh10,
    ...styles.center,
  },
  viewMoreText: {
    ...styles.mt15,
  },
  marketOverViewContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt10,
  },
  lineView: {
    width: '100%',
    height: moderateScale(1),
    ...styles.mv10,
  },
  watchListStyle: {
    ...styles.ph10,
    ...styles.center,
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    ...styles.mt15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.mh10,
  },
});

import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/EvilIcons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import {StackNav} from '../../../../navigation/NavigationKey';
import {
  CandleChartDetails,
  CryptoChartData,
  CryptoTimeDetails,
  MarketStockData,
} from '../../../../api/constant';
import {deviceWidth, moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import {
  Notification_Dark,
  Notification_Light,
  ChartLine_Light,
  Tab_Light,
} from '../../../../assets/svg';
import CButton from '../../../../components/common/CButton';
import {
  VictoryCandlestick,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
} from 'victory-native';

export default function DetailsStock({route, navigation}) {
  const item = route?.params?.item;

  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(CryptoTimeDetails);
  const [selectChart, setSelectChart] = useState(false);

  const onPressBuy = () => {
    navigation.navigate(StackNav.BuyStock);
  };
  const onPressSell = () => {
    navigation.navigate(StackNav.SellStock);
  };

  const onPressCategory = item => {
    setIsSelect(item.time);
  };
  const onPressChart = () => {
    setSelectChart(!selectChart);
  };
  const RightIcon = () => {
    return (
      <View style={localStyle.iconContainer}>
        <TouchableOpacity>
          {colors.dark ? <Notification_Dark /> : <Notification_Light />}
        </TouchableOpacity>
        <TouchableOpacity>
          <Icons
            name={'dots-vertical'}
            size={moderateScale(24)}
            color={colors.dark ? colors.textColor : colors.grayScale400}
          />
        </TouchableOpacity>
      </View>
    );
  };
  const timeDetails = ({item, index}) => {
    return (
      <TouchableOpacity
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
        {item.time ? (
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
        ) : (
          <TouchableOpacity onPress={onPressStatusBar}>
            {item.chartIcon}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const marketStatic = ({item, index}) => {
    return (
      <View>
        <View style={localStyle.marketContainer}>
          <CText type={'R12'} color={colors.grayScale500}>
            {item.title}
          </CText>
          <CText type={'S12'}>{item.value}</CText>
        </View>
        <View
          style={[
            localStyle.lineStyle,
            {
              backgroundColor: colors.dark
                ? colors.grayScale500
                : colors.grayScale200,
            },
          ]}
        />
      </View>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={item.name} rightIcon={<RightIcon />} />
      <ScrollView
        contentContainerStyle={localStyle.mainContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <CText
          type={'R12'}
          color={colors.grayScale400}
          align={'center'}
          style={localStyle.headerText}>
          {item.title}
        </CText>
        <CText type={'B40'} align={'center'} style={localStyle.amountStyle}>
          {item.amount}
        </CText>
        <TouchableOpacity
          style={[localStyle.profitBtn, {backgroundColor: colors.green}]}>
          <Ionicons
            name={'arrow-up-circle-outline'}
            color={colors.white}
            size={moderateScale(24)}
          />
          <CText color={colors.white}>{'0.54%'}</CText>
          <CText color={colors.white}>{'(+50%)'}</CText>
        </TouchableOpacity>
        <View>
          {selectChart === false ? (
            <VictoryLine
              data={CryptoChartData}
              width={deviceWidth - moderateScale(20)}
              style={{
                data: {stroke: colors.green},
                parent: {border: '1px solid #ccc'},
              }}
              x="date"
              y="label"
            />
          ) : (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={{x: 25}}
              width={deviceWidth}>
              <VictoryCandlestick
                candleRatio={0.8}
                candleWidth={5}
                candleColors={{
                  positive: colors.green,
                  negative: colors.alertColor,
                }}
                data={CandleChartDetails}
                x={'title'}
                y={'value'}
              />
            </VictoryChart>
          )}
        </View>
        <View style={styles.flexRow}>
          <FlatList
            data={CryptoTimeDetails}
            renderItem={timeDetails}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item.id}
            bounces={false}
          />
          <TouchableOpacity
            style={[
              localStyle.chartBg,

              {
                borderColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale200,
              },
            ]}
            onPress={onPressChart}>
            {selectChart === false ? <Tab_Light /> : <ChartLine_Light />}
          </TouchableOpacity>
        </View>
        <View style={localStyle.headerContainer}>
          <CText type={'B16'}>{String.marketStatistics}</CText>
          <Icon
            name={'question'}
            size={moderateScale(24)}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={localStyle.iconStyle}
          />
        </View>
        <FlatList
          data={MarketStockData}
          renderItem={marketStatic}
          key={2}
          numColumns={2}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mb15}
        />
        <View style={localStyle.btnContainer}>
          <CButton
            title={String.buy}
            onPress={onPressBuy}
            type={'B16'}
            containerStyle={localStyle.sellAndBuyBtn}
            bgColor={colors.green}
          />
          <CButton
            title={String.sell}
            onPress={onPressSell}
            type={'B16'}
            containerStyle={localStyle.sellAndBuyBtn}
            bgColor={colors.alertColor}
          />
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  iconContainer: {
    ...styles.flexRow,
    ...styles.center,
  },
  headerText: {
    ...styles.mr10,
  },
  amountStyle: {
    ...styles.mt10,
  },
  profitBtn: {
    height: moderateScale(30),
    width: moderateScale(130),
    borderRadius: moderateScale(15),
    ...styles.rowSpaceBetween,
    ...styles.ph10,
    ...styles.selfCenter,
  },
  cryptoChartImage: {
    width: deviceWidth,
    ...styles.selfCenter,
    height: '37%',
  },
  watchListStyle: {
    ...styles.ph10,
    ...styles.center,
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    ...styles.mt15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
  },
  btnStyle: {
    ...styles.mb30,
    ...styles.mt0,
  },
  headerContainer: {
    ...styles.mt20,
    ...styles.flexRow,
  },
  iconStyle: {
    ...styles.ml5,
  },
  marketContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mh10,
    ...styles.mv20,
    width: deviceWidth / 2.6,
  },
  lineStyle: {
    height: moderateScale(1),
    ...styles.mh10,
  },
  btnContainer: {
    ...styles.flexRow,
    ...styles.center,
  },
  mainContainer: {
    ...styles.ph20,
  },
  chartBg: {
    ...styles.ph10,
    ...styles.center,
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    ...styles.mt15,
    borderWidth: moderateScale(1),
  },
  sellAndBuyBtn: {
    width: '45%',
    ...styles.ml10,
  },
});

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

// custom import
import {useSelector} from 'react-redux';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {styles} from '../../../themes';
import {
  History_Dark,
  History_Light,
  LineChartIcon_Dark,
  LineChartIcon_Light,
  Portfolio_Dark,
} from '../../../assets/svg';
import {deviceWidth, moderateScale} from '../../../common/constants';
import {VictoryPie} from 'victory-native';
import CText from '../../../components/common/CText';
import {
  PieChartPortfolioData,
  PortTransactionHistory,
  PurchaseSendReceive,
} from '../../../api/constant';
import CButton from '../../../components/common/CButton';
import {StackNav} from '../../../navigation/NavigationKey';
import GroupedBarGraph from './Chart';

export default function HistoryTransactionDetails({route, navigation}) {
  const items = route?.params?.item;
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(false);

  const onPressSelect = () => {
    setIsSelect(!isSelect);
  };
  const onPressPreviewReport = item => {
    navigation.navigate(StackNav.HistoryReport, {items: items});
  };
  const RightIcons = () => {
    return (
      <View style={localStyle.headerIcons}>
        <TouchableOpacity onPress={onPressSelect} style={styles.mr10}>
          {isSelect === false ? (
            colors.dark ? (
              <LineChartIcon_Dark />
            ) : (
              <LineChartIcon_Light />
            )
          ) : (
            <Portfolio_Dark />
          )}
        </TouchableOpacity>
        <TouchableOpacity>
          {colors.dark ? <History_Dark /> : <History_Light />}
        </TouchableOpacity>
      </View>
    );
  };
  const RenderChartData = ({item, index}) => {
    return (
      <View
        key={index}
        style={[
          localStyle.chartDataContainer,

          {
            backgroundColor:
              isSelect === false ? colors.inputBackground : colors.bac,
            marginHorizontal:
              isSelect === false ? moderateScale(10) : moderateScale(25),
          },
        ]}>
        <View
          style={[
            localStyle.dotStyle,
            {
              backgroundColor:
                item.x === String.buy
                  ? colors.primary
                  : item.x === String.send
                  ? colors.green
                  : colors.blue,
            },
          ]}
        />
        <CText type={'B10'} style={styles.mh5}>
          {item.x}
        </CText>
        <CText
          type={'B10'}
          color={colors.dark ? colors.grayScale500 : colors.grayScale400}>
          {item.y}
        </CText>
      </View>
    );
  };
  const renderData = ({item, index}) => {
    return (
      <TouchableOpacity
        style={[
          localStyle.portfolioHistoryContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.rowCenter}>
          <Image
            source={item.image ? item.image : items.image}
            style={localStyle.livePriceImage}
          />
          <View style={localStyle.titleText}>
            <CText type={'B14'}>{item.label ? item.label : items.label}</CText>
            <CText type={'R12'} color={colors.grayScale500}>
              {item.time ? item.time : item.date + items.time}
            </CText>
          </View>
        </View>
        <View>
          <CText
            type={'B14'}
            style={styles.selfEnd}
            color={
              item.profit
                ? colors.textColor
                : items.loss
                ? colors.alertColor
                : colors.textColor
            }>
            {item.profit
              ? item.profit
              : items.profit
              ? items.profit
              : items.loss}
          </CText>
          <CText
            type={'R12'}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={localStyle.profitAndLossText}>
            {item.value ? item.value : items.value}
          </CText>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.details} rightIcon={<RightIcons />} />
      <ScrollView
        style={localStyle.mainContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        {isSelect === false ? (
          <View
            style={[
              localStyle.pieChartContainer,
              {
                borderColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale200,
              },
            ]}>
            <VictoryPie
              width={deviceWidth}
              height={350}
              padAngle={({datum}) => datum.z}
              innerRadius={85}
              data={PieChartPortfolioData}
              cornerRadius={6}
              colorScale={[colors.blue, colors.green, colors.primary]}
             style={{labels : {fill  : colors.dak ? colors.black : colors.white}}}
          
            />
            <View style={localStyle.pieChartText}>
              <CText type={'B14'}>{'$1,590.00'}</CText>
              <CText
                type={'R10'}
                color={colors.grayScale500}
                style={styles.mt5}>
                {String.totalSpent}
              </CText>
            </View>
            <View style={{flexDirection: 'row'}}>
              {PieChartPortfolioData.map((item, index) => {
                return <RenderChartData item={item} />;
              })}
            </View>
          </View>
        ) : (
          <View style={localStyle.lineChartContainer}>
            <CText
              type={'r14'}
              color={colors.dark ? colors.grayScale500 : colors.grayScale400}>
              {String.totalSpent}
            </CText>
            <View style={localStyle.amountAndTimeContainer}>
              <CText type={'B32'}>{'$1,590.00'}</CText>
              <View
                style={[
                  localStyle.timeContainer,
                  {
                    borderColor: colors.dark
                      ? colors.grayScale700
                      : colors.grayScale200,
                  },
                ]}>
                <CText type={'S10'} color={colors.grayScale500}>
                  {String.month}
                </CText>
                <Ionicons
                  name={'chevron-down-outline'}
                  size={moderateScale(14)}
                  color={colors.grayScale500}
                />
              </View>
            </View>
            <GroupedBarGraph />
            <View style={{flexDirection: 'row'}}>
              {PurchaseSendReceive.map((item, index) => {
                return <RenderChartData item={item} />;
              })}
            </View>
          </View>
        )}
        <CText style={localStyle.headerText} type={'B16'}>
          {String.history}
        </CText>
        <FlatList
          data={PortTransactionHistory}
          renderItem={renderData}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
        />
        <CButton
          title={String.previewHistoryReport}
          type={'B16'}
          onPress={onPressPreviewReport}
        />
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  headerIcons: {
    ...styles.rowCenter,
  },
  mainContainer: {
    ...styles.ph20,
  },
  pieChartContainer: {
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.pv20,
    ...styles.center,
  },
  pieChartText: {
    top: moderateScale(-170),
  },
  chartDataContainer: {
    height: moderateScale(32),
    borderRadius: moderateScale(6),
    ...styles.rowCenter,
    ...styles.p10,
  },
  dotStyle: {
    height: moderateScale(6),
    width: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  headerText: {
    ...styles.mt20,
  },
  portfolioHistoryContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt15,
    ...styles.ph10,
    ...styles.pv15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.rowSpaceBetween,
    width: deviceWidth - moderateScale(40),
  },

  livePriceImage: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  titleText: {
    ...styles.ml10,
  },
  profitAndLossText: {
    ...styles.mt2,
  },
  lineChartContainer: {
    ...styles.mt20,
  },
  amountAndTimeContainer: {
    ...styles.rowSpaceBetween,
  },
  timeContainer: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    ...styles.rowCenter,
    height: moderateScale(24),
    ...styles.ph10,
  },
});

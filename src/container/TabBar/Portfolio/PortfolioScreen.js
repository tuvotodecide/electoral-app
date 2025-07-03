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
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {useSelector} from 'react-redux';
import {History_Dark, History_Light} from '../../../assets/svg';
import CText from '../../../components/common/CText';
import {styles} from '../../../themes';
import {
  deviceWidth,
  getHeight,
  getWidth,
  moderateScale,
} from '../../../common/constants';
import {
  OverViewPortfolio,
  PortfolioChartData,
  SampleDataGold,
} from '../../../api/constant';
import CButton from '../../../components/common/CButton';
import {StackNav} from '../../../navigation/NavigationKey';
import {
  Scale,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryTheme,
  VictoryVoronoiContainer,
} from 'victory-native';
import images from '../../../assets/images';

export default function PortfolioScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState('');

  const onPressItem = item => {
    setIsSelect(item);
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity onPress={onPressHistory}>
        {colors.dark ? <History_Dark /> : <History_Light />}
      </TouchableOpacity>
    );
  };

  const onPressHistory = () => {
    navigation.navigate(StackNav.PortfolioHistory);
  };

  const renderDurationItem = ({item, index}) => {
    return (
      <View style={localStyle.renderItemContainer}>
        <TouchableOpacity
          onPress={() => onPressItem(item)}
          key={index}
          style={[
            localStyle.amountContainer,
            {
              backgroundColor:
                isSelect === item
                  ? colors.inputBackground
                  : colors.backgroundColor,
            },
          ]}>
          <CText type={'s12'} color={colors.grayScale500}>
            {item}
          </CText>
        </TouchableOpacity>
      </View>
    );
  };

  const overView = ({item, index}) => {
    return (
      <View
        style={[
          localStyle.overViewContainer,
          {
            backgroundColor: item.loss
              ? colors.primary
              : colors.dark
              ? colors.inputBackground
              : colors.black,
          },
        ]}>
        <View style={localStyle.imageAndProfitValue}>
          <View style={styles.flexRow}>
            <View
              style={[
                localStyle.imageBg,
                {
                  backgroundColor: item.profit
                    ? colors.grayScale700
                    : colors.primary4,
                },
              ]}>
              {item.svgIcon}
            </View>
            <View style={localStyle.assetContainer}>
              <View>
                <CText type={'B14'} color={colors.white}>
                  {item.title}
                </CText>
                <CText
                  type={'R12'}
                  color={item.profit ? colors.grayScale500 : colors.primary2}>
                  {item.value}
                </CText>
              </View>
            </View>
          </View>
          <View>
            <CText type={'B14'} color={colors.white}>
              {item.profitValue}
            </CText>
            <View style={localStyle.imageAndAssetContainer}>
              {item.profit ? (
                <Ionicons
                  name={'arrow-up-circle-outline'}
                  color={colors.green}
                  size={moderateScale(18)}
                />
              ) : (
                <Ionicons
                  name={'arrow-down-circle-outline'}
                  color={colors.primary2}
                  size={moderateScale(18)}
                />
              )}
              <CText
                type={'s12'}
                color={item.profit ? colors.green : colors.primary2}>
                {item.profit ? item.profit : item.loss}
              </CText>
            </View>
          </View>
        </View>
        <View style={localStyle.profitAndBtn}>
          <View>
            <CText
              type={'R10'}
              color={item.loss ? colors.primary2 : colors.grayScale500}>
              {item.profits}
            </CText>
            <CText type={'B12'} color={colors.white}>
              {item.profitsInDollar}
            </CText>
          </View>
          <CButton
            containerStyle={localStyle.buyBtn}
            bgColor={colors.white}
            color={colors.primary}
            title={String.buy}
            type={'B12'}
          />
        </View>
      </View>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.portfolio} rightIcon={<RightIcon />} />
      <ScrollView
        contentContainerStyle={localStyle.mainViewContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={localStyle.headerGoldDetails}>
          <CText
            type={'R14'}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}>
            {String.totalAssetValue}
          </CText>
          <View
            style={[
              localStyle.profitAndYearContainer,
              {gap: moderateScale(10)},
            ]}>
            <CText type={'B32'}>{'$27,456.00'}</CText>
            <Ionicons
              name={'eye-outline'}
              size={moderateScale(24)}
              color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            />
          </View>
          <View style={localStyle.profitAndYearContainer}>
            <Ionicons
              name={'arrow-up-circle-outline'}
              color={colors.green}
              size={moderateScale(20)}
            />
            <CText type={'S12'} color={colors.green}>
              {'0.54% (+1.20%) '}
            </CText>
            <CText type={'S12'} color={colors.grayScale500}>
              {String.allTime}
            </CText>
          </View>
        </View>

        <VictoryChart
          padding={{top: 24, bottom: 30, right: 50}}
          singleQuadrantDomainPadding={{x: false}}
          colorScale={colors.primary}
          domainPadding={30}>
          <VictoryBar
            style={{
              data: {
                fill: ({datum}) =>
                  datum.id === 4 ? colors.primary : colors.inputBackground,
                fillOpacity: 0.7,
              },
              labels: {
                fontSize: 14,
                fill: ({datum}) =>
                  datum.id === 4 ? colors.textColor : colors.primary,
              },
            }}
            width={deviceWidth - moderateScale(40)}
            data={PortfolioChartData}
            barRatio={1}
            cornerRadius={{top: moderateScale(6), bottom: moderateScale(6)}}
            labels={({datum}) => `${datum.title}`}
            labelComponent={<VictoryLabel />}
            y={d => d.value}
            x={'title'}
          />
          <VictoryAxis crossAxis={false} />
        </VictoryChart>
        <View
          style={[
            localStyle.monthCounter,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <FlatList
            data={['24H', '1W', '1M ', '1Y', 'All']}
            renderItem={renderDurationItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
          />
        </View>
        <CText type={'B16'} style={localStyle.overViewHeader}>
          {String.overview}
        </CText>
        <FlatList
          data={OverViewPortfolio}
          renderItem={overView}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          bounces={false}
        />
        <CText type={'B16'} style={localStyle.overViewHeader}>
          {String.assetAllocation}
        </CText>
        <View
          style={[
            localStyle.assetCollectionContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <Image
            source={
              colors.dark
                ? images.AssetAllocation_Dark
                : images.AssetAllocation_Light
            }
            style={localStyle.assetAllocationImage}
          />
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainViewContainer: {
    ...styles.ph20,
  },
  headerGoldDetails: {
    ...styles.mt15,
  },
  profitAndYearContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  renderItemContainer: {
    ...styles.itemsCenter,
  },
  amountContainer: {
    height: getHeight(28),
    ...styles.ph10,
    borderRadius: moderateScale(8),
    ...styles.center,
    marginRight: moderateScale(32),
  },
  monthCounter: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    ...styles.mt20,
    height: getHeight(40),
    ...styles.p5,
  },
  overViewContainer: {
    height: getHeight(150),
    borderRadius: moderateScale(12),
    ...styles.ph15,
    ...styles.pv20,
    ...styles.mv10,
    width: deviceWidth - moderateScale(40),
  },
  imageAndProfitValue: {
    ...styles.rowSpaceBetween,
  },
  imageAndAssetContainer: {
    ...styles.flexRow,
  },
  imageBg: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(8),
    ...styles.center,
  },
  assetContainer: {
    ...styles.ml10,
    ...styles.rowSpaceBetween,
  },
  profitAndBtn: {
    ...styles.rowSpaceBetween,
    ...styles.mt10,
  },
  buyBtn: {
    width: '25%',
    height: moderateScale(35),
  },
  overViewHeader: {
    ...styles.mv10,
  },
  assetCollectionContainer: {
    width: deviceWidth - moderateScale(40),
    height: getHeight(270),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    ...styles.mb30,
    ...styles.itemsCenter,
    ...styles.ph20,
    ...styles.pv10,
  },
  assetAllocationImage: {
    width: deviceWidth - moderateScale(70),
    height: getHeight(250),
    borderRadius: moderateScale(19),
  },
});

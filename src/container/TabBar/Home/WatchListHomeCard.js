import {FlatList, Image, ScrollView, StyleSheet, View} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/EvilIcons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {styles} from '../../../themes';
import {deviceWidth, moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import {useSelector} from 'react-redux';
import {VictoryLine} from 'victory-native';
import {MarketStockData, SampleDataGold} from '../../../api/constant';
import CButton from '../../../components/common/CButton';

export default function WatchListHomeCard({route, navigation}) {
  const item = route?.params?.item;
  const colors = useSelector(state => state.theme.theme);

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

  const onPressDone = () => {
    navigation.goBack();
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.watchList} />
      <ScrollView
        contentContainerStyle={localStyle.mainViewContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={localStyle.headerGoldDetails}>
          <View>
            <CText type={'B32'} color={colors.textColor}>
              {item.cardName}
            </CText>
            <CText type={'R20'} numberOfLines={2} color={colors.grayScale500}>
              {item.bankName}
            </CText>
            <CText type={'S12'} color={colors.textColor} style={styles.mt5}>
              {item.amount}
            </CText>
            <View style={localStyle.profitAndYearContainer}>
              <Ionicons
                name={'arrow-up-circle-outline'}
                color={colors.green}
                size={moderateScale(20)}
              />
              <CText type={'S12'} color={colors.green}>
                {'0.35% (+1.50%) '}
              </CText>
            </View>
          </View>
          <Image source={item.image} style={localStyle.cardImage} />
        </View>
        <VictoryLine
          data={SampleDataGold}
          width={deviceWidth - moderateScale(40)}
          style={{
            data: {stroke: colors.green},
            parent: {border: '1px solid #ccc'},
          }}
          labels={({datum}) => `${datum.date}: ${datum.label}`}
          x="date"
          y="label"
        />

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

        <CButton title={String.done} onPress={onPressDone} type={'B16'} />
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainViewContainer: {
    ...styles.ph20,
  },
  headerGoldDetails: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
  },
  profitAndYearContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mt10,
  },
  cardImage: {
    width: moderateScale(56),
    height: moderateScale(56),
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
  marketContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mh15,
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
  headerContainer: {
    ...styles.mt20,
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
});

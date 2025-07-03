import {
  Image,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';

// custom import
import {FilterIcon} from '../../../../assets/svg';
import {useSelector} from 'react-redux';
import CText from '../../../../components/common/CText';
import {styles} from '../../../../themes';
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import {deviceWidth, moderateScale} from '../../../../common/constants';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {StockHistoryData} from '../../../../api/constant';

export default function StockHistory() {
  const colors = useSelector(state => state.theme.theme);
  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <FilterIcon />
      </TouchableOpacity>
    );
  };

  const RenderHeader = ({title}) => {
    return (
      <CText
        type="M14"
        style={styles.mt20}
        color={colors.dark ? colors.grayScale500 : colors.grayScale400}>
        {title}
      </CText>
    );
  };
  const RenderData = ({item, index}) => {
    return (
      <TouchableOpacity
        style={[
          localStyle.livePriceContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.rowCenter}>
          <Image source={item.image} style={localStyle.livePriceImage} />
          <View style={localStyle.titleText}>
            <CText type={'B14'}>{item.title}</CText>
            <CText type={'S10'} color={colors.grayScale500}>
              {item.name}
            </CText>
          </View>
        </View>
        <View>
          <CText
            type={'B14'}
            style={styles.selfEnd}
            color={
              item.profitValue
                ? colors.green
                : item.lossValue
                ? colors.alertColor
                : colors.textColor
            }>
            {item.profitValue
              ? item.profitValue
              : item.profit
              ? item.profit
              : item.lossValue}
          </CText>
          <CText
            type={'S12'}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={localStyle.profitAndLossText}>
            {item.amount}
          </CText>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.transactionsHistory} rightIcon={<RightIcon />} />
      <View style={localStyle.itemContainer}>
        <SectionList
          sections={StockHistoryData}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <RenderData item={item} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({section: {title}}) => (
            <RenderHeader title={title} />
          )}
          showsVerticalScrollIndicator={false}
          bounces={false}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  sortText: {
    ...styles.ml5,
  },
  itemContainer: {
    ...styles.ph20,
    ...styles.mb30,
    ...styles.flex,
  },
  livePriceContainer: {
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
    ...styles.mt5,
  },
  profitAndLossText: {
    ...styles.ml5,
    ...styles.mt2,
  },
  dotStyle: {
    height: moderateScale(4),
    width: moderateScale(4),
    borderRadius: moderateScale(4),
    ...styles.mh5,
    ...styles.ml5,
  },
});

import {
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {useSelector} from 'react-redux';
import CText from '../../../../components/common/CText';
import {deviceWidth, moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import {GoldHistoryData} from '../../../../api/constant';
import {FilterIcon} from '../../../../assets/svg';

export default function GoldHistory() {
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
        <View style={styles.flexRow}>
          <Image source={item.image} style={localStyle.livePriceImage} />
          <View style={localStyle.titleText}>
            <CText type={'B14'}>{item.title}</CText>
            <CText
              type={'S10'}
              color={colors.grayScale500}
              style={localStyle.newsTypeText}>
              {item.time}
            </CText>
          </View>
        </View>
        <View>
          <CText
            type={'B16'}
            color={
              item.profit
                ? colors.textColor
                : item.loss
                ? colors.alertColor
                : item.amount
                ? colors.green
                : colors.textColor
            }>
            {item.profit ? item.profit : item.amount ? item.amount : item.loss}
          </CText>
          <CText
            type={'S12'}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={localStyle.profitAndLossText}>
            {item.profitValue ? item.profitValue : item.lossValue}
          </CText>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.activity} rightIcon={<RightIcon />} />
      <View style={localStyle.itemContainer}>
        <SectionList
          sections={GoldHistoryData}
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

import {
  Image,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';

// custom import
import {useSelector} from 'react-redux';
import {FilterIcon} from '../../../assets/svg';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import CText from '../../../components/common/CText';
import {PortfolioHistoryData} from '../../../api/constant';
import {styles} from '../../../themes';
import {deviceWidth, moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';

export default function PortfolioHistory({navigation}) {
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
  const onPressItem = item => {
    navigation.navigate(StackNav.HistoryTransactionDetails, {item, item});
  };
  const RenderData = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressItem(item)}
        style={[
          localStyle.portfolioHistoryContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.rowCenter}>
          <Image source={item.image} style={localStyle.livePriceImage} />
          <View style={localStyle.titleText}>
            <CText type={'B14'}>{item.label}</CText>
            <CText type={'R12'} color={colors.grayScale500}>
              {item.time}
            </CText>
          </View>
        </View>
        <View>
          <CText
            type={'B14'}
            style={styles.selfEnd}
            color={item.profit ? colors.textColor : colors.alertColor}>
            {item.profit ? item.profit : item.loss}
          </CText>
          <CText
            type={'R12'}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={localStyle.profitAndLossText}>
            {item.value}
          </CText>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.transactionHistory} rightIcon={<RightIcon />} />
      <View style={localStyle.itemContainer}>
        <SectionList
          sections={PortfolioHistoryData}
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
  dotStyle: {
    height: moderateScale(4),
    width: moderateScale(4),
    borderRadius: moderateScale(4),
    ...styles.mh5,
    ...styles.ml5,
  },
});

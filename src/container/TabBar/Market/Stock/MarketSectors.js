import {StyleSheet, TouchableOpacity, View, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import React from 'react';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {styles} from '../../../../themes';
import {moderateScale} from '../../../../common/constants';
import {
  AllMarketSectorsData,
  TopMarketSectorData,
} from '../../../../api/constant';
import CText from '../../../../components/common/CText';

export default function MarketSectors() {
  const colors = useSelector(state => state.theme.theme);

  const onPressCategory = item => {
    setIsSelect(item);
  };

  const MarketSectors = ({item, index}) => {
    return (
      <View
        style={[
          localStyle.outerContainer,
          {
            backgroundColor: colors.dark
              ? colors.inputBackground
              : colors.inputBackground,
          },
        ]}>
        <TouchableOpacity
          onPress={() => onPressCategory(item)}
          style={[
            localStyle.sectorsContainer,
            {
              backgroundColor: colors.dark
                ? colors.grayScale700
                : colors.backgroundColor,
            },
          ]}>
          {item.svgIcon}
        </TouchableOpacity>
        <CText
          type={'B12'}
          align={'center'}
          numberOfLines={1}
          color={colors.textColor}
          style={localStyle.sectorText}>
          {item.titleName}
        </CText>
      </View>
    );
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.marketSectors} />
      <ScrollView
        contentContainerStyle={localStyle.mainContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <CText
          type={'B16'}
          style={localStyle.header}
          numberOfLines={1}
          color={colors.textColor}>
          {String.topSectors}
        </CText>
        <View style={localStyle.itemContainer}>
          {TopMarketSectorData.map((item, index) => {
            return <MarketSectors item={item} />;
          })}
        </View>
        <CText
          type={'B16'}
          style={styles.mt30}
          numberOfLines={1}
          color={colors.textColor}>
          {String.allMarketSectors}
        </CText>
        <View style={localStyle.itemContainer}>
          {AllMarketSectorsData.map((item, index) => {
            return <MarketSectors item={item} />;
          })}
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  header: {
    ...styles.mt10,
  },
  mainContainer: {
    ...styles.p20,
  },
  outerContainer: {
    height: moderateScale(108),
    width: moderateScale(99),
    ...styles.mt20,
    ...styles.mh5,
    borderRadius: moderateScale(12),
    ...styles.center,
  },
  sectorsContainer: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(56 / 2),
    ...styles.center,
  },
  sectorText: {
    ...styles.mt10,
  },
  itemContainer: {
    ...styles.flexRow,
    ...styles.wrap
  }
});

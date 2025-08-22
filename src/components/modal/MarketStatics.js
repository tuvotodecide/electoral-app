import {FlatList, StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import Icons from 'react-native-vector-icons/EvilIcons';

// custom import
import ActionSheet from 'react-native-actions-sheet';
import {styles} from '../../themes';
import CText from '../common/CText';
import String from '../../i18n/String';
import {deviceWidth, moderateScale} from '../../common/constants';
import {MarketStaticData} from '../../api/constant';
import CButton from '../common/CButton';

export default function MarketStatics(props) {
  const colors = useSelector(state => state.theme.theme);
  const {SheetRef, title, onPressBuy, data} = props;

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
    <ActionSheet
      gestureEnabled={true}
      ref={SheetRef}
      containerStyle={[
        localStyle.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View style={localStyle.headerContainer}>
        <CText type={'B16'}>{String.marketStatistics}</CText>
        <Icons
          name={'question'}
          size={moderateScale(24)}
          color={colors.dark ? colors.grayScale500 : colors.grayScale400}
          style={localStyle.iconStyle}
        />
      </View>
      <FlatList
        data={data}
        renderItem={marketStatic}
        key={2}
        numColumns={2}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.mb15}
      />
      <View style={localStyle.btnContainer}>
        <CButton title={title} onPress={onPressBuy} type={'B6'} />
      </View>
    </ActionSheet>
  );
}

const localStyle = StyleSheet.create({
  actionSheetContainer: {
    ...styles.ph20,
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
  },
});

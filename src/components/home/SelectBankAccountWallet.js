import {SectionList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import {useSelector} from 'react-redux';
import CText from '../common/CText';
import CButton from '../common/CButton';
import {deviceWidth, moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import String from '../../i18n/String';

export default function SelectBankAccountWallet(props) {
  const colors = useSelector(state => state.theme.theme);
  const {data, onPressConfirm} = props;

  const [isSelect, setIsSelect] = useState('');

  const onPressBankDetails = item => {
    setIsSelect(item.title);
  };

  const BankAccountDetails = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressBankDetails(item)}
        style={[
          localStyle.bankDetailsContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
            backgroundColor: colors.backgroundColor,
          },
        ]}>
        <View style={localStyle.accountIconAndDetails}>
          <View
            style={[
              localStyle.accountIconBg,
              {backgroundColor: colors.inputBackground},
            ]}>
            {item.svgIcon}
          </View>
          <View style={localStyle.titleAndValueContainer}>
            <CText type={'B14'} numberOfLines={1}>
              {item.title}
            </CText>
            <CText type={'R12'} color={colors.grayScale500} numberOfLines={1}>
              {item.value}
            </CText>
          </View>
        </View>
        <Ionicons
          name={
            isSelect === item?.title ? 'radio-button-on' : 'radio-button-off'
          }
          size={moderateScale(22)}
          color={
            isSelect === item?.title
              ? colors.primary
              : colors.dark
              ? colors.grayScale700
              : colors.grayScale200
          }
        />
      </TouchableOpacity>
    );
  };
  const RenderHeader = ({title}) => {
    return (
      <CText type="B16" style={styles.mt20} color={colors.textColor}>
        {title}
      </CText>
    );
  };
  return (
    <View style={localStyle.mainContainer}>
      <View>
        <SectionList
          sections={data}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <BankAccountDetails item={item} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({section: {title}}) => (
            <RenderHeader title={title} />
          )}
          contentContainerStyle={localStyle.itemContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <CButton
        title={String.confirm}
        type={'B16'}
        containerStyle={localStyle.addBtn}
        onPress={onPressConfirm}
      />
    </View>
  );
}

const localStyle = StyleSheet.create({
  bankDetailsContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt15,
    ...styles.ph10,
    ...styles.pv15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.rowSpaceBetween,
    width: deviceWidth - moderateScale(40),
  },
  accountIconAndDetails: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  accountIconBg: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
  },
  itemContainer: {
    ...styles.ph20,
  },
  titleAndValueContainer: {
    ...styles.ml10,
  },
  addBtn: {
    ...styles.selfCenter,
    width: '90%',
    ...styles.mb30,
    ...styles.mt30,
  },
  mainContainer: {
    ...styles.flex,
    ...styles.justifyBetween,
  },
});

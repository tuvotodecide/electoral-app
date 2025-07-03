import {SectionList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import {deviceWidth, moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import {BankAccountData} from '../../../api/constant';
import CButton from '../../../components/common/CButton';
import {StackNav} from '../../../navigation/NavigationKey';

export default function BankAccount({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressItem = item => {
    navigation.navigate(StackNav.BankAccountDetails, {item: item});
  };

  const BankAccountDetails = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressItem(item)}
        style={[
          localStyle.bankDetailsContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
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

  const onPressAddBankAccount = () => {
    navigation.navigate(StackNav.AddBankAccount);
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.bankAccount} />
      <SectionList
        sections={BankAccountData}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <BankAccountDetails item={item} />}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({section: {title}}) => (
          <RenderHeader title={title} />
        )}
        contentContainerStyle={localStyle.itemContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
      <CButton
        title={String.addBankAccountEWallet}
        type={'B16'}
        containerStyle={localStyle.addBtn}
        onPress={onPressAddBankAccount}
      />
    </CSafeAreaView>
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
  },
});

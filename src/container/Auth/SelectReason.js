import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import StepIndicator from '../../components/authComponents/StepIndicator';
import CHeader from '../../components/common/CHeader';
import {styles} from '../../themes';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import {useSelector} from 'react-redux';
import {moderateScale} from '../../common/constants';
import {
  BankingData,
  GlobalSpendingData,
  InvestmentData,
} from '../../api/constant';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';

export default function SelectReason({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState([]);

  const onPressContinue = () => {
    if (isSelect.length > 0) {
      navigation.navigate(AuthNav.CreatePin);
    } else {
      alert(String.pleaseSelectReason);
    }
  };

  const onPressCategory = value => {
    if (isSelect.includes(value)) {
      setIsSelect(isSelect.filter(item => item !== value));
    } else {
      setIsSelect([...isSelect, value]);
    }
  };
  const RenderData = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressCategory(item)}
        style={[
          localStyle.itemContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: isSelect.includes(item)
              ? colors.primary
              : colors.inputBackground,
          },
        ]}>
        <CText
          type={'M14'}
          align={'center'}
          color={isSelect.includes(item) ? colors.primary : colors.grayScale400}
          style={styles.mh15}>
          {item.name}
        </CText>
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaViewAuth>
      <CHeader />
      <StepIndicator step={4} />
      <ScrollView
        style={localStyle.mainContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <CText type={'B24'}>{String.whatDoYouWantUseFinancialFor}</CText>
        <CText type={'R14'} color={colors.grayScale500}>
          {String.selectReasonDescription}
        </CText>
        <CText type={'B16'} style={localStyle.bankingStyle} numberOfLines={1}>
          {String.banking}
        </CText>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {BankingData.map((item, index) => {
            return <RenderData item={item} />;
          })}
        </View>
        <CText type={'B16'} style={localStyle.bankingStyle} numberOfLines={1}>
          {String.investments}
        </CText>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {InvestmentData.map((item, index) => {
            return <RenderData item={item} />;
          })}
        </View>
        <CText type={'B16'} style={localStyle.bankingStyle} numberOfLines={1}>
          {String.globalSpending}
        </CText>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {GlobalSpendingData.map((item, index) => {
            return <RenderData item={item} />;
          })}
        </View>
        <CButton
          type={'B16'}
          title={String.continue}
          onPress={onPressContinue}
        />
      </ScrollView>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  bankingStyle: {
    ...styles.mt30,
  },
  itemContainer: {
    ...styles.center,
    borderRadius: moderateScale(10),
    height: moderateScale(40),
    ...styles.mr10,
    ...styles.mv10,
    borderWidth: moderateScale(1),
  },
});

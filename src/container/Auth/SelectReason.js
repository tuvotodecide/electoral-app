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
        testID={`selectReasonOption_${item.name.replace(/\s+/g, '_').toLowerCase()}`}
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
          testID={`selectReasonOptionText_${item.name.replace(/\s+/g, '_').toLowerCase()}`}
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
    <CSafeAreaViewAuth testID="selectReasonContainer">
      <CHeader testID="selectReasonHeader" />
      <StepIndicator testID="selectReasonStepIndicator" step={4} />
      <ScrollView
        testID="selectReasonScrollView"
        style={localStyle.mainContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <CText testID="selectReasonMainTitle" type={'B24'}>{String.whatDoYouWantUseFinancialFor}</CText>
        <CText testID="selectReasonDescription" type={'R14'} color={colors.grayScale500}>
          {String.selectReasonDescription}
        </CText>
        <CText testID="selectReasonBankingTitle" type={'B16'} style={localStyle.bankingStyle} numberOfLines={1}>
          {String.banking}
        </CText>
        <View
          testID="selectReasonBankingOptionsContainer"
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {BankingData.map((item, index) => {
            return <RenderData item={item} key={index} />;
          })}
        </View>
        <CText testID="selectReasonInvestmentsTitle" type={'B16'} style={localStyle.bankingStyle} numberOfLines={1}>
          {String.investments}
        </CText>
        <View
          testID="selectReasonInvestmentsOptionsContainer"
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {InvestmentData.map((item, index) => {
            return <RenderData item={item} key={index} />;
          })}
        </View>
        <CText testID="selectReasonGlobalSpendingTitle" type={'B16'} style={localStyle.bankingStyle} numberOfLines={1}>
          {String.globalSpending}
        </CText>
        <View
          testID="selectReasonGlobalSpendingOptionsContainer"
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {GlobalSpendingData.map((item, index) => {
            return <RenderData item={item} key={index} />;
          })}
        </View>
        <CButton
          testID="selectReasonContinueButton"
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

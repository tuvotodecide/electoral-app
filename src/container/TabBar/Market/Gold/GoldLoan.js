import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import Icons from 'react-native-vector-icons/EvilIcons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {styles} from '../../../../themes';
import CText from '../../../../components/common/CText';
import {useSelector} from 'react-redux';
import {getHeight, moderateScale} from '../../../../common/constants';
import SlideComponent from '../../../../components/home/SlideComponent';
import {
  InstallmentTenureGoldData,
  LoanSimulationGoldData,
} from '../../../../api/constant';
import CButton from '../../../../components/common/CButton';
import {TabNav} from '../../../../navigation/NavigationKey';

export default function GoldLoan({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [value, setValue] = useState(0);
  const [isSelect, setIsSelect] = useState('');

  const onChangeValue = newValue => {
    setValue(newValue);
  };

  const onPressSelectItem = item => {
    setIsSelect(item.id);
  };

  const onPressLoan = () => {
    navigation.navigate(TabNav.MarketScreen);
  };

  const installmentTenure = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => onPressSelectItem(item)}
        style={[
          localStyle.installmentContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor:
              isSelect === item.id ? colors.primary : colors.inputBackground,
          },
        ]}>
        <CText
          type={'B12'}
          color={
            isSelect === item.id
              ? colors.primary
              : colors.dark
              ? colors.grayScale400
              : colors.grayScale500
          }>
          {item.value}
        </CText>
      </TouchableOpacity>
    );
  };
  const LoanSimulation = ({item, index}) => {
    return (
      <View>
        <View style={localStyle.loanSimulationInnerView}>
          <CText type={'R12'} color={colors.grayScale500}>
            {item.title}
          </CText>
          <CText type={'M14'}>{item.value}</CText>
        </View>
        <CText
          type={'S10'}
          style={styles.selfEnd}
          color={colors.dark ? colors.grayScale500 : colors.grayScale400}>
          {item.description}
        </CText>
        {item.id === 3 ? null : (
          <View
            style={[
              localStyle.lineView,
              {
                backgroundColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale200,
              },
            ]}
          />
        )}
      </View>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.createLoan} />
      <ScrollView
        contentContainerStyle={localStyle.mainViewContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <View style={localStyle.quantityHeaderContainer}>
          <CText type={'B14'} color={colors.grayScale500}>
            {String.goldQuantity}
          </CText>
          <TouchableOpacity>
            <Icons
              name={'question'}
              size={moderateScale(20)}
              style={localStyle.questionIcon}
              color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            />
          </TouchableOpacity>
        </View>
        <View
          style={[
            localStyle.quantityGmContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <CText type={'B18'} color={colors.primary}>
            {value + String.gr}
          </CText>
        </View>
        <SlideComponent
          endPoint={5}
          maxValue={1000}
          onValuesChange={onChangeValue}
        />
        <View style={localStyle.quantityHeaderContainer}>
          <CText type={'B14'} color={colors.grayScale500}>
            {String.installmentTenure}
          </CText>
          <TouchableOpacity>
            <Icons
              name={'question'}
              size={moderateScale(20)}
              style={localStyle.questionIcon}
              color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={InstallmentTenureGoldData}
          renderItem={installmentTenure}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
        />
        <CText type={'B14'} style={localStyle.loanSimulationText}>
          {String.loanSimulation}
        </CText>
        <View
          style={[
            localStyle.loanSimulationContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          {LoanSimulationGoldData.map((item, index) => (
            <LoanSimulation item={item} />
          ))}
        </View>
        <CButton title={String.reviewLoan} type={'B16'} onPress={onPressLoan} />
      </ScrollView>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainViewContainer: {
    ...styles.ph20,
    ...styles.mt30,
    paddingBottom: moderateScale(30),
  },
  quantityHeaderContainer: {
    ...styles.flexRow,
  },
  questionIcon: {
    ...styles.mt2,
  },
  quantityGmContainer: {
    height: moderateScale(64),
    borderRadius: moderateScale(12),
    width: '100%',
    borderWidth: moderateScale(1),
    ...styles.mt20,
    ...styles.center,
  },
  installmentContainer: {
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.center,
    ...styles.mr10,
    ...styles.ph10,
    ...styles.mt10,
  },
  loanSimulationText: {
    ...styles.mt20,
  },
  loanSimulationInnerView: {
    ...styles.rowSpaceBetween,
    ...styles.mt10,
  },
  loanSimulationContainer: {
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    height: getHeight(225),
    ...styles.ph15,
    ...styles.mt15,
    ...styles.pv20,
  },
  lineView: {
    width: '100%',
    height: moderateScale(1),
    ...styles.mv10,
  },
});

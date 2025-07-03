import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import {useSelector} from 'react-redux';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {getHeight, moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import CText from '../../../../components/common/CText';
import images from '../../../../assets/images';
import CommonTextInput from '../../../../components/home/CommonTextInput';
import {GoldGramData} from '../../../../api/constant';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import CButton from '../../../../components/common/CButton';
import {StackNav} from '../../../../navigation/NavigationKey';

export default function RedeemGold({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(false);
  const [select, setSelect] = useState('');

  const onPressSelect = () => {
    setIsSelect(!isSelect);
  };

  const onPressSelectItem = item => {
    setSelect(item.id);
  };

  const onPressRedeem = title => {
    navigation.navigate(StackNav.SuccessfulInvest, {title: title});
  };

  const GoldInGram = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => onPressSelectItem(item)}
        style={[
          localStyle.goldInGramContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor:
              select === item.id ? colors.primary : colors.inputBackground,
          },
        ]}>
        <CText
          type={'S12'}
          color={
            select === item.id
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
  return (
    <CSafeAreaView>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 2.1}}
        style={localStyle.activityHeader}
        colors={[colors.gradient1, colors.gradient2, colors.gradient1]}>
        <CHeader
          title={String.redeem}
          textColor={colors.white}
          color={colors.white}
        />
        <View style={localStyle.headerContainer}>
          <CText type={'R14'} color={colors.primary2}>
            {String.goldBalance}
          </CText>
          <View style={localStyle.goldImageAndValue}>
            <CText type={'B32'} color={colors.white}>
              {'100 ' + String.gr}
            </CText>
            <Image source={images.GoldImage} style={localStyle.goldImage} />
          </View>
        </View>
      </LinearGradient>
      <KeyBoardAvoidWrapper containerStyle={localStyle.mainContainer}>
        <CommonTextInput
          title={String.amount}
          image={images.GoldImage}
          labelTitle={String.gram}
          onPressSelect={onPressSelect}
          placeholderText={'0,5'}
          borderColor={isSelect ? colors.primary : colors.inputBackground}
          placeholderTextColor={colors.textColor}
        />
        <View style={{flexDirection: 'row', marginTop: moderateScale(70)}}>
          {GoldGramData.map(item => (
            <GoldInGram item={item} />
          ))}
        </View>
      </KeyBoardAvoidWrapper>
      <CButton
        title={String.redeem}
        containerStyle={localStyle.btnStyle}
        type={'B16'}
        onPress={onPressRedeem}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  activityHeader: {
    height: getHeight(210),
    ...styles.mt10,
  },
  headerContainer: {
    ...styles.ph20,
    ...styles.mt30,
  },
  goldImageAndValue: {
    ...styles.rowSpaceBetween,
  },
  goldImage: {
    height: moderateScale(48),
    width: moderateScale(48),
  },
  mainContainer: {
    ...styles.ph20,
  },
  goldInGramContainer: {
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.center,
    ...styles.mr20,
    ...styles.ph15,
    ...styles.mt30,
  },
  btnStyle: {
    ...styles.selfCenter,
    width: '90%',
  },
});

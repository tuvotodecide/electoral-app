import {StyleSheet, View} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';
import CIconText from '../../components/common/CIconText';
import Icono from '../../components/common/Icono';
import {useSelector} from 'react-redux';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {
  getDisableTextColor,
  getSecondaryTextColor,
} from '../../utils/ThemeUtils';
import String from '../../i18n/String';

export default function RegisterUser11({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const onPressNext = () => {
    navigation.navigate(AuthNav.LoginUser);
  };

  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={11} />
      <CHeader />
      <KeyBoardAvoidWrapper
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText type={'B20'} style={styles.boldText} align={'center'}>
            {String.welcomeTitle}
          </CText>

          <CText type={'B16'} color={getSecondaryTextColor(colors)}>
            {String.verifiedIdentity}
          </CText>
        </View>
        <CIconText
          icon={<Icono name="wallet" color={colors.primary} />}
          text={
            <View>
              <CText type={'B16'} color={getDisableTextColor(colors)}>
                {String.activosTitle}
              </CText>
              <CText type={'B16'} color={getSecondaryTextColor(colors)}>
                {String.activosDesc}
              </CText>
            </View>
          }
        />

        <CIconText
          icon={<Icono name="swap-horizontal" color={colors.primary} />}
          text={
            <View>
              <CText type={'B16'} color={getDisableTextColor(colors)}>
                {String.transfiereTitle}
              </CText>
              <CText type={'B16'} color={getSecondaryTextColor(colors)}>
                {String.transfiereDesc}
              </CText>
            </View>
          }
        />

        <CIconText
          icon={<Icono name="history" color={colors.primary} />}
          text={
            <View>
              <CText type={'B16'} color={getDisableTextColor(colors)}>
                {String.historialTitle}
              </CText>
              <CText type={'B16'} color={getSecondaryTextColor(colors)}>
                {String.historialDesc}
              </CText>
            </View>
          }
        />

        <CIconText
          icon={<Icono name="shield-lock-outline" color={colors.primary} />}
          text={
            <View>
              <CText type={'B16'} color={getDisableTextColor(colors)}>
                {String.seguridadTitle}
              </CText>
              <CText type={'B16'} color={getSecondaryTextColor(colors)}>
                {String.seguridadDesc}
              </CText>
            </View>
          }
        />
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CButton
          title={String.goToWalletButton}
          onPress={onPressNext}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
        />
      </View>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    gap: 5,
    marginBottom: 10,
  },
  btnStyle: {
    ...styles.selfCenter,
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mt20,
  },
  orContainer: {
    height: getHeight(1),
    width: '20%',
  },
  socialBtn: {
    ...styles.center,
    height: getHeight(45),
    width: '46%',
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(1),
    ...styles.mh10,
    ...styles.mt20,
  },
  socialBtnContainer: {
    ...styles.flexRow,
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  loginText: {
    marginTop: moderateScale(2),
  },
  rowWithGap: {
    flexDirection: 'row',
    columnGap: 10,
  },
  item: {
    width: '95%',
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(180),
    width: moderateScale(180),
  },
  margin: {
    marginBottom: '20px',
  },
});

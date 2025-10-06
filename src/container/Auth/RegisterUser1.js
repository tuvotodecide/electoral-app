import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import CButton from '../../components/common/CButton';
import {AuthNav, StackNav} from '../../navigation/NavigationKey';
import CIconText from '../../components/common/CIconText';
import Icono from '../../components/common/Icono';
import CAlert from '../../components/common/CAlert';
import StepIndicator from '../../components/authComponents/StepIndicator';
import String from '../../i18n/String';

export default function RegisterUser1({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const [check, setCheck] = useState(false);

  const onPressRememberMe = () => setCheck(!check);
  const onPressNext = () => navigation.navigate(AuthNav.RegisterUser2, route.params);
  const onPressConditions = () =>
    navigation.navigate(StackNav.TermsAndCondition);


  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={1} />
      <CHeader />
      <KeyBoardAvoidWrapper
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText type={'B20'}>
            {String.titleReg + (route.params?.isRecovery ? ' ' + String.recoveryCIIntro : '')}
          </CText>

          <CIconText
            icon={
              <Icono
                name="card-account-details-outline"
                color={colors.primary}
              />
            }
            text={<CText type={'B16'}>{String.connectItem1Reg}</CText>}
          />
          <CIconText
            icon={<Icono name="camera-outline" color={colors.primary} />}
            text={<CText type={'B16'}>{String.connectItem2Reg}</CText>}
          />
          {route.params?.isRecovery && (
            <CIconText
              icon={<Icono name="form-textbox-password" color={colors.primary} />}
              text={<CText type={'B16'}>{String.pin}</CText>}
            />
          )}
        </View>
      </KeyBoardAvoidWrapper>

      <View style={localStyle.bottomTextContainer}>
        <View style={localStyle.rowWithGap}>
          <TouchableOpacity onPress={onPressRememberMe}>
            <Ionicons
              name={check ? 'checkbox' : 'square-outline'}
              color={check ? colors.primary : colors.grayScale50}
              size={moderateScale(24)}
            />
          </TouchableOpacity>

          <CText type={'r14'} color={colors.colorText} style={localStyle.item}>
            {String.termsPrefix}
            <CText
              type={'r14'}
              color={colors.primary}
              onPress={onPressConditions}>
              {String.termsLink}
            </CText>
            <CText type={'r14'} color={colors.colorText}>
              {String.termsSuffix}
            </CText>
          </CText>
        </View>

        <CAlert status="info" message={String.infoMessage} />

        <CButton
          title={String.continueButton}
          disabled={!check}
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
});

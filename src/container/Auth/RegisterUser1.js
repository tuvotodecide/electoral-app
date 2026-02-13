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
  const onPressRememberMe = () => {
    setCheck(!check);
  };

  const onPressNext = () => {
    if (route?.params) {
      navigation.navigate(AuthNav.RegisterUser2, route.params);
    } else {
      navigation.navigate(AuthNav.RegisterUser2);
    }
  };

  const onPressConditions = () => {
    navigation.navigate(StackNav.TermsAndCondition);
  };

  const isRecoveryFlow = !!route?.params?.isRecovery;

  return (
    <CSafeAreaViewAuth testID="registerUser1Container">
      <StepIndicator testID="registerUser1StepIndicator" step={1} />
      <CHeader testID="registerUser1Header" />
      <KeyBoardAvoidWrapper
        testID="registerUser1KeyboardWrapper"
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View testID="registerUser1MainContent" style={localStyle.mainContainer}>
          <CText style={localStyle.title} type="B20">
            {String.titleReg}
          </CText>
          <CText testID="registerUser1Title">
            {String.verificationInfo}
          </CText>

          <CIconText
            testID="registerUser1Step1Icon"
            containerStyle={{
              backgroundColor: colors.stepBackgroundColor,
              ...localStyle.card,
            }}
            textStyle={localStyle.cardText}
            icon={<Icono name="card-account-details-outline" color={colors.primary} size={moderateScale(40)} />}
            text={
              <View>
                <CText testID="registerUser1Step1Text" style={localStyle.cardTitle}>
                  {String.connectItem1Reg}
                </CText>
                <CText testID="registerUser1Step1Desc">
                  {String.connectItem1Desc}
                </CText>
              </View>
            }
          />
          <CIconText
            testID="registerUser1Step2Icon"
            containerStyle={{
              backgroundColor: colors.stepBackgroundColor,
              ...localStyle.card,
            }}
            textStyle={localStyle.cardText}
            icon={<Icono name="camera-outline" color={colors.primary} size={moderateScale(40)} />}
            text={
              <View>
                <CText testID="registerUser1Step2Text" style={localStyle.cardTitle}>
                  {String.connectItem2Reg}
                </CText>
                <CText testID="registerUser1Step2Desc">
                  {String.connectItem2Desc}
                </CText>
              </View>
            }
          />
          {isRecoveryFlow && (
            <CIconText
              testID="registerUser1Step3Icon"
              containerStyle={{
                backgroundColor: colors.stepBackgroundColor,
                ...localStyle.card,
              }}
              textStyle={localStyle.cardText}
              icon={<Icono name="form-textbox-password" color={colors.primary} size={moderateScale(40)} />}
              text={
                <View>
                  <CText testID="registerUser1Step3Text" style={localStyle.cardTitle}>
                    {String.pin}
                  </CText>
                  <CText testID="registerUser1Step3Desc">
                    {String.pinDesc}
                  </CText>
                </View>
              }
            />
          )}
        </View>
      </KeyBoardAvoidWrapper>

      <View testID="registerUser1BottomSection" style={localStyle.bottomTextContainer}>
        <View testID="termsCheckboxContainer" style={localStyle.rowWithGap}>
          <TouchableOpacity testID="termsCheckbox" onPress={onPressRememberMe}>
            <Ionicons
              testID="termsCheckboxIcon"
              name={check ? 'checkbox' : 'square-outline'}
              color={colors.primary}
              size={moderateScale(24)}
            />
          </TouchableOpacity>

          <CText testID="termsText" type={'r14'} color={colors.colorText} style={localStyle.item}>
            {String.termsPrefix}
            <CText
              testID="termsLink"
              type={'r14'}
              color={colors.primary}
              onPress={onPressConditions}>
              {String.termsLink}
            </CText>
            <CText testID="termsSuffix" type={'r14'} color={colors.colorText}>
              {String.termsSuffix}
            </CText>
          </CText>
        </View>

        <CAlert testID="registerUser1InfoAlert" status="info" message={String.infoMessage} />

        <CButton
          testID="registerUser1ContinueButton"
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
  title: {
    fontWeight: 'bold',
  },
  card: {
    width: '100%',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: moderateScale(15),
  },
  cardText: {
    justifyContent: 'center',
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
    gap: moderateScale(8),
  },
  item: {
    flexShrink: 1,
  },
});

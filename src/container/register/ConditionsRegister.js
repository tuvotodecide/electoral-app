import {StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import String from '../../i18n/String';

const RenderEtiqueta = ({title, subtitle, colors, testId}) => {
  return (
    <View testID={`${testId}_container`} style={localStyle.loginText}>
      <CText testID={`${testId}_title`} type={'B16'} color={colors.secondary} style={styles.boldText}>
        {title}
      </CText>
      <CText testID={`${testId}_subtitle`} type={'B16'} color={colors.secondary} align={'justify'}>
        {subtitle}
      </CText>
    </View>
  );
};

export default function ConditionsRegister({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <CSafeAreaViewAuth testID="conditionsRegisterContainer">
      <CHeader testID="conditionsRegisterHeader" />
      <KeyBoardAvoidWrapper
        testID="conditionsRegisterKeyboardWrapper"
        containerStyle={[styles.justifyBetween, styles.flex]}>
        <View testID="conditionsRegisterMainContainer" style={localStyle.mainContainer}>
          <CText testID="conditionsRegisterTitle" type={'B20'} align="center" style={styles.boldText}>
            {String.termsTitle}
          </CText>

          <CText testID="conditionsRegisterLastUpdate" type={'B16'} align="center" color={colors.secondary}>
            {String.termsLastUpdate}
          </CText>

          <RenderEtiqueta
            testId="conditionsRegisterSection1"
            title={String.termsSection1Title}
            subtitle={String.termsSection1Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            testId="conditionsRegisterSection2"
            title={String.termsSection2Title}
            subtitle={String.termsSection2Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            testId="conditionsRegisterSection3"
            title={String.termsSection3Title}
            subtitle={String.termsSection3Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            testId="conditionsRegisterSection4"
            title={String.termsSection4Title}
            subtitle={String.termsSection4Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            testId="conditionsRegisterSection5"
            title={String.termsSection5Title}
            subtitle={String.termsSection5Subtitle}
            colors={colors}
          />
        </View>
      </KeyBoardAvoidWrapper>
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
});

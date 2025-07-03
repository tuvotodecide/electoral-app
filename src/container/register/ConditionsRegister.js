import {StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../../components/common/CSafeAreaView';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import String from '../../i18n/String';

const RenderEtiqueta = ({title, subtitle, colors}) => {
  return (
    <View style={localStyle.loginText}>
      <CText type={'B16'} color={colors.secondary} style={styles.boldText}>
        {title}
      </CText>
      <CText type={'B16'} color={colors.secondary} align={'justify'}>
        {subtitle}
      </CText>
    </View>
  );
};

export default function ConditionsRegister({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <CSafeAreaView>
      <CHeader />
      <KeyBoardAvoidWrapper
        containerStyle={[styles.justifyBetween, styles.flex]}>
        <View style={localStyle.mainContainer}>
          <CText type={'B20'} align="center" style={styles.boldText}>
            {String.termsTitle}
          </CText>

          <CText type={'B16'} align="center" color={colors.secondary}>
            {String.termsLastUpdate}
          </CText>

          <RenderEtiqueta
            title={String.termsSection1Title}
            subtitle={String.termsSection1Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            title={String.termsSection2Title}
            subtitle={String.termsSection2Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            title={String.termsSection3Title}
            subtitle={String.termsSection3Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            title={String.termsSection4Title}
            subtitle={String.termsSection4Subtitle}
            colors={colors}
          />
          <RenderEtiqueta
            title={String.termsSection5Title}
            subtitle={String.termsSection5Subtitle}
            colors={colors}
          />
        </View>
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
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

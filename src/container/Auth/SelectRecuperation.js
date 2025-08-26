import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {AuthNav} from '../../navigation/NavigationKey';
import String from '../../i18n/String';
import CButton from '../../components/common/CButton';
import {useSelector} from 'react-redux';
import Icono from '../../components/common/Icono';

export default function SelectRecuperation({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  return (
    <CSafeAreaViewAuth testID="selectRecuperationContainer">
      <CHeader
        testID="selectRecuperationHeader"
        title={String.recoveryWallet}
        onPressBack={() => navigation.navigate(AuthNav.Connect)}
      />
      <KeyBoardAvoidWrapper
        testID="selectRecuperationKeyboardWrapper"
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          styles.ph20,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <CText testID="selectRecuperationTitle" type={'B20'} style={styles.boldText} align={'center'}>
            {String.recoverymethod}
          </CText>
        </View>
        <TouchableOpacity
          testID="selectRecuperationGuardiansOption"
          style={[
            localStyle.optionContainer,
            {
              backgroundColor: colors.backgroundColor,
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,

              elevation: 5,
            },
          ]}
          onPress={() => navigation.navigate(AuthNav.FindMyUser)}>
          <View style={styles.rowCenter}>
            <View
              testID="selectRecuperationGuardiansIcon"
              style={[
                localStyle.iconBg,
                {
                  borderColor: colors.dark
                    ? colors.stepBackgroundColor
                    : colors.grayScale200,
                },
              ]}>
              <Icono name="account" size={moderateScale(24)} />
            </View>
            <View style={styles.ml10}>
              <View style={styles.rowCenter}>
                <CText testID="selectRecuperationGuardiansText" type="B16">{String.recoverymethodGuardians}</CText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          testID="selectRecuperationQROption"
          style={[
            localStyle.optionContainer,
            {
              backgroundColor: colors.backgroundColor,
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,

              elevation: 5,
            },
          ]}
          onPress={() => navigation.navigate(AuthNav.RecoveryQr)}>
          <View style={styles.rowCenter}>
            <View
              testID="selectRecuperationQRIcon"
              style={[
                localStyle.iconBg,
                {
                  borderColor: colors.dark
                    ? colors.stepBackgroundColor
                    : colors.grayScale200,
                },
              ]}>
              <Icono name="qrcode" size={moderateScale(24)} />
            </View>
            <View style={styles.ml10}>
              <View style={styles.rowCenter}>
                <CText testID="selectRecuperationQRText" type="B16">{String.recoverymethodQR}</CText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </KeyBoardAvoidWrapper>
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
  optionContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(12),
    marginVertical: moderateScale(6),
  },
  iconBg: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(3),
  },
  badge: {
    marginLeft: moderateScale(8),
    paddingHorizontal: moderateScale(6),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(4),
  },
  actionButton: {
    flex: 1,
    marginHorizontal: moderateScale(4),
    borderRadius: moderateScale(8),
  },
});

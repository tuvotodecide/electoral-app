import {Dimensions, Image, StyleSheet, View} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {AuthNav} from '../../navigation/NavigationKey';
import {useSelector} from 'react-redux';
import images from '../../assets/images';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import CAlertPrimary from '../../components/common/CAlertPrimary';
import Icono from '../../components/common/Icono';
import String from '../../i18n/String';

export default function AccountLock({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  
  const onPressNext = () => {
    navigation.navigate(AuthNav.SelectRecuperation, {disableCI: true});
  };

  return (
    <CSafeAreaViewAuth testID="accountLockContainer">
      <View
        testID="accountLockOvalBackground"
        style={[localStyle.ovalBackground, {backgroundColor: colors.primary}]}
      />
      <CHeader
        testID="accountLockHeader"
        onPressBack={() => navigation.navigate(AuthNav.Connect)}
        color={colors.white}
      />
      <KeyBoardAvoidWrapper
        testID="accountLockKeyboardWrapper"
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <Image
            testID="accountLockImage"
            source={images.BloqueoImage}
            style={localStyle.imageContainer}
          />
          <CText testID="accountLockTitle" type={'B20'} style={styles.boldText} align={'center'}>
            {String.forgot2}
          </CText>

          <CText
            testID="accountLockDescription"
            type={'B16'}
            color={getSecondaryTextColor(colors)}
            align={'center'}>
            {String.messengePrivacity}
          </CText>
        </View>
      </KeyBoardAvoidWrapper>
      <View testID="accountLockBottomContainer" style={localStyle.bottomTextContainer}>
        <CAlertPrimary
          testID="accountLockRecoveryButton"
          icon={<Icono name="lock" color={getSecondaryTextColor(colors)} />}
          iconRiaght={
            <Icono name="chevron-right" color={getSecondaryTextColor(colors)} />
          }
          title={String.forgotPassWord2}
          subttle={String.forgot3}
          onPress={onPressNext}
        />
      </View>
    </CSafeAreaViewAuth>
  );
}

const {width, height} = Dimensions.get('window');

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

  ovalBackground: {
    position: 'absolute',
    top: -height * 0.5,
    left: -width * 0.25,
    width: width * 1.5,
    height: height * 0.6,
    borderRadius: height,
    zIndex: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.26,
    shadowRadius: 3.5,
  },
});

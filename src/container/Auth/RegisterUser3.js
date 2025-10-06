import {Image, StyleSheet, View} from 'react-native';
import React from 'react';

// Custom imports
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
import images from '../../assets/images';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import String from '../../i18n/String';

export default function RegisterUser3({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const onPressNext = () => {
    navigation.navigate(AuthNav.RegisterUser4, route.params);
  };

  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={3} />
      <CHeader />
      <KeyBoardAvoidWrapper
        containerStyle={[
          styles.justifyBetween,
          styles.flex,
          {top: moderateScale(10)},
        ]}>
        <View style={localStyle.mainContainer}>
          <Image
            source={colors.dark ? images.FaceIdImage : images.FaceId_lightImage}
            style={localStyle.imageContainer}
          />
          <CText type={'B20'} style={styles.boldText} align={'center'}>
            {String.titleCamera}
          </CText>

          <CText type={'B16'} color={getSecondaryTextColor(colors)}>
            {String.description_camera}
          </CText>

          <CText type={'B16'} color={getSecondaryTextColor(colors)}>
            {String.description_note}
          </CText>
        </View>
        <CIconText
          icon={<Icono name="weather-sunny" color={colors.primary} />}
          text={
            <CText type={'B16'} color={getSecondaryTextColor(colors)}>
              {String.tip_well_lit}
            </CText>
          }
        />
        <CIconText
          icon={<Icono name="account-remove-outline" color={colors.primary} />}
          text={
            <CText type={'B16'} color={getSecondaryTextColor(colors)}>
              {String.tip_remove_items}
            </CText>
          }
        />
        <CIconText
          icon={<Icono name="camera-outline" color={colors.primary} />}
          text={
            <CText type={'B16'} color={getSecondaryTextColor(colors)}>
              {String.tip_look_camera}
            </CText>
          }
        />
      </KeyBoardAvoidWrapper>
      <View style={localStyle.bottomTextContainer}>
        <CButton
          title={String.button_scan_face}
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

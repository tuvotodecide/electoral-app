import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import React, {useRef} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import {getHeight, getWidth, moderateScale} from '../../../common/constants';
import images from '../../../assets/images';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import CButton from '../../../components/common/CButton';
import ReferralCodeShare from '../../../components/modal/ReferralCodeShare';

export default function ReferralCode() {
  const colors = useSelector(state => state.theme.theme);
  const ReferralSheetRef = useRef(null);

  const onPressInviteMyFr = () => {
    ReferralSheetRef?.current?.show();
  };
  const onPressClose = () => {
    ReferralSheetRef?.current?.hide();
  };

  return (
    <CSafeAreaView>
      <LinearGradient
        start={{x: 0, y: 0.3}}
        end={{x: 1.2, y: 1.3}}
        style={localStyle.backgroundContainer}
        colors={[colors.black, colors.primary, colors.black]}>
        <CHeader color={colors.white} />
        <View
          style={[
            localStyle.modalContainer,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}>
          <Image style={localStyle.giftImage} source={images.GiftImage} />
          <CText type={'B20'} align={'center'}>
            {String.invitation}
          </CText>
          <CText
            type={'R12'}
            align={'center'}
            color={colors.grayScale500}
            style={localStyle.descriptionText}>
            {String.invitationDescription}
          </CText>
          <View
            style={[
              localStyle.referralCodeContainer,
              {
                borderColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale200,
              },
            ]}>
            <View style={localStyle.codeAndText}>
              <View>
                <CText type={'R12'} color={colors.grayScale500}>
                  {String.useUserNameAsReferralCode}
                </CText>
                <CText type={'B18'}>{String.userName}</CText>
              </View>
              <TouchableOpacity style={localStyle.copyContainer}>
                <Ionicons
                  name={'copy-outline'}
                  color={colors.primary}
                  size={moderateScale(18)}
                />
                <CText
                  type={'b14'}
                  color={colors.primary}
                  style={localStyle.copyText}>
                  {String.copy}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
          <CButton
            title={String.inviteMyFriends}
            type={'B16'}
            onPress={onPressInviteMyFr}
          />
        </View>
      </LinearGradient>
      <ReferralCodeShare
        SheetRef={ReferralSheetRef}
        onPressClose={onPressClose}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  backgroundContainer: {
    ...styles.flex,
  },
  modalContainer: {
    ...styles.selfCenter,
    width: '90%',
    borderRadius: moderateScale(12),
    height: '75%',
    ...styles.mt30,
    ...styles.mb20,
    ...styles.p20,
  },
  giftImage: {
    height: getHeight(140),
    width: getWidth(170),
    ...styles.selfCenter,
    ...styles.mt30,
    ...styles.mb20,
  },
  descriptionText: {
    ...styles.mt10,
  },
  referralCodeContainer: {
    height: moderateScale(69),
    borderRadius: moderateScale(12),
    ...styles.ph10,
    ...styles.selfCenter,
    borderWidth: moderateScale(1),
    width: '100%',
    ...styles.mt20,
    ...styles.mb30,
  },
  codeAndText: {
    ...styles.rowSpaceBetween,
    ...styles.mt10,
  },
  copyContainer: {
    ...styles.flexRow,
  },
  copyText: {
    ...styles.mh5,
  },
});

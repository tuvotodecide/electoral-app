import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import ActionSheet from 'react-native-actions-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import {styles} from '../../themes';
import {useSelector} from 'react-redux';
import CText from '../common/CText';
import String from '../../i18n/String';
import {getHeight, moderateScale} from '../../common/constants';
import CButton from '../common/CButton';
import {ShareReferralCodeMediaData} from '../../api/constant';

export default function ReferralCodeShare(props) {
  const {SheetRef, onPressClose} = props;
  const colors = useSelector(state => state.theme.theme);

  const referralCodeShare = ({item, index}) => {
    return (
      <View key={index}>
        <TouchableOpacity
          // onPress={() => onPressItem(item)}
          style={[
            localStyle.shareContainer,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}>
          <Ionicons
            name={item.name}
            color={colors.textColor}
            size={moderateScale(24)}
          />
        </TouchableOpacity>
        <CText
          type={'B12'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.socialMediaText}>
          {item.title}
        </CText>
      </View>
    );
  };

  return (
    <ActionSheet
      gestureEnabled={true}
      ref={SheetRef}
      indicatorStyle={[
        styles.mt10,
        {
          backgroundColor: colors.dark
            ? colors.grayScale700
            : colors.grayScale200,
        },
      ]}
      containerStyle={{backgroundColor: colors.backgroundColor}}>
      <View style={localStyle.headerContainer}>
        <CText type={'B16'}>{String.inviteYourFriends}</CText>
        <TouchableOpacity onPress={onPressClose}>
          <Ionicons
            name="close"
            size={moderateScale(20)}
            color={colors.grayScale500}
          />
        </TouchableOpacity>
      </View>
      <View
        style={[
          localStyle.lineView,
          {
            backgroundColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}
      />
      <View style={localStyle.actionSheetContainer}>
        <View
          style={[
            localStyle.innerBox,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <View style={localStyle.textContainer}>
            <CText type={'B16'}>{String.helenaJourneys}</CText>
            <CText type={'B24'}>{String.inviteYourFrText}</CText>
          </View>
          <View
            style={[
              localStyle.footerContainer,
              {
                backgroundColor: colors.primary,
              },
            ]}>
            <CText
              type={'R12'}
              color={colors.primary2}
              align={'center'}
              style={styles.mt15}>
              {String.useReferralCodeAndEarnCommission}
            </CText>
            <CButton
              bgColor={colors.white}
              containerStyle={localStyle.btnStyle}
              title={String.userName}
              color={colors.black}
              type={'B16'}
            />
          </View>
        </View>
        <FlatList
          data={ShareReferralCodeMediaData}
          renderItem={referralCodeShare}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </ActionSheet>
  );
}

const localStyle = StyleSheet.create({
  actionSheetContainer: {
    ...styles.ph20,
  },
  headerContainer: {
    ...styles.mt30,
    ...styles.rowSpaceBetween,
    ...styles.ph20,
  },
  lineView: {
    width: '100%',
    height: moderateScale(2),
    ...styles.mt20,
    ...styles.mb20,
  },
  innerBox: {
    ...styles.selfCenter,
    width: '100%',
    borderRadius: moderateScale(12),
    height: getHeight(280),
    ...styles.mt10,
    borderWidth: moderateScale(1),
    ...styles.mb30,
  },
  textContainer: {
    ...styles.ph20,
    ...styles.mt20,
  },
  footerContainer: {
    borderBottomEndRadius: moderateScale(12),
    width: '100%',
    height: getHeight(110),
    ...styles.mt30,
    borderBottomLeftRadius: moderateScale(12),
    ...styles.ph20,
  },
  btnStyle: {
    ...styles.mt10,
  },
  shareContainer: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(56 / 2),
    ...styles.center,
    ...styles.mh15,
    ...styles.mt10,
  },
  socialMediaText: {
    ...styles.mt10,
    ...styles.mb30,
  },
});

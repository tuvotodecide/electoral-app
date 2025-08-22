import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CHeader from '../../../components/common/CHeader';
import {moderateScale} from '../../../common/constants';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import CButton from '../../../components/common/CButton';
import CSafeAreaView from '../../../components/common/CSafeAreaView';

export default function NotificationDetails({route}) {
  const colors = useSelector(state => state.theme.theme);
  const item = route?.params?.item;

  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Ionicons
          name={'ellipsis-vertical'}
          size={moderateScale(24)}
          color={colors.white}
        />
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader rightIcon={<RightIcon />} />
      <View style={localStyle.mainContainer}>
        <View>
          <Image source={item.image} style={localStyle.notificationImage} />
          <CText type={'B20'} align={'center'} style={styles.mt10}>
            {String.verifyYourEmail}
          </CText>
        </View>
        <View>
          <CText type={'B16'}>{String.helloText}</CText>
          <CText type={'R14'} color={colors.grayScale500} style={styles.mt20}>
            {String.verifyEmailText}
          </CText>
          <CButton title={String.verifyEmail} type={'B16'} />
          <CText type={'R14'} color={colors.grayScale500} style={styles.mt10}>
            {String.queryText}
          </CText>
        </View>
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  notificationImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    ...styles.selfCenter,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyEvenly,
    ...styles.flex,
  },
});

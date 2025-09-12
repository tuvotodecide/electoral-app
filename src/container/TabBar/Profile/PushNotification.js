import {FlatList, StyleSheet, Switch, View} from 'react-native';
import React, {useState} from 'react';

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import CText from '../../../components/common/CText';
import {
  Email_Dark,
  Email_Light,
  News_Dark,
  News_Light,
  PersonalProfile_Light,
  Profile_Dark,
  Promotion_Dark,
  Promotion_Light,
  Telegram_Dark,
  Telegram_Light,
  Whatsapp_Dark,
  Whatsapp_Light,
} from '../../../assets/svg';

export default function PushNotification() {
  const colors = useSelector(state => state.theme.theme);
  const [isEnable, setIsEnable] = useState({
    isEnableNews: true,
    isEnablePromotion: true,
    isEnableCommunity: true,
    isEnableTelegram: true,
    isEnableEmail: true,
    isEnableWhatsapp: true,
  });

  const PushNotificationData = [
    {
      id: 1,
      svgDark: <News_Dark />,
      svgLight: <News_Light />,
      title: String.news,
      description: String.receiveNotificationForNews,
      value: isEnable.isEnableNews,
      onPress: () =>
        setIsEnable({
          ...isEnable,
          isEnableNews: isEnable.isEnableNews ? false : true,
        }),
    },
    {
      id: 2,
      svgDark: <Promotion_Dark />,
      svgLight: <Promotion_Light />,
      title: String.promotion,
      description: String.receiveNotificationForNews,
      value: isEnable.isEnablePromotion,
      onPress: () =>
        setIsEnable({
          ...isEnable,
          isEnablePromotion: isEnable.isEnablePromotion ? false : true,
        }),
    },
    {
      id: 3,
      svgDark: <Profile_Dark />,
      svgLight: <PersonalProfile_Light />,
      title: String.community,
      description: String.receiveNotificationForNews,
      value: isEnable.isEnableCommunity,
      onPress: () =>
        setIsEnable({
          ...isEnable,
          isEnableCommunity: isEnable.isEnableCommunity ? false : true,
        }),
    },
    {
      id: 4,
      svgDark: <Telegram_Dark />,
      svgLight: <Telegram_Light />,
      title: String.telegram,
      description: String.receiveNotificationForNews,
      value: isEnable.isEnableTelegram,
      onPress: () =>
        setIsEnable({
          ...isEnable,
          isEnableTelegram: isEnable.isEnableTelegram ? false : true,
        }),
    },
    {
      id: 5,
      svgDark: <Email_Dark />,
      svgLight: <Email_Light />,
      title: String.email,
      description: String.receiveNotificationForNews,
      value: isEnable.isEnableEmail,
      onPress: () =>
        setIsEnable({
          ...isEnable,
          isEnableEmail: isEnable.isEnableEmail ? false : true,
        }),
    },
    {
      id: 6,
      svgDark: <Whatsapp_Dark />,
      svgLight: <Whatsapp_Light />,
      title: String.whatsapp,
      description: String.receiveNotificationForNews,
      value: isEnable.isEnableWhatsapp,
      onPress: () =>
        setIsEnable({
          ...isEnable,
          isEnableWhatsapp: isEnable.isEnableWhatsapp ? false : true,
        }),
    },
  ];

  const NotificationCollection = ({item, index}) => {
    return (
      <View
        key={index}
        style={[
          localStyle.notificationContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.rowCenter}>
          <View
            style={[
              localStyle.iconBackground,
              {
                backgroundColor: colors.inputBackground,
              },
            ]}>
            {colors.dark ? item.svgDark : item.svgLight}
          </View>
          <View style={localStyle.titleAndDescription}>
            <CText type={'B12'}>{item.title}</CText>
            <CText type={'R10'} color={colors.grayScale500}>
              {item.description}
            </CText>
          </View>
        </View>
        <Switch
          onValueChange={item.onPress}
          trackColor={{
            false: colors.dark ? colors.grayScale700 : colors.grayScale200,
            true: colors.primary,
          }}
          value={item.value}
          style={styles.mr10}
          thumbColor={colors.white}
        />
      </View>
    );
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.notification} testID="pushNotificationHeader" />
      <FlatList
        data={PushNotificationData}
        renderItem={NotificationCollection}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={localStyle.mainContainerView}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  notificationContainer: {
    height: moderateScale(72),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mv10,
    ...styles.ph10,
    borderWidth: moderateScale(1),
  },
  iconBackground: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
  },
  mainContainerView: {
    ...styles.ph20,
  },
  titleAndDescription: {
    ...styles.ml10,
  },
});

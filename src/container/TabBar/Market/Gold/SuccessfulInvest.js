import {Image, StyleSheet, View} from 'react-native';
import React from 'react';

// custom import
import {useSelector} from 'react-redux';
import {styles} from '../../../../themes';
import {getHeight, getWidth} from '../../../../common/constants';
import CButton from '../../../../components/common/CButton';
import String from '../../../../i18n/String';
import CText from '../../../../components/common/CText';
import images from '../../../../assets/images';
import {TabNav} from '../../../../navigation/NavigationKey';

export default function SuccessfulInvest({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const title = route?.params?.title;

  const onPressDone = () => {
    navigation.navigate(TabNav.MarketScreen);
  };
  return (
    <CSafeAreaView style={styles.justifyBetween}>
      <View></View>
      <View style={localStyle.mainContainer}>
        <Image
          source={
            colors.dark
              ? images.SuccessfulDepositDark
              : images.SuccessfulDepositLight
          }
          style={localStyle.successfulImage}
        />
        <CText type={'B24'} align={'center'} numberOfLines={1}>
          {title === String.reviewAutoInvest
            ? String.successfulInvest
            : String.successfulRedeem}
        </CText>
        <CText
          type={'R14'}
          align={'center'}
          style={localStyle.descriptionText}
          numberOfLines={2}
          color={colors.grayScale500}>
          {String.depositSuccessfulText}
        </CText>
      </View>
      <CButton
        title={String.done}
        type={'B16'}
        onPress={onPressDone}
        containerStyle={localStyle.btnStyle}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  successfulImage: {
    width: getWidth(120),
    height: getHeight(120),
    ...styles.selfCenter,
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
  descriptionText: {
    width: '90%',
    ...styles.selfCenter,
  },
});

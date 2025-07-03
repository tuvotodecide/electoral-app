import {Image, StyleSheet, View} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {styles} from '../../../themes';
import images from '../../../assets/images';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import CButton from '../../../components/common/CButton';
import {useSelector} from 'react-redux';
import {TabNav} from '../../../navigation/NavigationKey';
import {getHeight, getWidth} from '../../../common/constants';

export default function WithdrawSuccessful({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressDone = () => {
    navigation.navigate(TabNav.WalletScreen);
  };
  return (
    <CSafeAreaView style={localStyle.wholeViewContainer}>
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
          {String.withdrawSuccessful}
        </CText>
        <CText
          type={'R14'}
          align={'center'}
          style={localStyle.descriptionText}
          numberOfLines={2}
          color={colors.grayScale500}>
          {String.withdrawSuccessfulText}
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
  wholeViewContainer: {
    ...styles.justifyBetween,
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
  mainContainer: {
    ...styles.ph20,
  },
});

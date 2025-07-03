import {Image, StyleSheet, View} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {useSelector} from 'react-redux';
import images from '../../../assets/images';
import {getHeight, getWidth} from '../../../common/constants';
import {styles} from '../../../themes';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import CButton from '../../../components/common/CButton';
import {TabNav} from '../../../navigation/NavigationKey';

export default function DepositSuccessful({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressDone = () => {
    navigation.navigate(TabNav.WalletScreen);
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
          {String.depositSuccessful}
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

import {StyleSheet} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import WalletPreview from '../../../components/home/WalletPreview';
import images from '../../../assets/images';
import {DepositPreviewData} from '../../../api/constant';
import CButton from '../../../components/common/CButton';
import {styles} from '../../../themes';
import {StackNav} from '../../../navigation/NavigationKey';

export default function DepositPreview({route, navigation}) {
  let value = route?.params?.value;

  const onPressDepositNow = () => {
    navigation.navigate(StackNav.DepositSuccessful);
  };

  return (
    <CSafeAreaView style={localStyle.mainViewContainer}>
      <CHeader title={String.depositPreview} />
      <WalletPreview
        image={images.DollarGreenImage}
        titleText={String.depositUsd}
        depositValue={value}
        data={DepositPreviewData}
      />
      <CButton
        title={String.depositNow}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressDepositNow}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainViewContainer: {
    ...styles.justifyBetween,
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
});

import {StyleSheet} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import WalletPreview from '../../../components/home/WalletPreview';
import images from '../../../assets/images';
import {TransferPreviewData} from '../../../api/constant';
import CButton from '../../../components/common/CButton';
import {styles} from '../../../themes';
import {TabNav} from '../../../navigation/NavigationKey';

export default function TransferPreview({route, navigation}) {
  let value = route?.params?.value;

  const onPressTransferNow = () => {
    navigation.navigate(TabNav.WalletScreen);
  };

  return (
    <CSafeAreaView style={localStyle.mainViewContainer}>
      <CHeader title={String.transferPreview} />
      <WalletPreview
        image={images.UserImage1}
        titleText={String.transferUSD}
        depositValue={value}
        data={TransferPreviewData}
      />
      <CButton
        title={String.transferNow}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressTransferNow}
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

import React, {useState} from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import MyWalletCommonComponent from '../../../components/home/MyWalletCommonComponent';
import String from '../../../i18n/String';
import images from '../../../assets/images';
import {StackNav} from '../../../navigation/NavigationKey';

export default function SendWallet({navigation}) {
  const [value, setValue] = useState('');

  const onChangText = text => {
    setValue(text);
  };
  const onPressChange = () => {
    navigation.navigate(StackNav.TransferBalance);
  };
  const onPressTransferPreview = () => {
    navigation.navigate(StackNav.TransferPreview, {value: value});
  };
  return (
    <CSafeAreaView>
      <MyWalletCommonComponent
        title={String.transferUSD}
        value={value}
        titleText={String.usdBalance + ' $ 8,786.55'}
        placeholderText={'$0.00'}
        BankName={String.aileenFullbright}
        paymentType={'+1 7896 8797 908'}
        btnTitle={String.transferPreview}
        onPressChange={onPressChange}
        image={images.UserImage1}
        onPressPreview={onPressTransferPreview}
        onChangeText={onChangText}
      />
    </CSafeAreaView>
  );
}

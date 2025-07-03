import React, {useState} from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import MyWalletCommonComponent from '../../../components/home/MyWalletCommonComponent';
import {BraclaysIcon} from '../../../assets/svg';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

export default function MyWalletWithdraw({navigation}) {
  const [value, setValue] = useState('');

  const onChangText = text => {
    setValue(text);
  };
  const onPressChange = () => {
    navigation.navigate(StackNav.SelectBankAccountWithdraw);
  };

  const onPressWithdrawPreview = () => {
    navigation.navigate(StackNav.WithdrawSuccessful);
  };

  return (
    <CSafeAreaView>
      <MyWalletCommonComponent
        title={String.withdraw}
        value={value}
        titleText={String.withdrawFee + ' $ 2.00'}
        placeholderText={'$0.00'}
        svgIcon={<BraclaysIcon />}
        BankName={String.barclays}
        paymentType={'**** **** **** 8907'}
        btnTitle={String.withdrawPreview}
        onPressChange={onPressChange}
        onChangeText={onChangText}
        onPressPreview={onPressWithdrawPreview}
      />
    </CSafeAreaView>
  );
}

import React, {useState} from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import MyWalletCommonComponent from '../../../components/home/MyWalletCommonComponent';
import String from '../../../i18n/String';
import {BankAmericaIcon} from '../../../assets/svg';
import {StackNav} from '../../../navigation/NavigationKey';

export default function MyWalletDeposit({navigation}) {
  const [value, setValue] = useState('');

  const onChangText = text => {
    setValue(text);
  };
  const onPressChange = () => {
    navigation.navigate(StackNav.SelectBankAccountDeposit);
  };
  const onPressDepositPreview = () => {
    navigation.navigate(StackNav.DepositPreview, {value: value});
  };
  return (
    <CSafeAreaView>
      <MyWalletCommonComponent
        title={String.deposit}
        value={value}
        titleText={String.toPopUp + ' $ 2.00'}
        placeholderText={'$0.00'}
        svgIcon={<BankAmericaIcon />}
        BankName={String.bankOfAmerica}
        paymentType={String.automaticPayment}
        btnTitle={String.depositPreview}
        onPressChange={onPressChange}
        onPressPreview={onPressDepositPreview}
        onChangeText={onChangText}
      />
    </CSafeAreaView>
  );
}



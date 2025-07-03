import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import SelectBankAccountWallet from '../../../components/home/SelectBankAccountWallet';
import {WalletWithdrawMethodData} from '../../../api/constant';

export default function SelectBankAccountWithdraw({navigation}) {
  const onPressConfirm = () => {
    navigation.goBack();
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.withdrawalDestination} />
      <SelectBankAccountWallet
        data={WalletWithdrawMethodData}
        btnTitle={String.confirm}
        onPressConfirm={onPressConfirm}
      />
    </CSafeAreaView>
  );
}

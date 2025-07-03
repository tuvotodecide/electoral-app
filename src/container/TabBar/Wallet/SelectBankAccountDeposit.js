import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import SelectBankAccountWallet from '../../../components/home/SelectBankAccountWallet';
import {WalletDepositMethodData} from '../../../api/constant';

export default function SelectBankAccountDeposit({navigation}) {
  const onPressConfirm = () => {
    navigation.goBack();
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.depositMethod} />
      <SelectBankAccountWallet
        data={WalletDepositMethodData}
        btnTitle={String.confirm}
        onPressConfirm={onPressConfirm}
      />
    </CSafeAreaView>
  );
}

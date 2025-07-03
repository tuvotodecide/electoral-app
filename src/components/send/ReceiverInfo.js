import { Image, StyleSheet, View } from "react-native";
import String from "../../i18n/String";
import CText from "../common/CText";
import CUserCard from "../common/CUserCard";
import CInput from "../common/CInput";
import { styles } from "../../themes";
import { moderateScale } from "../../common/constants";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import CListCard from "../common/CLIstCard";
import CDropdown from "../common/CDropdown";
import Decimal from "decimal.js";
import CButton from "../common/CButton";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { trucateAddress } from "../../utils/Address";

const data = {
  name: 'Ana Quispe Cruz',
  phone: '95746384',
}

export default function ReceiverInfo({data, onNext = (data) => {}}) {
  const colors = useSelector(state => state.theme.theme);
  const tokenBalances = useSelector(state => state.account.tokenBalances);
  const [editData, setEditData] = useState(data);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    setEditData({
      ...editData,
      name: data.name,
      address: data.address
    })
  }, [data.address])

  useEffect(() => {
    const accountToken = tokenBalances.find((token) => 
      token.network === editData.network && token.address?.toLowerCase() === editData.tokenAddress?.toLowerCase()
    );
    setCurrentBalance(accountToken ? accountToken.balance:'0');
  }, [tokenBalances, editData.network, editData.tokenAddress]);
  
  const onRenderTokenOption = (item, index, onPress) => {
    return (
      <CListCard
        item={{
          title: item.symbol,
          iconUrl: item.logo,
          iconSize: moderateScale(25),
        }}
        index={index}
        onPress={onPress}
      />
    );
  }

  const onChangeToken = (value) => {
		setEditData({
			...editData,
			network: value.network,
			tokenAddress: value.address,
			tokenSymbol: value.symbol,
			tokenLogo: value.logo,
		});
	}

  const onChangeAmount = (value) => {
		setEditData({
			...editData,
			amount: value
		});
	}

	const onChangeReference = (value) => {
		setEditData({
			...editData,
			reference: value
		});
	}

  const checkTarget = useMemo(() => {
    if(!editData.address){
      return String.nameRequired;
    }
    return null;
  }, [editData.address]);

  const checkAmount = useMemo(() => {
    try{
      const requested = new Decimal(editData.amount);

      if(requested.greaterThan(currentBalance)) {
        return String.balanceNotEnough;
      }
      return null;
    }catch(error) {
      return String.invalidAmount;
    }
  }, [editData.amount, currentBalance]);

  const checkToken = useMemo(() => {
    if(!editData.network){
      return String.selectCoin;
    }
    return null;
  }, [editData.network]);
  
  return(
    <>
    <View style={{...localStyle.detailContainer, borderColor: colors.grayScale700}}>
      <CText type="B14" style={styles.mt10}>
        {String.ownTo}
      </CText>
      { editData.address ?
        <CUserCard
          ionIcon='person-circle-outline'
          name={editData.name ?? trucateAddress(editData.address, 4)}
          data={editData.name ? trucateAddress(editData.address, 4) : null}
        /> : 
        <CText style={localStyle.noResults} color={colors.alertColor}>{checkTarget}</CText>
      }
      <CText type="B14" style={styles.mt10}>
        {String.tokenToPay}
      </CText>
      <CDropdown
        data={tokenBalances}
        renderItem={onRenderTokenOption}
        dataItemKey={(item) => item.network + item.address}
        value={editData.tokenSymbol}
        onSelected={onChangeToken}
        _errorText={checkToken}
        leftSpace={editData.tokenLogo !== '' ? <Image
          source={{uri: editData.tokenLogo}}
          style={localStyle.inputIcon}
        />:null}
      />
      <CText type="B14" style={styles.mt10}>
        {String.pay}
      </CText>
      <CInput
        keyBoardType={'numeric'}
        _value={editData.amount}
        _errorText={checkAmount}
        maxLength={10}
        autoCapitalize={'none'}
        placeholderTextColor={colors.textColor}
        rightAccessory={() => <CText>{editData.tokenSymbol}</CText>}
        toGetTextFieldValue={onChangeAmount}
      />
      { editData.tokenSymbol ?
        <CText style={localStyle.balance}>{`${String.leftBalance} ${currentBalance} ${editData.tokenSymbol}`}</CText>
        : null
      }
      <CText type="B14" style={styles.mt10}>
        {String.reference}
      </CText>
      <CInput
        keyBoardType={'default'}
        _value={editData.reference}
        maxLength={10}
        autoCapitalize={'none'}
        placeholderTextColor={colors.textColor}
        toGetTextFieldValue={onChangeReference}
      />
    </View>
    <CButton
      title={String.nextButton}
      frontIcon={<Ionicons
        name='arrow-forward'
        color={colors.white}
        size={moderateScale(30)}
        style={styles.mh10}
      />}
      type={'B16'}
      disabled={!!checkAmount || !!checkTarget || !!checkToken}
      containerStyle={localStyle.btnStyle}
      onPress={() => onNext(editData)}
    />
    </>
  );
}

const localStyle = StyleSheet.create({
  detailContainer: {
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.p20,
    ...styles.m20,
  },
  inputIcon: {
    width: moderateScale(25),
    height: moderateScale(25),
  },
  noResults: {
    ...styles.p20,
  },
  balance: {
    textAlign: 'right',
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
    ...styles.mv30
  }
});
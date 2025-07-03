import { useSelector } from "react-redux";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import CHeader from "../../../components/common/CHeader";
import String from "../../../i18n/String";
import Ionicons from 'react-native-vector-icons/Ionicons';
import CButton from "../../../components/common/CButton";
import { moderateScale } from "../../../common/constants";
import { styles } from "../../../themes";
import { FlatList, StyleSheet, ToastAndroid, View } from "react-native";
import CListCard from "../../../components/common/CLIstCard";
import CAlert from "../../../components/common/CAlert";
import { StackNav } from "../../../navigation/NavigationKey";
import { useCallback, useMemo, useState } from "react";
import { trucateAddress } from "../../../utils/Address";
import { send, sendCrossChain } from "../../../api/account";
import CLoaderOverlay from "../../../components/common/CLoaderOverlay";
import { nativeTokens } from "../../../api/params";
import { approveGasToPaymaster } from "../../../utils/walletRegister";

export default function SendValidation({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
	const wallet = useSelector(s => s.wallet.payload);
  const tokenBalances = useSelector(state => state.account.tokenBalances);
  const [loading, setLoading] = useState(false);
  
  const {value} = route.params;

  const validationItems = useMemo(() => {
    const truncatedAddr = trucateAddress(value.address, 4);
    const data = [
      {title: value.name ?? String.destination, detail: truncatedAddr, icon: 'person-circle-outline'},
      {title: String.amountToPay, detail: `${value.amount} ${value.tokenSymbol}`, icon: 'logo-usd'},
    ]

    if(value.reference) {
      data.push({title: String.reference, detail: value.reference, icon: 'arrow-down-circle'});
    }

    if(value.targetNetwork) {
      data.push({title: String.chain, detail: nativeTokens[value.targetNetwork].networkName, icon: 'swap-horizontal'});
    }

    return data;
  }, [value]);

  const onCancel = useCallback(() => {
    navigation.navigate(StackNav.TabNavigation);
  }, []);

  const onNext = useCallback(() => {
    setLoading(true);

    const accountToken = tokenBalances.find((token) => 
      token.network === value.network && token.address?.toLowerCase() === value.tokenAddress?.toLowerCase()
    );

    if(value.network === value.targetNetwork) {
      send(
        wallet.privKey,
        wallet.account,
        value.network,
        value.address,
        value.tokenAddress,
        accountToken.decimals,
        value.amount
      ).then(response => {
        setLoading(false);
        navigation.navigate(StackNav.SendSuccess, { response, sendData: {...value, isCrossChain: true} });
      }).catch(error => {
        setLoading(false);
        ToastAndroid.show(String.transactionFailed, ToastAndroid.SHORT);
        console.error(error);
      });
    } else {
      console.log('send cross chain');
      sendCrossChain(
        wallet.privKey,
        wallet.account,
        value.network,
        value.targetNetwork,
        value.address,
        value.tokenAddress,
        accountToken.decimals,
        value.amount
      ).then(response => {
        console.log(response);
        navigation.navigate(StackNav.SendSuccess, { response, sendData: value });
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  return(
    <CSafeAreaView style={localStyle.container}>
      <CHeader title={String.validateData} />
      <View style={styles.mh30}>
        <FlatList
          data={validationItems}
          renderItem={({item, index}) => <CListCard 
            item={{...item, titleSize: 'B20', detailSize: 'B17', iconSize: moderateScale(30), style: localStyle.detailItem}}
            index={index}
          />}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item) => item.title}
        />
      </View>
      <View style={localStyle.bottomContainer}>
        <CAlert
          message={String.payGasTips}
        />
        <CButton
          title={String.confirmButton}
          frontIcon={<Ionicons
            name='arrow-forward'
            color={colors.white}
            size={moderateScale(30)}
            style={styles.mh10}
          />}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          onPress={onNext}
        />
        <CButton
          title={String.cancel}
          type={'B16'}
          variant='outlined'
          containerStyle={localStyle.btnStyle}
          onPress={onCancel}
        />
      </View>
      { loading && <CLoaderOverlay /> }
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  container: {
    ...styles.justifyBetween,
  },
  title: {
    ...styles.selfCenter
  },
  detailItem: {
    ...styles.mv10
  },
  bottomContainer: {
    ...styles.mh20
  },
  btnStyle: {
    ...styles.selfCenter,
    ...styles.mv10
  }
});
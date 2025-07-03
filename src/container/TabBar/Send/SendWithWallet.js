import { useSelector } from "react-redux";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import CHeader from "../../../components/common/CHeader";
import String from "../../../i18n/String";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fonticons from 'react-native-vector-icons/FontAwesome';
import CButton from "../../../components/common/CButton";
import { Image, StyleSheet, ToastAndroid, TouchableOpacity, View } from "react-native";
import { styles } from "../../../themes";
import { moderateScale } from "../../../common/constants";
import { StackNav } from "../../../navigation/NavigationKey";
import CText from "../../../components/common/CText";
import CInput from "../../../components/common/CInput";
import CDropdown from "../../../components/common/CDropdown";
import { useEffect, useMemo, useState } from "react";
import CAlert from "../../../components/common/CAlert";
import typography from "../../../themes/typography";
import { isAddress } from "viem";
import { isWallet } from "../../../api/account";
import CListCard from "../../../components/common/CLIstCard";
import { availableNetworkNames, nativeTokens } from "../../../api/params";
import Decimal from "decimal.js";
import { checkTokenAvailibility } from "../../../api/wormhole";
import CLoaderOverlay from "../../../components/common/CLoaderOverlay";

export default function SendWithWallet({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const tokenBalances = useSelector(state => state.account.tokenBalances);
  const [editData, setEditData] = useState({});
  const [currentBalance, setCurrentBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accountToken = tokenBalances.find((token) => 
      token.network === editData.network && token.address?.toLowerCase() === editData.tokenAddress?.toLowerCase()
    );
    setCurrentBalance(accountToken ? accountToken.balance:'0');
  }, [tokenBalances, editData.network, editData.tokenAddress]);

  const onChangeAddress = (value) => {
    setEditData({
      ...editData,
      address: value,
    });

    if(isAddress(value)) {
      isWallet(value)
        .then(isWallet => {
          if(isWallet) {
            navigation.navigate(StackNav.SendDetails, {
              value: {
                ...editData,
                address: value
              }
            })
          }
        });
    }
  }

  const onChangeToken = (value) => {
		setEditData({
			...editData,
			network: value.network,
      targetNetwork: value.network,
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

  const onChangeNetwork = (value) => {
    setEditData({
      ...editData,
      targetNetwork: value,
    });
  }

  const next = () => {
    if(editData.network === editData.targetNetwork) {
      navigation.navigate(StackNav.SendValidation, {value: {
        ...editData,
      }});
      return;
    }

    setLoading(true);
    checkTokenAvailibility(
      editData.network,
      editData.targetNetwork,
      editData.tokenAddress
    ).then(wrappedToken => {
      console.log(wrappedToken);
      navigation.navigate(StackNav.SendValidation, {value: editData});
    }).catch(error => {
      if(error.message === 'Not available') {
        ToastAndroid.show(String.notAvailable, ToastAndroid.SHORT);
      }
      console.log(error);
    }).finally(() => {
      setLoading(false);
    });
  }

  const openHelp = () => {
    navigation.navigate(StackNav.SendWalletHelp);
  }

  const goToSendWithQR = () => {
    navigation.navigate(StackNav.SendWithQR);
  }

  const goToSendWithID = () => {
    navigation.navigate(StackNav.SendWithID);
  }

  const checkTarget = useMemo(() => {
    if(!editData.address){
      return String.nameRequired;
    }
    if(!isAddress(editData.address)) {
      return String.inputValidAddress;
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

  const checkChain = useMemo(() => {
    if(editData.network !== editData.targetNetwork) {
      return String.crossChainWarning;
    }else{
      return null;
    }
  });

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

  const onRenderNetworkOption = (item, index, onPress) => {
    return (
      <CListCard
        item={{
          title: nativeTokens[item].networkName,
        }}
        index={index}
        onPress={onPress}
      />
    );
  }

  const RightIcons = () => {
    return (
      <View style={localStyle.iconContainer}>
        <TouchableOpacity style={localStyle.iconStyle} onPress={goToSendWithQR}>
          <Ionicons
            name='qr-code'
            color={colors.white}
            size={moderateScale(25)}
            style={styles.mh10}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToSendWithID}>
          <Fonticons
            name='vcard-o'
            color={colors.white}
            size={moderateScale(25)}
            style={styles.mh10}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return(
    <CSafeAreaView style={localStyle.container}>
      <CHeader title={String.sendWithWallet} rightIcon={<RightIcons />} />
      <View style={localStyle.section}>
        <CText type="B14" style={styles.mt10}>
          {String.payTo}
        </CText>
        <CInput
          _value={editData.address}
          _errorText={checkTarget}
          keyBoardType={'default'}
          autoCapitalize={'none'}
          placeholderTextColor={colors.textColor}
          placeholder={String.inputAddress}
          toGetTextFieldValue={onChangeAddress}
        />
        <CText type="B14" style={styles.mt10}>
          {String.tokenToPay}
        </CText>
        <CDropdown
          data={tokenBalances}
          _errorText={checkToken}
          renderItem={onRenderTokenOption}
          dataItemKey={(item) => item.network + item.address}
          value={editData.tokenSymbol}
          onSelected={onChangeToken}
          leftSpace={<Image
            source={{uri: editData.tokenLogo}}
            style={localStyle.inputIcon}
          />}
        />
        <CText type="B14" style={styles.mt10}>
          {String.amountToPay}
        </CText>
        <CInput
          _value={editData.amount}
          _errorText={checkAmount}
          keyBoardType={'default'}
          maxLength={10}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangeAmount}
        />
        { editData.tokenSymbol ?
          <CText style={localStyle.balance}>{`${String.leftBalance} ${currentBalance} ${editData.tokenSymbol}`}</CText>
          : null
        }
        <CText type="B14" style={styles.mt10}>
          {String.chain}
        </CText>
        <CDropdown
          data={availableNetworkNames}
          renderItem={onRenderNetworkOption}
          dataItemKey={(item) => item}
          value={nativeTokens[editData.targetNetwork]?.networkName ?? ''}
          onSelected={onChangeNetwork}
        />
        {checkChain ?
          <CAlert
            message={checkChain}
          /> : null
        }
      </View>
      { loading && <CLoaderOverlay message={String.checkAvailability} /> }

      <View style={[localStyle.section, styles.center]}>
        <CAlert
          message={String.sendWarning}
        />

        <TouchableOpacity onPress={openHelp}>
          <CText style={localStyle.helpText} color={colors.primary}>{String.whatAreWallets}</CText>
        </TouchableOpacity>
        
        <CButton
          title={String.nextButton}
          frontIcon={<Ionicons
            name='arrow-forward'
            color={colors.white}
            size={moderateScale(30)}
            style={styles.mh10}
          />}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          disabled={!!checkAmount || !!checkTarget || !!checkToken}
          onPress={next}
        />
      </View>
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
  section: {
    ...styles.mh20,
  },
  btnStyle: {
    ...styles.selfCenter,
  },
  iconContainer: {
    ...styles.flexRow,
    ...styles.center,
  },
  inputIcon: {
    width: moderateScale(25),
    height: moderateScale(25),
  },
  helpText: {
    ...typography.fontSizes.f20,
    ...typography.fontWeights.Bold
  },
  balance: {
    textAlign: 'right',
  },
});
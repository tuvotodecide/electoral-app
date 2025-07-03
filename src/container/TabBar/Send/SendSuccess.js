import {useSelector} from 'react-redux';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {FlatList, Linking, StyleSheet, ToastAndroid, View} from 'react-native';
import {moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CButton from '../../../components/common/CButton';
import CText from '../../../components/common/CText';
import CDivider from '../../../components/common/CDivider';
import CListCard from '../../../components/common/CLIstCard';
import Clipboard from '@react-native-clipboard/clipboard';
import {StackNav} from '../../../navigation/NavigationKey';
import {useMemo} from 'react';
import {trucateAddress} from '../../../utils/Address';
import {availableNetworks} from '../../../api/params';

export default function SendSuccess({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const wallet = useSelector(s => s.wallet.payload);
  const {response, sendData} = route.params;

  const openUrl = async () => {
    const url =
      availableNetworks[sendData.network].explorer +
      '/tx/' +
      response.receipt.receipt.transactionHash;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Clipboard.setString(url);
      ToastAndroid.show(String.hashLinkCopied, ToastAndroid.SHORT);
    }
  };

  const onBackHome = () => {
    navigation.navigate(StackNav.TabNavigation);
  };

  const sendItems = useMemo(() => {
    const items = [
      {
        title: String.origin,
        detail: wallet.name,
        icon: 'person-circle-outline',
      },
      {
        title: String.destination,
        detail: sendData.name ?? trucateAddress(sendData.address, 4),
        icon: 'wallet-outline',
      },
      {
        title: String.reference,
        detail: sendData.reference,
        icon: 'albums-outline',
      },
      {
        title: String.hasTransaction,
        detail: trucateAddress(response.receipt.receipt.transactionHash, 5),
        icon: 'key-outline',
        value: (
          <Ionicons
            name="arrow-up-right-box-outline"
            color={colors.primary}
            size={moderateScale(22)}
            onPress={openUrl}
          />
        ),
      },
    ];

    return items;
  }, [response, sendData]);

  return (
    <CSafeAreaView style={localStyle.container}>
      <CHeader isHideBack />
      <View style={localStyle.mainData}>
        <Ionicons
          name="checkmark-circle-outline"
          color={colors.green}
          size={moderateScale(100)}
        />
        <CText style={localStyle.title}>{String.sendSuccess}</CText>
        <CText type="B20" color={colors.grayScale500}>
          {response.date}
        </CText>
        <CDivider style={localStyle.divider} />
        <CText type="B20" color={colors.grayScale500}>
          {String.totalSend}
        </CText>
        <CText style={localStyle.title}>
          {sendData.amount} {sendData.tokenSymbol}
        </CText>
        {sendData.isCrossChain ? (
          <CText type="B20" color={colors.grayScale500}>
            {String.crossChainSendSuccess}
          </CText>
        ) : null}
        <CDivider style={localStyle.divider} />
      </View>

      <View style={localStyle.bottomContainer}>
        <FlatList
          data={sendItems}
          renderItem={({item, index}) => (
            <CListCard
              item={{
                ...item,
                titleSize: 'B15',
                detailSize: 'B12',
                iconSize: moderateScale(30),
              }}
              index={index}
            />
          )}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={item => item.title}
        />
      </View>

      <View style={localStyle.bottomContainer}>
        <CButton
          title={String.share}
          frontIcon={
            <Ionicons
              name="share-social-outline"
              color={colors.white}
              size={moderateScale(30)}
              style={styles.mh10}
            />
          }
          type={'B16'}
          containerStyle={localStyle.btnStyle}
        />
        <CButton
          title={String.backToHome}
          frontIcon={
            <Ionicons
              name="home-outline"
              color={colors.primary}
              size={moderateScale(30)}
              style={styles.mh10}
            />
          }
          type={'B16'}
          variant="outlined"
          containerStyle={localStyle.btnStyle}
          onPress={onBackHome}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  container: {
    ...styles.justifyBetween,
  },
  mainData: {
    ...styles.flexCenter,
    ...styles.p20,
    gap: moderateScale(5),
  },
  divider: {
    alignSelf: 'stretch',
  },
  sendItem: {
    ...styles.mv10,
  },
  title: {
    ...styles.boldText,
    fontSize: moderateScale(30),
  },
  bottomContainer: {
    ...styles.mh20,
  },
  btnStyle: {
    ...styles.selfCenter,
    ...styles.mv10,
  },
});

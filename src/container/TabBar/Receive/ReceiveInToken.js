import { useSelector } from "react-redux";
import CButton from "../../../components/common/CButton";
import QRDetails from "../../../components/QR/QRDetails";
import String from "../../../i18n/String";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from "../../../common/constants";
import { StyleSheet, ToastAndroid, View } from "react-native";
import { styles } from "../../../themes";
import CText from "../../../components/common/CText";
import Clipboard from "@react-native-clipboard/clipboard";
import { StackNav } from "../../../navigation/NavigationKey";
import { useRef } from "react";
import Share from 'react-native-share';
import { trucateAddress } from "../../../utils/Address";

export default function ReceiveInToken({navigation}) {
  const colors = useSelector(state => state.theme.theme);
	const account = useSelector(state => state.account);
	const wallet = useSelector(s => s.wallet.payload);
	console.log(wallet);
	const qrData = useSelector(state => state.receiveToken);

	const svgRef = useRef(null);
	
	const onShareQr = () => {
		svgRef.current.toDataURL((dataURL) => {
			Share.open({
				url: 'data:image/png;base64,' + dataURL
			});
		});
	}

	const copyAddress = () => {
		Clipboard.setString(wallet.account);
		ToastAndroid.show(String.addressCopied, ToastAndroid.SHORT);
	}

	const UserAddress = () => {
		const truncatedAddress = trucateAddress(wallet.account, 4);

		return(
			<View style={localStyle.userAddress}>
				<CText type={'M14'} color={colors.textColor}>
					{truncatedAddress}
				</CText>
				<Ionicons
					name='copy'
					color={colors.primary}
					size={moderateScale(20)}
					onPress={copyAddress}
				/>
			</View>
		);
	}

  return(
    <View style={localStyle.container}>
      <QRDetails
				getRef={(c) => svgRef.current = c}
				qrData={JSON.stringify({
					...qrData,
					name: account.name,
					address: wallet.account,
				})}
				data={[
					{title: String.payTo, value: account.name, icon: 'person-circle-outline'},
					{title: String.userAddress, value: <UserAddress/>, icon: 'wallet'},
					{title: String.receiveToken, value: qrData.tokenSymbol, icon: 'logo-usd'},
					{title: String.amountToReceive, value: qrData.amount !== '0' ? qrData.amount:'No establecido', icon: 'logo-usd'},
				]}
			/>
			<CButton
				title={String.editQRinfo}
				frontIcon={<Ionicons
					name='pencil'
					color={colors.primary}
					size={moderateScale(30)}
					style={styles.mh10}
				/>}
				type={'B16'}
				variant='outlined'
				color={colors.textColor}
				containerStyle={localStyle.btnStyle}
				onPress={() => navigation.navigate(StackNav.ReceiveTokenDetails)}
			/>
			<CButton
				title={String.share}
				onPress={onShareQr}
				frontIcon={<Ionicons
					name='share-social-outline'
					color={colors.primary}
					size={moderateScale(30)}
					style={styles.mh10}
				/>}
				type={'B16'}
				variant='outlined'
				color={colors.textColor}
				containerStyle={localStyle.btnStyle}
			/>
			<CButton
				title={String.downloadImage}
				frontIcon={<Ionicons
					name='arrow-down-circle'
					color={colors.white}
					size={moderateScale(30)}
					style={styles.mh10}
				/>}
				type={'B16'}
				containerStyle={localStyle.btnStyle}
			/>
    </View>
  );
}

const localStyle = StyleSheet.create({
	container: {
		...styles.justifyBetween,
		flexGrow: 1,
	},
  btnStyle: {
    width: '90%',
    ...styles.mv1,
    ...styles.selfCenter,
  },
	userAddress: {
		...styles.rowEnd,
		gap: moderateScale(10),
	}
});
import { useSelector } from "react-redux";
import CButton from "../../../components/common/CButton";
import QRDetails from "../../../components/QR/QRDetails";
import String from "../../../i18n/String";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from "../../../common/constants";
import { StyleSheet, View } from "react-native";
import { styles } from "../../../themes";
import { StackNav } from "../../../navigation/NavigationKey";
import Decimal from "decimal.js";
import Share from 'react-native-share';
import { useRef } from "react";

export default function ReceiveInBs({navigation}) {
  const colors = useSelector(state => state.theme.theme);
	const qrData = useSelector(state => state.receiveBs);
	const marketCap = '16.9';

	const svgRef = useRef(null);
	
	const onShareQr = () => {
		svgRef.current.toDataURL((dataURL) => {
			Share.open({
				url: 'data:image/png;base64,' + dataURL
			});
		});
	}

  return(
    <View style={localStyle.container}>
      <QRDetails
				getRef={(c) => svgRef.current = c}
				qrData={JSON.stringify(qrData)}
				data={[
					{title: String.payTo, value: 'Eddy Soto', icon: 'person-circle-outline'},
					{title: String.amountToPay, value: qrData.amount + ' Bs.', icon: 'logo-usd'},
					{
						title: String.amountToReceive,
						value: Decimal(qrData.amount).div(marketCap).toDP(6, Decimal.ROUND_DOWN).toString() + ' USDT',
						icon: 'arrow-down-circle'
					},
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
				onPress={() => navigation.navigate(StackNav.ReceiveDetails)}
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
});
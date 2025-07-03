import { Image, StyleSheet, View } from "react-native";
import CHeader from "../../../components/common/CHeader";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import Ionicons from 'react-native-vector-icons/Ionicons';

import String from '../../../i18n/String';
import { styles } from "../../../themes";
import { moderateScale } from "../../../common/constants";
import { useSelector } from "react-redux";
import CText from "../../../components/common/CText";
import CInput from "../../../components/common/CInput";
import images from "../../../assets/images";
import CButton from "../../../components/common/CButton";

export default function PurchaseDetails() {
  const colors = useSelector(state => state.theme.theme);
  
	return(
		<CSafeAreaView style={localStyle.container}>
			<CHeader title={String.tokenPurchaseTitle} />
			<View style={{...localStyle.detailContainer, borderColor: colors.grayScale700}}>
				<CText type="B14" style={styles.mt10}>
					{String.amountToPay}
				</CText>
				<CInput
					keyBoardType={'default'}
					maxLength={10}
					autoCapitalize={'none'}
					placeholderTextColor={colors.textColor}
					rightAccessory={() => <CText>Bs.</CText>}
          toGetTextFieldValue={() => {}}
				/>
				<CText type="B14" style={styles.mt10}>
					{String.amountToReceive}
				</CText>
				<CInput
					keyBoardType={'default'}
					maxLength={10}
					autoCapitalize={'none'}
					placeholderTextColor={colors.textColor}
					insideLeftIcon={() => <Image
						source={images.TetherImage}
						style={localStyle.inputIcon}
					/>}
					rightAccessory={() => <CText>USDT</CText>}
          toGetTextFieldValue={() => {}}
				/>
				<CText style={localStyle.quoteText}>1 USDT = 16.3 Bs.</CText>
			</View>
			<CButton
				title={String.generateQr}
				frontIcon={<Ionicons
					name='qr-code'
					color={colors.white}
					size={moderateScale(30)}
					style={styles.mh10}
				/>}
				type={'B16'}
				containerStyle={localStyle.btnStyle}
			/>
		</CSafeAreaView>
	);
}

const localStyle = StyleSheet.create({
	container: {
		...styles.justifyBetween,
	},
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
	quoteText: {
		textAlign: 'right',
	},
	btnStyle: {
		width: '90%',
		...styles.selfCenter,
		...styles.mv30
	}
});
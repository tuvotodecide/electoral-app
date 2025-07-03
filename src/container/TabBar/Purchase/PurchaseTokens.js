import React from 'react';
import { StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CHeader from "../../../components/common/CHeader";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import {styles} from '../../../themes';
import String from '../../../i18n/String';
import QRDetails from '../../../components/QR/QRDetails';
import images from '../../../assets/images';
import CButton from '../../../components/common/CButton';
import { useSelector } from 'react-redux';
import { moderateScale } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKey';

export default function PurchaseTokens({navigation}) {
  const colors = useSelector(state => state.theme.theme);

	return (
		<CSafeAreaView style={localStyle.mainViewContainer}>
			<CHeader title={String.receiveWithQR} />
			<QRDetails
				image={images.SampleQRImage}
				data={[
					{title: String.payTo, value: 'Eddy Soto Cruz', icon: 'person-circle-outline'},
					{title: String.amountToPay, value: String.amountNotSet + ' Bs', icon: 'logo-usd'},
					{title: String.expiry, value: '8 de mayo de 2025', icon: 'arrow-down-circle'},
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
				onPress={() => navigation.navigate(StackNav.PurchaseDetails)}
			/>
			<CButton
				title={String.share}
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
		</CSafeAreaView>
	);
}

const localStyle = StyleSheet.create({
	mainViewContainer: {
		...styles.justifyBetween,
		...styles.pb20
	},
	btnStyle: {
		width: '90%',
		...styles.mv1,
		...styles.selfCenter,
	},
});
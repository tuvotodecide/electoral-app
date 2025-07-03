import CText from "../common/CText";
import String from "../../i18n/String";
import { Modal, Portal, Surface } from "react-native-paper";
import Ionicon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from "../../common/constants";
import { useSelector } from "react-redux";
import { styles } from "../../themes";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useCallback } from "react";
import { StackNav } from "../../navigation/NavigationKey";

export default function WalletBottomSheet({
	navigation,
	open = false,
	onCloseModal
}) {
  const colors = useSelector(state => state.theme.theme);

	const goToReceive = useCallback(() => {
		onCloseModal();
		navigation.navigate(StackNav.ReceiveWithQR)
	}, []);

	const goToSend = useCallback(() => {
		onCloseModal();
		navigation.navigate(StackNav.SendWithQR)
	}, [])

	return(
		<Portal>
			<Modal
				visible={open}
				dismissable
				onDismiss={onCloseModal}
				contentContainerStyle={{
					...localStyles.modal,
					backgroundColor: colors.backgroundColor,
				}}
			>
				<CText style={localStyles.title}>{String.selectOption}</CText>
				<View style={styles.rowSpaceAround}>
					<TouchableOpacity
						style={{backgroundColor: colors.transparent,...localStyles.option}}
						onPress={goToReceive}
					>
						<Ionicon
							name="qr-code-outline"
							size={moderateScale(70)}
							color={colors.primary}
							style={{
								...localStyles.icon,
								borderColor: colors.primary2
							}}
						/>
						<CText style={localStyles.optionText}>{String.walletReceive}</CText>
					</TouchableOpacity>
					<TouchableOpacity
						style={{backgroundColor: colors.transparent,...localStyles.option}}
						onPress={goToSend}
					>
						<Ionicon
							name="scan-circle-outline"
							size={moderateScale(70)}
							color={colors.primary}
							style={{
								...localStyles.icon,
								borderColor: colors.primary2
							}}
						/>
						<CText style={localStyles.optionText}>{String.walletSend}</CText>
					</TouchableOpacity>
				</View>
			</Modal>
		</Portal>	
	);
}

const localStyles = StyleSheet.create({
	modal: {
		...styles.p20,
		...styles.mh20,
		borderRadius: moderateScale(20),
	},
	title: {
		...styles.mb20,
		...styles.boldText,
		fontSize: moderateScale(20)
	},
	option: {
		...styles.p10,
		borderRadius: moderateScale(10),
		borderWidth: moderateScale(1),
		borderColor: 'gray',
	},
	icon: {
		...styles.p10,
		borderWidth: moderateScale(1),
		borderRadius: moderateScale(10),
	},
	optionText: {
		...styles.pt10,
		...styles.selfCenter,
		...styles.boldText,
		fontSize: moderateScale(15),
	}
})
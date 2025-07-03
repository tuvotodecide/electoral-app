import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { getHeight, moderateScale } from "../../common/constants";
import { styles } from "../../themes";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Modal, Portal } from "react-native-paper";
import { useState } from "react";
import CListCard from "./CLIstCard";
import typography from "../../themes/typography";
import CText from "./CText";

export default function CDropdown({
  data = [],
	dataItemKey = (item) => item.id,
	renderItem,
	onSelected = () => {},
	leftSpace,
	value,
	_errorText,
	errorStyle,
}) {
  const colors = useSelector(state => state.theme.theme);
	const [visible, setVisible] = useState(false);

	const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

	const handlePress = (item) => {
		hideModal();
		onSelected(item);
	}

	const onRenderItem = ({item, index}) => {
		return renderItem ? renderItem(item, index, () => handlePress(item)) : <CListCard item={item} index={index} onPress={() => handlePress(item)} />
	}

	return(
		<View>
			<Pressable style={[localStyle.inputContainer, {backgroundColor: colors.inputBackground}]} onPress={showModal}>
				{leftSpace ?
					<View style={styles.ml15}>
						{leftSpace}
					</View>
					: null
				}
				<CText style={localStyle.inputBox}>
					{value}
				</CText>
				<Ionicons
					style={[styles.mr15]}
					name='chevron-down'
					size={moderateScale(22)}
					color={colors.primary}
				/>
				<Portal>
					<Modal
						visible={visible}
						onDismiss={hideModal}
						contentContainerStyle={[localStyle.selectModal, {backgroundColor: colors.inputBackground}]}
					>
						<FlatList
							data={data}
							renderItem={onRenderItem}
							keyExtractor={dataItemKey}
						/>
					</Modal>
				</Portal>
			</Pressable>
			{_errorText && _errorText != '' ? (
				<CText
					style={{
						...localStyle.errorText,
						...errorStyle,
						color: colors.alertColor,
					}}>
					{_errorText}
				</CText>
			) : null}
		</View>
	)
}

const localStyle = StyleSheet.create({
	inputContainer: {
		borderRadius: moderateScale(12),
		...styles.rowSpaceBetween,
		...styles.mt5,
		width: '100%',
		...styles.selfCenter,
	},
	inputBox: {
    ...typography.fontSizes.f16,
    ...typography.fontWeights.Regular,
    ...styles.ph10,
    ...styles.flex,
		verticalAlign: 'middle',
    borderRadius: moderateScale(24),
    width: '90%',
		height: getHeight(52),
    ...styles.selfCenter,
  },
	selectModal: {
		...styles.p20,
		...styles.mh20,
		borderRadius: moderateScale(20),
	},
	errorText: {
    ...typography.fontSizes.f12,
    ...styles.mt5,
    ...styles.ml5,
  },
});
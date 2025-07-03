import { useSelector } from "react-redux";
import String from "../../../i18n/String";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import CHeader from "../../../components/common/CHeader";
import QRDetails from "../../../components/QR/QRDetails";
import CButton from "../../../components/common/CButton";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { styles } from "../../../themes";
import images from "../../../assets/images";
import { useState } from "react";
import CText from "../../../components/common/CText";
import ReceiveInBs from "./ReceiveInBs";
import { moderateScale } from "../../../common/constants";
import ReceiveInToken from "./ReceiveInToken";

const options = [
	{
		id: 1,
		title: String.receiveWithBs,
	},
	{
		id: 2,
		title: String.receiveWithTokens,
	}
];

export default function ReceiveWithQR({navigation}) {
  const colors = useSelector(state => state.theme.theme);
	const [option, setOption] = useState(options[0]);

	const ReceiveOption = ({item}) => {
		const isSelect = option.id === item.id;

		return (
			<TouchableOpacity
				onPress={() => setOption(item)}
				style={[
					localStyle.itemContainer,
					{
						backgroundColor:
							isSelect ? colors.primary : colors.inputBackground,
					},
				]}>
				<CText
					type={'M14'}
					align={'center'}
					color={isSelect ? colors.white : colors.grayScale400}
					style={styles.mh15}>
					{item.title}
				</CText>
			</TouchableOpacity>
		);
	};

	const RenderOption = () => {
		if(option.id === 1) {
			return <ReceiveInBs navigation={navigation} />
		} else if(option.id === 2) {
			return <ReceiveInToken navigation={navigation}/>
		}
	}

	return (
		<CSafeAreaView style={localStyle.mainViewContainer}>
			<CHeader title={String.receiveWithQR}/>
			<FlatList
				data={options}
				renderItem={ReceiveOption}
				horizontal
				keyExtractor={(item) => item.id}
				style={localStyle.options}
			/>
			<RenderOption />
		</CSafeAreaView>
	);
}

const localStyle = StyleSheet.create({
	mainViewContainer: {
		...styles.flex,
		...styles.pb20,
	},
	options: {
		flexGrow: 0,
		...styles.selfCenter
	},
	itemContainer: {
    ...styles.center,
    borderRadius: moderateScale(10),
    height: moderateScale(40),
    ...styles.mr10,
    ...styles.mv10,
    ...styles.flexRow,
    ...styles.ph10,
  },
});
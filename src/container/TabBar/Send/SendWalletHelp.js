import { StyleSheet } from "react-native";
import CHeader from "../../../components/common/CHeader";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import CText from "../../../components/common/CText";
import String from "../../../i18n/String";
import { styles } from "../../../themes";
import typography from "../../../themes/typography";

export default function SendWalletHelp() {
	return(
		<CSafeAreaView>
			<CHeader title={String.sendWithId}/>
			<CText style={localStyle.text}>
				{String.walletExplainP1}
			</CText>
			<CText style={localStyle.text}>
				{String.walletExplainP2}
			</CText>
			<CText style={localStyle.text}>
				{String.walletExplainP3}
			</CText>
			<CText style={localStyle.text}>
				{String.walletExplainP4}
			</CText>
			<CText style={localStyle.text}>
				{String.walletExplain}
			</CText>
		</CSafeAreaView>
	);
}

const localStyle = StyleSheet.create({
	text: {
		...styles.ph25,
		...styles.pv10,
		...typography.fontSizes.f16
	}
});
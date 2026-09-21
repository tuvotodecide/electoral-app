import { ActivityIndicator, StyleSheet, View } from "react-native";
import CText from "./CText";
import String from "../../i18n/String";
import { useSelector } from "react-redux";
import { styles } from "../../themes";

export default function CLoaderOverlay({message = String.loading}) {
  const colors = useSelector(state => state.theme.theme);

  return(
    <View style={localStyle.loadingOverlay}>
      <ActivityIndicator size="large" color={colors.white} />
      <CText type="B16" color={colors.white} style={styles.mt10}>
        {message}
      </CText>
    </View>
  );
}

const localStyle = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
})
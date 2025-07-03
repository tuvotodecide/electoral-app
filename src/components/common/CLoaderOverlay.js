import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
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

const {width, height} = Dimensions.get('window');

const localStyle = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
})
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { moderateScale } from "../../common/constants";
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from "./CText";
import { styles } from "../../themes";

export default function CUserCard({
  ionIcon,
  name,
  data,
}) {
  const colors = useSelector(state => state.theme.theme);

  return(
    <View style={{backgroundColor: colors.primaryTransparent, ...localStyles.receiver}}>
      <Ionicons
        name={ionIcon}
        color={colors.primary}
        size={moderateScale(30)}
      />
      <View>
        <CText color={colors.textColor} style={styles.boldText}>{name}</CText>
        { data ?
          <CText color={colors.textColor}>{data}</CText> : null
        }
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  receiver: {
    borderRadius: moderateScale(12),
    ...styles.p20,
    ...styles.mv20,
    ...styles.rowStart,
    gap: moderateScale(20),
  },
})
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux";

export function CCopyIcon({copyValue}) {
  const colors = useSelector(state => state.theme.theme);
  const [copied, setCopied] = useState(false);

  const onPress = async () => {
    if (copyValue) {
      await Clipboard.setStringAsync(copyValue);
      setCopied(true);
    }
  }

  return (
    <TouchableOpacity onPress={onPress} style={localStyle.copyIconContainer}>
      <MaterialIcons name={copied ? "check" : "content-copy"} size={20} color={colors.primary} />
    </TouchableOpacity>
  );
}

const localStyle = StyleSheet.create({
  copyIconContainer: {
  },
});
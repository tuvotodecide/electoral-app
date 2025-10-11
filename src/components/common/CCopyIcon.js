import Clipboard from "@react-native-clipboard/clipboard";
import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux";

export function CCopyIcon({copyValue}) {
  const colors = useSelector(state => state.theme.theme);
  const [copied, setCopied] = useState(false);

  const onPress = () => {
    if (copyValue) {
      Clipboard.setString(copyValue);
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
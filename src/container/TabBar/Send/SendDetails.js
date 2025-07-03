import CSafeAreaView from "../../../components/common/CSafeAreaView";
import CHeader from "../../../components/common/CHeader";
import String from "../../../i18n/String";
import { StyleSheet } from "react-native";
import { styles } from "../../../themes";
import { StackNav } from "../../../navigation/NavigationKey";
import ReceiverInfo from "../../../components/send/ReceiverInfo";

export default function SendDetails({navigation, route}) {
  const {value} = route.params;

  const next = (confirmData) => {
    navigation.navigate(StackNav.SendValidation, {value: confirmData});
  }

  return(
    <CSafeAreaView style={localStyle.container}>
      <CHeader title={String.pay} />
      <ReceiverInfo
        data={value}
        onNext={next}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  container: {
    ...styles.justifyBetween,
  },
  title: {
    ...styles.selfCenter
  },
});
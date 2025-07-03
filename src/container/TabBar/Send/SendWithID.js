import { useSelector } from "react-redux";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import CHeader from "../../../components/common/CHeader";
import String from "../../../i18n/String";
import Ionicons from 'react-native-vector-icons/Ionicons';
import CButton from "../../../components/common/CButton";
import { StyleSheet, ToastAndroid, TouchableOpacity, View } from "react-native";
import { styles } from "../../../themes";
import { moderateScale } from "../../../common/constants";
import { StackNav } from "../../../navigation/NavigationKey";
import ReceiverInfo from "../../../components/send/ReceiverInfo";
import CText from "../../../components/common/CText";
import CInput from "../../../components/common/CInput";
import { useState } from "react";
import { Http } from "../../../data/client/http";
import { API_ENDPOINTS } from "../../../data/client/api-endpoints";
import { ScrollView } from "react-native-gesture-handler";


export default function SendWithID({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [search, setSearch] = useState('');
  const [editData, setEditData] = useState({});

  const onSearch = async () => {
    try {
      const response = await Http.post(`${API_ENDPOINTS.KYC}/${API_ENDPOINTS.FIND_PUBLIC}`,
        { identifier: search },
        { withCredentials: true }
      );
      if(!response.ok) {
        ToastAndroid.show(response.message, ToastAndroid.SHORT);
      }
      setEditData({
        ...editData,
        name: response.fullName,
        address: response.accountAddress,
      })
    } catch (error) {
      ToastAndroid.show(String.searchFailed, ToastAndroid.SHORT);
      console.error(error);
    }
  }

  const goToSendWithQR = () => {
    navigation.navigate(StackNav.SendWithQR);
  }

  const goToSendWithWallet = () => {
    navigation.navigate(StackNav.SendWithWallet);
  }

  const next = (confirmData) => {
    navigation.navigate(StackNav.SendValidation, {value: confirmData});
  }

  const RightIcons = () => {
    return (
      <View style={localStyle.iconContainer}>
        <TouchableOpacity style={localStyle.iconStyle} onPress={goToSendWithQR}>
          <Ionicons
            name='qr-code'
            color={colors.white}
            size={moderateScale(25)}
            style={styles.mh10}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToSendWithWallet}>
          <Ionicons
            name='wallet'
            color={colors.white}
            size={moderateScale(25)}
            style={styles.mh10}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return(
    <CSafeAreaView style={localStyle.container}>
      <ScrollView>
        <CHeader title={String.sendWithId} rightIcon={<RightIcons />} />
        <View style={localStyle.search}>
          <CText type="B14" style={styles.mt10}>
            {String.inputID}
          </CText>
          <CInput
            selectTextOnFocus
            keyBoardType={'default'}
            maxLength={10}
            autoCapitalize={'none'}
            placeholderTextColor={colors.textColor}
            rightAccessory={() => 
              <TouchableOpacity onPress={onSearch}>
                <Ionicons
                  name='search'
                  color={colors.white}
                  size={moderateScale(22)}
                />
              </TouchableOpacity>
            }
            toGetTextFieldValue={setSearch}
          />
        </View>
        
        <ReceiverInfo data={editData} onNext={next} />
      </ScrollView>
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
  search: {
    ...styles.mh20,
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
    ...styles.mv30
  },
  iconContainer: {
    ...styles.flexRow,
    ...styles.center,
  },
});
import { StyleSheet, ToastAndroid, TouchableOpacity, View } from "react-native";
import CHeader from "../../../components/common/CHeader";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import String from "../../../i18n/String";
import { styles } from "../../../themes";
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from "react-native-vision-camera";
import { useEffect, useState } from "react";
import CText from "../../../components/common/CText";
import CButton from "../../../components/common/CButton";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fonticons from 'react-native-vector-icons/FontAwesome';
import { useSelector } from "react-redux";
import { moderateScale } from "../../../common/constants";
import { StackNav } from "../../../navigation/NavigationKey";
import { launchImageLibrary } from "react-native-image-picker";
import BarcodeScanning from "@react-native-ml-kit/barcode-scanning";

export default function SendWithQR({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [cameraActive, setCameraActive] = useState(true);

  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {goToValidationData(codes)},
  });

  const goToValidationData = (codes) => {
    const value = JSON.parse(codes[0].value);
    navigation.navigate(StackNav.SendDetails, {value});
  }

  const goToSendWithID = () => {
    navigation.navigate(StackNav.SendWithID);
  }

  const goToSendWithWallet = () => {
    navigation.navigate(StackNav.SendWithWallet);
  }

  const onSelectFromGallery = () => {
    setCameraActive(false);
    launchImageLibrary({mediaType: 'photo'}, (respone) => {
      if(respone.didCancel) {
        setCameraActive(true);
      }else if(respone.errorMessage) {
        setCameraActive(true);
        console.error(respone.errorMessage);
      }else{
        BarcodeScanning.scan(respone.assets[0].uri)
        .then((barcodes) => {
          if(barcodes[0]){
            goToValidationData(barcodes);
          } else {
            setCameraActive(true);
            ToastAndroid.show(String.notQRdetected, ToastAndroid.SHORT);
          }
        });
      }
    });
  }

  useEffect(() => {
    if(!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const renderCamera = () => {
    if(!hasPermission) {
      return <CText>{String.cameraNotAllowed}</CText>;
    }
    if(device == null){
      return <CText>{String.cameraNotFount}</CText>;
    }
    return <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={cameraActive}
      codeScanner={codeScanner}
    />
  }

  const RightIcons = () => {
    return (
      <View style={localStyle.iconContainer}>
        <TouchableOpacity style={localStyle.iconStyle} onPress={goToSendWithID}>
          <Fonticons
            name='vcard-o'
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
      {renderCamera()}
      <CHeader title={String.sendWithQR} rightIcon={<RightIcons />} />
      <CButton
        title={String.selectFromDevice}
        onPress={onSelectFromGallery}
        frontIcon={<Ionicons
          name='cloud-upload-outline'
          color={colors.white}
          size={moderateScale(30)}
          style={styles.mh10}
        />}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  container: {
    ...styles.justifyBetween,
  },
  camera: {
    ...styles.selfCenter,
    height: '50%',
    width: '70%'
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
  iconStyle: {
    ...styles.mr10,
  },
});
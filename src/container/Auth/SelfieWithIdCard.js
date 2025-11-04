import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useRef} from 'react';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import {styles} from '../../themes';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import {useSelector} from 'react-redux';
import TakePictureModal from '../../components/modal/TakePictureModal';
import CButton from '../../components/common/CButton';
import images from '../../assets/images';
import {AuthNav} from '../../navigation/NavigationKey';
import {deviceHeight, getHeight, moderateScale} from '../../common/constants';


export default function SelfieWithIdCard({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const SheetRef = useRef(null);
  const onPressImage = () => {
    SheetRef?.current?.show();
  };

  const onPressContinue = () => {
    navigation.navigate(AuthNav.VerifySuccess);
  };
  return (
    <CSafeAreaViewAuth testID="selfieWithIdCardContainer">
      <CHeader testID="selfieWithIdCardHeader" />
      <View style={localStyle.mainContainer} testID="selfieWithIdCardMainContainer">
        <View style={{height: '90%'}} testID="selfieWithIdCardContentContainer">
          <CText type={'B24'} testID="selfieWithIdCardTitle">{String.takeSelfieWithIDCard}</CText>
          <CText type={'R14'} color={colors.grayScale500} testID="selfieWithIdCardDescription">
            {String.pleaseLookAtCameraAndHoldStill}
          </CText>
          <TouchableOpacity onPress={onPressImage} testID="selfieWithIdCardImageButton">
            <Image
              source={images.TakePictureIdImage}
              style={localStyle.pictureImage}
              testID="selfieWithIdCardImage"
            />
          </TouchableOpacity>
        </View>
        <CButton
          title={String.continue}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          onPress={onPressContinue}
          testID="selfieWithIdCardContinueButton"
        />
      </View>
      <TakePictureModal SheetRef={SheetRef} testID="selfieWithIdCardModal" />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyBetween,
    ...styles.flex,
  },
  pictureImage: {
    width: '100%',
    height: deviceHeight - moderateScale(300),
    position: 'relative',
    bottom: 0,
  },
});

import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useRef} from 'react';

// custom import
import CSafeAreaView from '../../components/common/CSafeAreaView';
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
    <CSafeAreaView>
      <CHeader />
      <View style={localStyle.mainContainer}>
        <View style={{height: '90%'}}>
          <CText type={'B24'}>{String.takeSelfieWithIDCard}</CText>
          <CText type={'R14'} color={colors.grayScale500}>
            {String.pleaseLookAtCameraAndHoldStill}
          </CText>
          <TouchableOpacity onPress={onPressImage}>
            <Image
              source={images.TakePictureIdImage}
              style={localStyle.pictureImage}
            />
          </TouchableOpacity>
        </View>
        <CButton
          title={String.continue}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          onPress={onPressContinue}
        />
      </View>
      <TakePictureModal SheetRef={SheetRef} />
    </CSafeAreaView>
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

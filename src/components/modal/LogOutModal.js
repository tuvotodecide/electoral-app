import {Image, Modal, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';
import String from '../../i18n/String';
import CButton from '../common/CButton';
import {styles} from '../../themes';
import images from '../../assets/images';

export default function LogOutModal(props) {
  const colors = useSelector(state => state.theme.theme);

  let {visible, onPressCancel, onPressLogOut} = props;
  return (
    <Modal testID="logOutModal" visible={visible} animationType="slide" transparent={true}>
      <View
        testID="logOutModalOverlay"
        style={[
          localStyle.mainViewStyle,
          {backgroundColor: colors.modalBackground},
        ]}>
        <View
          testID="logOutModalContainer"
          style={[
            localStyle.modalContainer,
            {backgroundColor: colors.backgroundColor},
          ]}>
          <Image testID="logOutModalImage" source={images.LogOutImage} style={localStyle.imageStyle} />
          <CText testID="logOutModalTitle" type={'B18'} align={'center'}>
            {String.areYouSureWantToLogout}
          </CText>

          <CButton
            testID="logOutModalCancelButton"
            title={String.cancel}
            type={'M16'}
            containerStyle={localStyle.btnStyle}
            onPress={onPressCancel}
            sinMargen
          />

          <CButton
            testID="logOutModalLogOutButton"
            title={String.logOut}
            type={'M16'}
            containerStyle={localStyle.btnStyle}
            onPress={onPressLogOut}
            sinMargen
            variant={'outlined'}
          />
        </View>
      </View>
    </Modal>
  );
}

const localStyle = StyleSheet.create({
  mainViewStyle: {
    ...styles.flex,
    ...styles.center,
  },
  modalContainer: {
    width: '80%',
    borderRadius: moderateScale(16),
    ...styles.ph20,
    ...styles.pv30,
  },
  imageStyle: {
    height: moderateScale(120),
    width: moderateScale(120),
    ...styles.mb30,
    ...styles.selfCenter,
  },
  btnStyle: {
    ...styles.selfCenter,
    width: '70%',
    ...styles.mt10,
  },
});

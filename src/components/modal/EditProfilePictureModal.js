import {StyleSheet, View, Modal} from 'react-native';
import React from 'react';

// custom import
import CText from '../common/CText';
import String from '../../i18n/String';
import {TouchableOpacity} from 'react-native';
import {
  CameraIcon,
  CameraIcon_Dark,
  FileIcon,
  FileIcon_Dark,
  RemoveIcon,
} from '../../assets/svg';
import {useSelector} from 'react-redux';
import {styles} from '../../themes';
import {deviceWidth, moderateScale} from '../../common/constants';

export default function EditProfilePictureModal(props) {
  const colors = useSelector(state => state.theme.theme);
  let {visible, onPressCamera, onPressGallery, onPressDeletePhoto} = props;

  const PhotoChoose = ({color, onPress, svgIcon, title, bgColor}) => {
    return (
      <TouchableOpacity style={localStyle.boxStyle} onPress={onPress}>
        <View style={[localStyle.innerViewContainer]}>
          <View
            style={[
              localStyle.iconBackground,
              {
                backgroundColor: bgColor ? bgColor : colors.primary,
              },
            ]}>
            {svgIcon}
          </View>
          <CText type={'B14'} color={color} style={styles.ml10}>
            {title}
          </CText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="slide" visible={visible} transparent={true}>
      <View
        style={[
          localStyle.modalMainContainer,
          {
            backgroundColor: colors.modalBackground,
          },
        ]}>
        <View
          style={[
            localStyle.modalContainer,
            {
              backgroundColor: colors.backgroundColor,
            },
          ]}>
          <CText type={'S20'} color={colors.textColor} align={'center'}>
            {String.changeYourPicture}
          </CText>
          <View
            style={[
              localStyle.lineStyle,
              {
                backgroundColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale200,
              },
            ]}
          />
          <PhotoChoose
            svgIcon={colors.dark ? <CameraIcon_Dark /> : <CameraIcon />}
            color={colors.textColor}
            title={String.takePhoto}
            onPress={onPressCamera}
            bgColor={colors.light ? colors.inputBackground : null}
          />
          <PhotoChoose
            svgIcon={colors.dark ? <FileIcon_Dark /> : <FileIcon />}
            color={colors.textColor}
            title={String.chooseFromYourFile}
            onPress={onPressGallery}
            bgColor={colors.light ? colors.inputBackground : null}
          />
          <PhotoChoose
            svgIcon={<RemoveIcon />}
            color={colors.textColor}
            title={String.deletePhoto}
            onPress={onPressDeletePhoto}
            bgColor={colors.inputBackground}
          />
        </View>
      </View>
    </Modal>
  );
}

const localStyle = StyleSheet.create({
  modalMainContainer: {
    ...styles.flex,
    ...styles.center,
  },
  modalContainer: {
    borderRadius: moderateScale(16),
    width: '90%',
    ...styles.pv20,
    ...styles.ph10,
    ...styles.center,
  },
  lineStyle: {
    width: '106%',
    height: moderateScale(1),
    ...styles.mv10,
  },
  boxStyle: {
    height: moderateScale(60),
    width: deviceWidth - moderateScale(80),
    borderRadius: moderateScale(8),
    ...styles.m10,
    ...styles.p20,
  },
  innerViewContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  iconBackground: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
  },
});

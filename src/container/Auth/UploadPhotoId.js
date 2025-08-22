import {Image, StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import {styles} from '../../themes';
import images from '../../assets/images';
import {moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';

export default function UploadPhotoId({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressContinue = () => {
    navigation.navigate(AuthNav.SelfieWithIdCard);
  };
  return (
    <CSafeAreaViewAuth style={styles.justifyBetween}>
      <CHeader />
      <View style={localStyle.mainContainer}>
        <Image
          source={images.IdentityCardImage}
          style={localStyle.imageContainer}
        />

        <CText type={'B24'} align={'center'}>
          {String.verifyYourIdentity}
        </CText>
        <CText
          type={'R14'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.descriptionText}>
          {String.identityVerifyDescription}
        </CText>
      </View>
      <CButton
        title={String.continue}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressContinue}
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(120),
    width: moderateScale(120),
  },
  descriptionText: {
    width: '80%',
    ...styles.selfCenter,
    ...styles.mt5,
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
});

import {Image, StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../../components/common/CSafeAreaView';
import CHeader from '../../components/common/CHeader';
import {styles} from '../../themes';
import images from '../../assets/images';
import {moderateScale} from '../../common/constants';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';

export default function SuccessfulPassword({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressBackSign = () => {
    navigation.navigate(AuthNav.Login);
  };
  return (
    <CSafeAreaView style={styles.justifyBetween}>
      <CHeader />
      <View style={localStyle.mainContainer}>
        <Image
          source={images.SuccessPasswordImage}
          style={localStyle.imageContainer}
        />

        <CText type={'B24'} align={'center'}>
          {String.passwordUpdated}
        </CText>
        <CText
          type={'R14'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.descriptionText}>
          {String.updatePasswordDescription}
        </CText>
      </View>
      <CButton
        title={String.backToSignIn}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressBackSign}
      />
    </CSafeAreaView>
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
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
});

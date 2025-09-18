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
import {StackNav} from '../../navigation/NavigationKey';
import {useNavigationLogger} from '../../hooks/useNavigationLogger';

export default function VerifySuccess({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('VerifySuccess', true);
  const onPressContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{name: StackNav.TabNavigation}],
    });
  };
  return (
    <CSafeAreaViewAuth testID="verifySuccessContainer" style={styles.justifyBetween}>
      <CHeader testID="verifySuccessHeader" />
      <View testID="verifySuccessMainContent" style={localStyle.mainContainer}>
        <Image
          testID="verifySuccessImage"
          source={images.VerifySuccessImage}
          style={localStyle.imageContainer}
        />

        <CText testID="verifySuccessTitle" type={'B24'} align={'center'}>
          {String.thanksForSubmittingYourSelfieWithIDCard}
        </CText>
        <CText
          testID="verifySuccessDescription"
          type={'R14'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.descriptionText}>
          {String.verifySuccessDescription}
        </CText>
      </View>
      <CButton
        testID="verifySuccessContinueButton"
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

import {Image, StyleSheet, View} from 'react-native';
import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../components/common/CSafeAreaView';
import {deviceWidth, moderateScale} from '../common/constants';
import {styles} from '../themes';
import images from '../assets/images';
import CText from '../components/common/CText';
import String from '../i18n/String';
import CButton from '../components/common/CButton';
import {TEST_CONFIG, testLog} from '../config/testConfig';

export default function ConnectTest({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  // Ir automáticamente al login después de un breve delay
  useEffect(() => {
    const timer = setTimeout(() => {
      testLog('Navegando automáticamente a LoginUserTest...');
      navigation.navigate('LoginUserTest');
    }, TEST_CONFIG.AUTO_NAVIGATE_DELAY);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <CSafeAreaView style={localStyle.Container}>
      <View style={localStyle.imageContainer}>
        <Image source={images.logoImg} style={localStyle.imageStyle} />
      </View>
      <View
        style={[
          localStyle.contentContainer,
          {backgroundColor: colors.primary},
        ]}>
        <CText
          type={'B24'}
          style={styles.mb20}
          align={'center'}
          color={colors.white}>
          {String.connectTitle}
        </CText>

        <CText
          type={'R14'}
          style={styles.mb20}
          align={'center'}
          color={colors.white}>
          Modo Test - Redirigiendo al login...
        </CText>

        {/* Indicador de modo test */}
        {TEST_CONFIG.SHOW_TEST_INDICATORS && (
          <View style={localStyle.testIndicator}>
            <CText
              type={'R12'}
              style={[localStyle.testText, {color: colors.white}]}>
              PIN de Test: {TEST_CONFIG.DEFAULT_TEST_PIN}
            </CText>
          </View>
        )}

        {/* Botón manual por si quieres usarlo */}
        <CButton
          title="Iniciar Sesión Test"
          onPress={() => navigation.navigate('LoginUserTest')}
          type={'B16'}
          color={colors.white}
          style={[localStyle.btnStyle, {borderColor: colors.white}]}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  Container: {
    ...styles.flex,
  },
  imageContainer: {
    ...styles.flex,
    ...styles.center,
  },
  imageStyle: {
    width: moderateScale(200),
    height: moderateScale(200),
    resizeMode: 'contain',
  },
  contentContainer: {
    ...styles.p20,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    width: deviceWidth,
    height: '50%',
  },
  btnStyle: {
    borderRadius: moderateScale(20),
    backgroundColor: 'transparent',
    borderWidth: moderateScale(2),
    // borderColor se aplica dinámicamente en el JSX
    ...styles.mt20,
  },
  testIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    marginVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  testText: {
    // color se aplica dinámicamente en el JSX
    textAlign: 'center',
  },
});

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

// custom import
import images from '../assets/images';
import { moderateScale } from '../common/constants';
import CSafeAreaView from '../components/common/CSafeAreaView';
import CText from '../components/common/CText';
import Strings from '../i18n/String';
import CButton from '../components/common/CButton';
import { useSplashInit } from '../hooks/useSplashInit';

export default function Splash({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const { downloadMessage, initializeApp } = useSplashInit(navigation);

  return (
    <CSafeAreaView
      style={{
        backgroundColor: color.backgroundColor,
        ...localStyle.splashContainer
      }}
      testID="splashContainer">
      <View testID="splashImageContainer">
        <Image
          source={images.logoImg}
          style={localStyle.imageStyle}
          testID="splashLogo"
        />
      </View>
      <View style={localStyle.infoContainer}>
        {!!downloadMessage && (
          <CText type={'R14'} testID="downloadMessage">
            {downloadMessage}
          </CText>
        )}
        {downloadMessage.startsWith(Strings.downloadingFailed) &&
          <CButton
            title={Strings.retry}
            containerStyle={localStyle.button}
            testID="retryDownloadButton"
            onPress={initializeApp}
          />
        }
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  splashContainer: {
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  imageStyle: {
    width: 170,
    height: 170,
    resizeMode: 'contain',
  },
  infoContainer: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'column',
    paddingHorizontal: moderateScale(48),
  }
});


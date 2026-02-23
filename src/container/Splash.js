import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Image, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// custom import
import images from '../assets/images';
import { moderateScale, PENDINGRECOVERY } from '../common/constants';
import CSafeAreaView from '../components/common/CSafeAreaView';
import CText from '../components/common/CText';
import String from '../i18n/String';

import { CIRCUITS_URL, GATEWAY_BASE, BACKEND_IDENTITY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wira, { config } from 'wira-sdk';
import CButton from '../components/common/CButton';
import { AuthNav, StackNav } from '../navigation/NavigationKey';
import { changeThemeAction } from '../redux/action/themeAction';
import { colors } from '../themes/colors';
import { initialStorageValueGet } from '../utils/AsyncStorage';
import { getDraft } from '../utils/RegisterDraft';

export default function Splash({navigation}) {
  const color = useSelector(state => state.theme.theme);
  const [downloadMessage, setDownloadMessage] = useState('');

  const dispatch = useDispatch();

  const waitForCircuitDownloadCompletion = useCallback(() => {
    let subscription;
    const promise = new Promise((resolve, reject) => {
      subscription = DeviceEventEmitter.addListener('downloadInfo', (data) => {
        const {status, info} = JSON.parse(data);

        switch (status) {
          case config.CircuitDownloadStatus.DOWNLOADING:
            if (info.startsWith('-')) {
              setDownloadMessage(String.downloadingData + '-');
            } else {
              setDownloadMessage(String.downloadingData + info);
            }
            break;

          case config.CircuitDownloadStatus.DONE:
            setDownloadMessage(String.initApp);
            subscription?.remove();
            resolve(true);
            break;

          case config.CircuitDownloadStatus.ERROR:
            setDownloadMessage(String.downloadingFailed);
            subscription?.remove();
            reject(new Error(info || 'Circuit download failed'));
            break;

          default:
            subscription?.remove();
            reject(new Error('Download Status Unknown: ' + status));
            break;
        }
      });
    });

    const cancel = () => subscription?.remove();
    return {promise, cancel};
  }, []);

  const initializeApp = useCallback(async () => {
    setDownloadMessage('');
    const {promise: downloadComplete, cancel} = waitForCircuitDownloadCompletion();

    try {
      await wira.provision.ensureProvisioned({mock: true, gatewayBase: GATEWAY_BASE});
      await config.initDownloadCircuits({
        bucketUrl: CIRCUITS_URL,
        zipFileName: 'circuits',
        circuitsWithChecksum: [
          {
            fileName: 'authV2.dat',
            circuitId: 'authV2',
            checksum: null,
          },{
            fileName: 'credentialAtomicQuerySigV2.dat',
            circuitId: 'credentialAtomicQuerySigV2',
            checksum: null,
          },
        ],
      });
      await downloadComplete;
    } catch (error) {
      setDownloadMessage(String.downloadingFailed);
      cancel();
      return;
    }

    try {
      let asyncData = await initialStorageValueGet();

      let {themeColor} = asyncData;
      const draft = await getDraft();
      if (draft) {
        navigation.replace(StackNav.AuthNavigation, {
          screen: AuthNav.RegisterUser10,
          params: draft,
        });
        return;
      }
      if (asyncData) {
        if (themeColor) {
          if (themeColor === 'light') {
            dispatch(changeThemeAction(colors.light));
          } else {
            dispatch(changeThemeAction(colors.dark));
          }
        } else {
          // Si no hay tema guardado, usar light por defecto
          dispatch(changeThemeAction(colors.light));
        }
        const pending = await AsyncStorage.getItem(PENDINGRECOVERY);

        if (pending === 'true') {
          navigation.navigate(StackNav.AuthNavigation, {
            screen: AuthNav.MyGuardiansStatus,
          });
          return;
        }

        //await ensureBundle();
        navigation.replace(StackNav.AuthNavigation);
      } else {
        navigation.replace(StackNav.AuthNavigation);
      }
    } catch (e) {
      navigation.replace(StackNav.AuthNavigation);
    }
  }, [dispatch, navigation, waitForCircuitDownloadCompletion]);

  useEffect(() => {
    const initAppWithSdk = async () => {
      await wira.initWiraSdk({ appId: 'tuvotodecide', guardiansUrl: BACKEND_IDENTITY });
      await initializeApp();
    }

    initAppWithSdk();
  }, [initializeApp]);

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
        {downloadMessage.startsWith(String.downloadingFailed) &&
          <CButton
            title={String.retry}
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

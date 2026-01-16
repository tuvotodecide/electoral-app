import {StyleSheet, View, Image, DeviceEventEmitter} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import BootSplash from 'react-native-bootsplash';
import {useDispatch, useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../components/common/CSafeAreaView';
import {styles} from '../themes';
import CText from '../components/common/CText';
import String from '../i18n/String';
import {AuthNav, StackNav} from '../navigation/NavigationKey';
import {initialStorageValueGet} from '../utils/AsyncStorage';
import {changeThemeAction} from '../redux/action/themeAction';
import {colors} from '../themes/colors';
import images from '../assets/images';
import {moderateScale, PENDINGRECOVERY} from '../common/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {getDraft} from '../utils/RegisterDraft';
import {ensureBundle} from '../utils/ensureBundle';
import wira, {config} from 'wira-sdk';
import {GATEWAY_BASE, CIRCUITS_URL} from '@env';
import CButton from '../components/common/CButton';

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
            setDownloadMessage(String.downloadingData + info);
            break;

          case config.CircuitDownloadStatus.DONE:
            setDownloadMessage(String.initApp);
            subscription?.remove();
            resolve(true);
            break;

          case config.CircuitDownloadStatus.ERROR:
            setDownloadMessage(String.downloadingFailed + '\nProgress cancelel: ' + info);
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
      await BootSplash.hide({fade: true});
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
      setDownloadMessage(String.downloadingFailed + '\n' + error.message);
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

        await ensureBundle();
        navigation.replace(StackNav.AuthNavigation);
      } else {
        navigation.replace(StackNav.AuthNavigation);
      }
    } catch (e) {
      navigation.replace(StackNav.AuthNavigation);
    }
  }, [dispatch, navigation, waitForCircuitDownloadCompletion]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <CSafeAreaView
      style={{
        backgroundColor: color.backgroundColor,
        ...styles.center,
        ...styles.contentCenter,
        ...styles.flexRow,
        ...styles.wrap,
      }}
      testID="splashContainer">
      <View style={localStyle.imageContainer} testID="splashImageContainer">
        <Image
          source={images.logoImg}
          style={localStyle.imageStyle}
          testID="splashLogo"
        />
      </View>
      <CText type={'B30'} style={localStyle.textStyle} testID="splashTitle">
        {String.wira}
      </CText>
      {!!downloadMessage && (
        <CText type={'R14'} style={localStyle.downloadMessage} testID="downloadMessage">
          {downloadMessage}
        </CText>
      )}
      {downloadMessage.startsWith(String.downloadingFailed) &&
        <View>
          <CButton
            title={String.retry}
            testID="retryDownloadButton"
            onPress={initializeApp}
          />
        </View>
      }
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  textStyle: {
    ...styles.ml15,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(30),
    marginBottom: moderateScale(30),
  },
  imageStyle: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  downloadMessage: {
    textAlign: 'center',
    marginTop: moderateScale(8),
  },
});

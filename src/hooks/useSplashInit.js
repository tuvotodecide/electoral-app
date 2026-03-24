import { CIRCUITS_URL, GATEWAY_BASE, BACKEND_IDENTITY } from '@env';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { StorageService } from '../services/StorageService';
import wira, { config } from 'wira-sdk';


import { PENDINGRECOVERY } from '../common/constants';
import Strings from '../i18n/String';
import { NavigationAdapter } from '../services/NavigationAdapter';
import { AuthNav, StackNav } from '../navigation/NavigationKey';
import { changeThemeAction } from '../redux/action/themeAction';
import { colors } from '../themes/colors';
import { getThemeColor } from '../utils/AsyncStorage';
import { getDraft } from '../utils/RegisterDraft';
import { captureError, flushSentry } from '../config/sentry';

export const useSplashInit = (navigation) => {
  const [downloadMessage, setDownloadMessage] = useState('');
  const dispatch = useDispatch();

  const waitForCircuitDownloadCompletion = useCallback(() => {
    let subscription;
    const promise = new Promise((resolve, reject) => {
      DeviceEventEmitter.removeAllListeners('downloadInfo');
      subscription = DeviceEventEmitter.addListener('downloadInfo', (data) => {
        const {status, info} = JSON.parse(data);
        const safeInfo = String(info ?? '');

        switch (status) {
          case config.CircuitDownloadStatus.DOWNLOADING:
            if (safeInfo.startsWith('-')) {
              setDownloadMessage(Strings.downloadingData + '-');
            } else {
              setDownloadMessage(Strings.downloadingData + safeInfo);
            }
            break;

          case config.CircuitDownloadStatus.DONE:
            setDownloadMessage(Strings.initApp);
            subscription?.remove();
            resolve(true);
            break;

          case config.CircuitDownloadStatus.ERROR:
            captureError(new Error('Circuit Download Error: ' + info), {
              flow: 'init_app',
              step: 'download_circuits',
              critical: false,
              status,
              info: safeInfo,
            });
            flushSentry(2500).catch(() => {});
            setDownloadMessage(Strings.downloadingFailed);
            subscription?.remove();
            reject(new Error(info || 'Circuit download failed'));
            break;

          default:
            captureError(new Error('Download Status Unknown: ' + status), {
              flow: 'init_app',
              step: 'download_circuits',
              critical: false,
              status,
              info: safeInfo,
            });
            flushSentry(2000).catch(() => {});
            subscription?.remove();
            reject(new Error('Download Status Unknown: ' + status));
            break;
        }
      });
    });

    const cancel = () => subscription?.remove();
    return {promise, cancel};
  }, []);

  const isDownloadAlreadyInProgress = useCallback(() => {
    return new Promise((resolve) => {
      const probeSubscription = DeviceEventEmitter.addListener('downloadInfo', (data) => {
        const {status} = JSON.parse(data);
        if (status === config.CircuitDownloadStatus.DOWNLOADING ||
            status === config.CircuitDownloadStatus.DONE) {
          probeSubscription.remove();
          resolve(true);
        }
      });
      setTimeout(() => {
        probeSubscription.remove();
        resolve(false);
      }, 1500);
    });
  }, []);

  const initializeApp = useCallback(async () => {
    const router = NavigationAdapter(navigation);
    setDownloadMessage('');

    try {
      await wira.provision.ensureProvisioned({mock: true, gatewayBase: GATEWAY_BASE});

      const alreadyDownloading = await isDownloadAlreadyInProgress();
      const {promise: downloadComplete} = waitForCircuitDownloadCompletion();

      if (!alreadyDownloading) {
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
      }
      await downloadComplete;
    } catch (error) {
      setDownloadMessage(Strings.downloadingFailed);
      return;
    }

    try {
      let themeColor = await getThemeColor();
      const draft = await getDraft();

      if (draft) {
        router.replace(StackNav.AuthNavigation, {
          screen: AuthNav.RegisterUser10,
          params: draft,
        });
        return;
      }

      // ISP aplicado: Ya no dependemos del objeto gigante asyncData
      if (true) {
        if (themeColor) {
          if (themeColor === 'light') {
            dispatch(changeThemeAction(colors.light));
          } else {
            dispatch(changeThemeAction(colors.dark));
          }
        } else {
          dispatch(changeThemeAction(colors.light));
        }

        const pending = await StorageService.getItem(PENDINGRECOVERY);

        if (pending === 'true') {
          router.navigate(StackNav.AuthNavigation, {
            screen: AuthNav.MyGuardiansStatus,
          });
          return;
        }

        router.replace(StackNav.AuthNavigation);
      } else {
        router.replace(StackNav.AuthNavigation);
      }
    } catch (e) {
      router.replace(StackNav.AuthNavigation);
    }
  }, [dispatch, navigation, waitForCircuitDownloadCompletion, isDownloadAlreadyInProgress]);

  useEffect(() => {
    const initAppWithSdk = async () => {
      try {
        await wira.initWiraSdk({ appId: 'tuvotodecide', guardiansUrl: BACKEND_IDENTITY });
      } catch (error) {
        if (!error.message.includes('Type FilterMapper is already registered')) {
          Alert.alert('Error', Strings.sdkInitError, [
            {text: 'OK', style: 'default'},
          ]);
        }
      }
      await initializeApp();
    }

    initAppWithSdk();
    return () => {
      DeviceEventEmitter.removeAllListeners('downloadInfo');
    };
  }, [initializeApp]);

  return {
    downloadMessage,
    initializeApp
  };
};

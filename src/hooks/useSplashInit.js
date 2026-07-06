import { CIRCUITS_URL, GATEWAY_BASE, BACKEND_IDENTITY } from '@env';
import { useCallback, useEffect, useRef, useState } from 'react';
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

const CIRCUIT_DOWNLOAD_STATUS =
  config?.CircuitDownloadStatus || {
    DOWNLOADING: 'DOWNLOADING',
    DONE: 'DONE',
    ERROR: 'ERROR',
  };

const initDownloadCircuits = params => {
  const initFn = config?.initDownloadCircuits;
  if (!initFn) {
    throw new Error('Circuit downloader not configured');
  }
  return initFn(params);
};

export const useSplashInit = (navigation) => {
  const [downloadMessage, setDownloadMessage] = useState('');
  const dispatch = useDispatch();
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const waitForCircuitDownloadCompletion = useCallback(() => {
    let subscription;
    const promise = new Promise((resolve) => {
      DeviceEventEmitter.removeAllListeners('downloadInfo');
      subscription = DeviceEventEmitter.addListener('downloadInfo', (data) => {
        const {status, info} = JSON.parse(data);
        const safeInfo = String(info ?? '');

        switch (status) {
          case CIRCUIT_DOWNLOAD_STATUS.DOWNLOADING:
            if (safeInfo.startsWith('-')) {
              setDownloadMessage(Strings.downloadingData + '-');
            } else {
              setDownloadMessage(Strings.downloadingData + safeInfo);
            }
            break;

          case CIRCUIT_DOWNLOAD_STATUS.DONE:
            setDownloadMessage(Strings.initApp);
            subscription?.remove();
            resolve(true);
            break;

          case CIRCUIT_DOWNLOAD_STATUS.ERROR:
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
            resolve(false);
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
            setDownloadMessage(Strings.downloadingFailed);
            resolve(false);
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
        if (status === CIRCUIT_DOWNLOAD_STATUS.DOWNLOADING ||
            status === CIRCUIT_DOWNLOAD_STATUS.DONE) {
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
      try {
        await wira.provision.ensureProvisioned({mock: true, gatewayBase: GATEWAY_BASE});
      } catch (_provisionError) {}

      const alreadyDownloading = await isDownloadAlreadyInProgress();
      const {promise: downloadComplete} = waitForCircuitDownloadCompletion();

      if (!alreadyDownloading) {
        await initDownloadCircuits({
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
      const downloadOk = await downloadComplete;
      if (!downloadOk) {
        return;
      }
    } catch (_error) {
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

      if (themeColor) {
        if (themeColor === 'light') {
          dispatchRef.current(changeThemeAction(colors.light));
        } else {
          dispatchRef.current(changeThemeAction(colors.dark));
        }
      } else {
        // Si no hay tema guardado, usar light por defecto
        dispatchRef.current(changeThemeAction(colors.light));
      }

      const pending = await StorageService.getItem(PENDINGRECOVERY);

      if (pending === 'true') {
        router.navigate(StackNav.AuthNavigation, {
          screen: AuthNav.MyGuardiansStatus,
        });
        return;
      }

      router.replace(StackNav.AuthNavigation);
    } catch (_e) {
      router.replace(StackNav.AuthNavigation);
    }
  }, [navigation, waitForCircuitDownloadCompletion, isDownloadAlreadyInProgress]);

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

import { CIRCUITS_URL, GATEWAY_BASE, BACKEND_IDENTITY } from '@env';
import NetInfo from '@react-native-community/netinfo';
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
import { addAppBreadcrumb, flushSentry, getSafeUrl, reportAppError } from '../config/sentry';

const CIRCUIT_DOWNLOAD_TIMEOUT_MS = 120000;

const getNetworkDiagnostics = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      type: state?.type,
      isConnected: state?.isConnected,
      isInternetReachable: state?.isInternetReachable,
      isWifiEnabled: state?.isWifiEnabled,
      cellularGeneration: state?.details?.cellularGeneration,
    };
  } catch (error) {
    reportAppError(error, {
      flow: 'init_app',
      module: 'useSplashInit',
      step: 'network_state_fetch',
      critical: false,
    });
    return { unavailable: true };
  }
};

const createSplashError = (message, details = {}) => {
  const error = new Error(message);
  error.splashDiagnostics = details;
  return error;
};

export const useSplashInit = (navigation) => {
  const [downloadMessage, setDownloadMessage] = useState('');
  const dispatch = useDispatch();

  const waitForCircuitDownloadCompletion = useCallback(() => {
    let subscription;
    let timeoutId;
    const promise = new Promise((resolve, reject) => {
      DeviceEventEmitter.removeAllListeners('downloadInfo');
      addAppBreadcrumb('Waiting for circuit download completion', {
        flow: 'init_app',
        step: 'download_circuits_wait',
        timeout_ms: CIRCUIT_DOWNLOAD_TIMEOUT_MS,
      });

      const cleanup = () => {
        subscription?.remove();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      timeoutId = setTimeout(() => {
        cleanup();
        reject(createSplashError('Circuit download timed out', {
          flow: 'init_app',
          step: 'download_circuits',
          timeout_ms: CIRCUIT_DOWNLOAD_TIMEOUT_MS,
          bucket_url: getSafeUrl(CIRCUITS_URL),
        }));
      }, CIRCUIT_DOWNLOAD_TIMEOUT_MS);

      subscription = DeviceEventEmitter.addListener('downloadInfo', (data) => {
        let payload;
        try {
          payload = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (_error) {
          cleanup();
          reject(createSplashError('Invalid circuit download event payload', {
            flow: 'init_app',
            step: 'download_circuits_event_parse',
            raw_type: typeof data,
          }));
          return;
        }

        const {status, info} = payload || {};
        const safeInfo = String(info ?? '');
        addAppBreadcrumb('Circuit download status received', {
          flow: 'init_app',
          step: 'download_circuits',
          status,
          info: safeInfo,
        }, status === config.CircuitDownloadStatus.ERROR ? 'error' : 'info');

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
            cleanup();
            resolve(true);
            break;

          case config.CircuitDownloadStatus.ERROR:
            setDownloadMessage(Strings.downloadingFailed);
            cleanup();
            reject(createSplashError(info || 'Circuit download failed', {
              flow: 'init_app',
              step: 'download_circuits',
              status,
              info: safeInfo,
              bucket_url: getSafeUrl(CIRCUITS_URL),
            }));
            break;

          default:
            cleanup();
            reject(createSplashError('Download Status Unknown: ' + status, {
              flow: 'init_app',
              step: 'download_circuits_unknown_status',
              status,
              info: safeInfo,
              bucket_url: getSafeUrl(CIRCUITS_URL),
            }));
            break;
        }
      });
    });

    const cancel = () => {
      subscription?.remove();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    return {promise, cancel};
  }, []);

  const isDownloadAlreadyInProgress = useCallback(() => {
    return new Promise((resolve) => {
      const probeSubscription = DeviceEventEmitter.addListener('downloadInfo', (data) => {
        let status;
        try {
          status = (typeof data === 'string' ? JSON.parse(data) : data)?.status;
        } catch (error) {
          reportAppError(error, {
            flow: 'init_app',
            module: 'useSplashInit',
            step: 'download_circuits_probe_parse',
            critical: false,
          });
          return;
        }
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
    addAppBreadcrumb('Splash initialization started', {
      flow: 'init_app',
      step: 'initialize_app',
      endpoints: {
        gateway_base: getSafeUrl(GATEWAY_BASE),
        circuits_url: getSafeUrl(CIRCUITS_URL),
        backend_identity: getSafeUrl(BACKEND_IDENTITY),
      },
    });

    try {
      const network = await getNetworkDiagnostics();
      addAppBreadcrumb('Network state before provisioning', {
        flow: 'init_app',
        step: 'network_state',
        network,
      });

      addAppBreadcrumb('Ensuring Wira provision', {
        flow: 'init_app',
        step: 'ensure_provisioned',
        gateway_base: getSafeUrl(GATEWAY_BASE),
      });
      await wira.provision.ensureProvisioned({mock: true, gatewayBase: GATEWAY_BASE});

      const alreadyDownloading = await isDownloadAlreadyInProgress();
      addAppBreadcrumb('Circuit download probe finished', {
        flow: 'init_app',
        step: 'download_circuits_probe',
        already_downloading: alreadyDownloading,
      });
      const {promise: downloadComplete} = waitForCircuitDownloadCompletion();

      if (!alreadyDownloading) {
        addAppBreadcrumb('Starting circuit download', {
          flow: 'init_app',
          step: 'download_circuits_start',
          bucket_url: getSafeUrl(CIRCUITS_URL),
          zip_file_name: 'circuits',
          circuits: ['authV2', 'credentialAtomicQuerySigV2'],
        });
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
      addAppBreadcrumb('Circuit download completed', {
        flow: 'init_app',
        step: 'download_circuits_done',
      });
    } catch (error) {
      const network = await getNetworkDiagnostics();
      reportAppError(error, {
        flow: 'init_app',
        module: 'useSplashInit',
        step: error?.splashDiagnostics?.step || 'download_or_provision',
        critical: true,
        user_visible_message_key: 'Strings.downloadingFailed',
        user_visible_message: Strings.downloadingFailed,
        endpoint: error?.splashDiagnostics?.bucket_url || getSafeUrl(CIRCUITS_URL),
        gateway_base: getSafeUrl(GATEWAY_BASE),
        backend_identity: getSafeUrl(BACKEND_IDENTITY),
        timeout_ms: error?.splashDiagnostics?.timeout_ms,
        download_status: error?.splashDiagnostics?.status,
        download_info: error?.splashDiagnostics?.info,
        network,
      });
      await flushSentry(2500);
      setDownloadMessage(Strings.downloadingFailed);
      return;
    }

    try {
      addAppBreadcrumb('Loading local startup state', {
        flow: 'init_app',
        step: 'local_startup_state',
      });
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
          dispatch(changeThemeAction(colors.light));
        } else {
          dispatch(changeThemeAction(colors.dark));
        }
      } else {
        // Si no hay tema guardado, usar light por defecto
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
    } catch (e) {
      reportAppError(e, {
        flow: 'init_app',
        module: 'useSplashInit',
        step: 'local_state_or_navigation',
        critical: false,
      });
      router.replace(StackNav.AuthNavigation);
    }
  }, [dispatch, navigation, waitForCircuitDownloadCompletion, isDownloadAlreadyInProgress]);

  useEffect(() => {
    const initAppWithSdk = async () => {
      try {
        addAppBreadcrumb('Wira SDK initialization started', {
          flow: 'init_app',
          step: 'init_wira_sdk',
          backend_identity: getSafeUrl(BACKEND_IDENTITY),
        });
        await wira.initWiraSdk({ appId: 'tuvotodecide', guardiansUrl: BACKEND_IDENTITY });
        addAppBreadcrumb('Wira SDK initialization completed', {
          flow: 'init_app',
          step: 'init_wira_sdk_done',
        });
      } catch (error) {
        const alreadyRegistered = error?.message?.includes('Type FilterMapper is already registered');
        reportAppError(error, {
          flow: 'init_app',
          module: 'useSplashInit',
          step: 'init_wira_sdk',
          critical: !alreadyRegistered,
          backend_identity: getSafeUrl(BACKEND_IDENTITY),
          ignored_known_error: alreadyRegistered,
        });
        if (!alreadyRegistered) {
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

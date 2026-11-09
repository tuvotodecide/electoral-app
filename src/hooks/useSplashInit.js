import { CIRCUITS_URL } from '@env';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { getPrivadoSession } from '../services/privado/privadoSession';
import {
  downloadCircuits,
  isCircuitDownloadInProgress,
  registerCachedCircuits,
} from '../services/privado/privadoCircuits';

import Strings from '../i18n/String';
import { NavigationAdapter } from '../services/NavigationAdapter';
import { AuthNav, StackNav } from '../navigation/NavigationKey';
import { changeThemeAction } from '../redux/action/themeAction';
import { colors } from '../themes/colors';
import { getThemeColor } from '../utils/AsyncStorage';
import { getDraft } from '../utils/RegisterDraft';
import { captureError, flushSentry } from '../config/sentry';
import { hydrateDemoSession } from '../features/demo/demoSession';
import { describeNav, notifNavLog } from '../utils/notifNavDebug';

const getDownloadSizeMB = async (url) => {
  try {
    const response = await fetch(url, {method: 'HEAD'});
    const length = response.headers?.get?.('Content-Length');
    const bytes = parseInt(length, 10);
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return null;
    }
    return bytes / (1024 * 1024);
  } catch (_error) {
    return null;
  }
};

export const useSplashInit = (navigation) => {
  const [downloadMessage, setDownloadMessage] = useState([]);
  const [downloadPrompt, setDownloadPrompt] = useState({visible: false, sizeMB: null});
  const confirmDownloadResolveRef = useRef(null);
  const dispatch = useDispatch();
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const requestDownloadConfirmation = useCallback((sizeMB) => {
    return new Promise((resolve) => {
      confirmDownloadResolveRef.current = resolve;
      setDownloadPrompt({visible: true, sizeMB});
    });
  }, []);

  const onConfirmDownload = useCallback(() => {
    setDownloadPrompt({visible: false, sizeMB: null});
    confirmDownloadResolveRef.current?.();
    confirmDownloadResolveRef.current = null;
  }, []);

  const showDownloadProgress = useCallback(({phase, percent}) => {
    if (phase === 'extracting') {
      setDownloadMessage([Strings.initApp]);
    } else if (percent === undefined) {
      setDownloadMessage([Strings.downloadingData + '-']);
    } else {
      setDownloadMessage([Strings.downloadingData, `${Math.round(percent)}%`]);
    }
  }, []);

  const initializeApp = useCallback(async () => {
    const router = NavigationAdapter(navigation);
    setDownloadMessage([]);
    notifNavLog('Splash', 'initializeApp start', { current: describeNav() });

    // Antes de la descarga de circuitos: isDemoActive() debe estar resuelto
    // antes del primer getElectionRepository(), aunque la descarga se cuelgue.
    await hydrateDemoSession();

    try {
      // El registro de circuitos del SDK vive en memoria: se rellena en cada
      // arranque con lo que ya está extraído en la caché.
      const alreadyDownloading = isCircuitDownloadInProgress();
      const downloaded = !alreadyDownloading && (await registerCachedCircuits());
      notifNavLog('Splash', 'circuits status', { downloaded, alreadyDownloading });

      if (!downloaded) {
        if (!alreadyDownloading) {
          const sizeMB = await getDownloadSizeMB(CIRCUITS_URL);
          await requestDownloadConfirmation(sizeMB);
        }
        setDownloadMessage([Strings.downloadingData + '-']);
        const result = await downloadCircuits({ onProgress: showDownloadProgress });
        setDownloadMessage([Strings.initApp]);
        notifNavLog('Splash', 'circuits download finished', { status: result.status });
      }
    } catch (error) {
      notifNavLog('Splash', 'circuits step threw', { error: error?.message });
      captureError(error, {
        flow: 'init_app',
        step: 'download_circuits',
        critical: false,
      });
      flushSentry(2500).catch(() => {});
      setDownloadMessage([Strings.downloadingFailed]);
      return;
    }

    try {
      let themeColor = await getThemeColor();
      const draft = await getDraft();

      if (draft) {
        notifNavLog('Splash', 'replace -> AuthNavigation/RegisterUser10 (draft)', {
          current: describeNav(),
        });
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

      notifNavLog('Splash', 'replace -> AuthNavigation (Connect)', {
        current: describeNav(),
      });
      router.replace(StackNav.AuthNavigation);
    } catch (_e) {
      notifNavLog('Splash', 'replace -> AuthNavigation after error', {
        error: _e?.message,
        current: describeNav(),
      });
      router.replace(StackNav.AuthNavigation);
    }
  }, [navigation, requestDownloadConfirmation, showDownloadProgress]);

  useEffect(() => {
    const initAppWithSdk = async () => {
      try {
        // Crea la sesión única del SDK; el resto de la app la obtiene con
        // getPrivadoSession() / getPrivadoClient().
        await getPrivadoSession();
      } catch (error) {
        captureError(error, {
          flow: 'init_app',
          step: 'privado_sdk_init',
          critical: true,
        });
        Alert.alert('Error', Strings.sdkInitError, [
          {text: 'OK', style: 'default'},
        ]);
      }
      await initializeApp();
    };

    initAppWithSdk();
  }, [initializeApp]);

  return {
    downloadMessage,
    initializeApp,
    downloadPrompt,
    onConfirmDownload,
  };
};

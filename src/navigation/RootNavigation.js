import { createNavigationContainerRef } from '@react-navigation/native';
import {
  describeNav,
  notifNavLog,
  setNotifNavDebugRef,
} from '../utils/notifNavDebug';

export const navigationRef = createNavigationContainerRef();
setNotifNavDebugRef(navigationRef);

export function safeNavigate(name, params) {
  const ready = navigationRef.isReady();
  notifNavLog('RootNavigation', `safeNavigate -> ${name}`, {
    screen: params?.screen ?? null,
    ready,
    current: describeNav(),
  });
  if (ready) {
    navigationRef.navigate(name, params);
    return true;
  }
  return false;
}

export function navigate(name, params) {
  safeNavigate(name, params);
}

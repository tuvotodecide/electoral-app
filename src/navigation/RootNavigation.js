import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function safeNavigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
    return true;
  }
  return false;
}

export function navigate(name, params) {
  safeNavigate(name, params);
}

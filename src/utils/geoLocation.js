import { Platform } from "react-native";
import { check, PERMISSIONS, request } from "react-native-permissions";

const withTimeout = (promise, ms, timeoutReturn) => {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve(timeoutReturn), ms)
  );
  return Promise.race([promise, timeout]);
};

export async function checkLocationPermission() {
  try {
    const permission = Platform.select({
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    });

    const status = await check(permission);
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function checkAndRequestLocationPermission() {
  const permission = Platform.select({
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  });

  const status = await check(permission);
  
  if (status === 'granted') {
    return true;
  }

  const requestStatus = await request(permission);
  return requestStatus === 'granted';
}
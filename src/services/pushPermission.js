import { Platform, PermissionsAndroid, Alert, Linking, AppState } from 'react-native';
import notifee, { AuthorizationStatus, AndroidImportance } from '@notifee/react-native';

export async function requestPushPermissionExplicit() {
  try {

    const currentSettings = await notifee.getNotificationSettings();
    if (currentSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
      await notifee.createChannel({
        id: 'high_prio',
        name: 'High priority',
        importance: AndroidImportance.HIGH,
      });
      return true;
    }

    if (AppState.currentState !== 'active') {
      return false;
    }


    // iOS y Android 13+: muestra prompt del SO
    const settings = await notifee.requestPermission();

    const grantedIOSOrA13 =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;


    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const r = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (r !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permiso requerido',
          'Activa las notificaciones para recibir avisos.',
          [
            { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
            { text: 'Cancelar' },
          ],
        );
        return false;
      }
    }

    if (!grantedIOSOrA13 && Platform.OS === 'ios') {
      Alert.alert(
        'Permiso requerido',
        'Activa las notificaciones en Ajustes para recibir avisos.',
        [
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
          { text: 'Cancelar' },
        ],
      );
      return false;
    }

    await notifee.createChannel({
      id: 'high_prio',
      name: 'High priority',
      importance: AndroidImportance.HIGH,
    });

    return true;
  } catch (e) {
    return false;
  }
}

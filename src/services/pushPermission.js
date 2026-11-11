import {Platform, Alert, Linking, AppState} from 'react-native';
import notifee, {AuthorizationStatus, AndroidImportance} from '@notifee/react-native';

async function ensureHighPriorityChannel() {
  await notifee.createChannel({
    id: 'high_prio',
    name: 'High priority',
    importance: AndroidImportance.HIGH,
  });
}

export async function requestPushPermissionExplicit() {
  try {
    const currentSettings = await notifee.getNotificationSettings();
    if (currentSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
      await ensureHighPriorityChannel();
      return true;
    }

    if (AppState.currentState !== 'active') {
      return false;
    }

    // Única solicitud al SO: en iOS y en Android 13+ notifee muestra el prompt
    // de POST_NOTIFICATIONS; en Android < 13 devuelve el estado actual. No se
    // vuelve a pedir con PermissionsAndroid: tras una denegación, Android
    // mostraría el diálogo por segunda vez.
    const settings = await notifee.requestPermission();
    const granted =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

    if (!granted) {
      Alert.alert(
        'Permiso requerido',
        Platform.OS === 'ios'
          ? 'Activa las notificaciones en Ajustes para recibir avisos.'
          : 'Activa las notificaciones para recibir avisos.',
        [
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
          { text: 'Cancelar' },
        ],
      );
      return false;
    }

    await ensureHighPriorityChannel();
    return true;
  } catch (_) {
    return false;
  }
}

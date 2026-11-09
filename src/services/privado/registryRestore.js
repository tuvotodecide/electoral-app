import {getPrivadoClient} from './privadoSession';

/** No hay respaldo descargado (RegisterUser4) en el dispositivo. */
export class RegistryBackupMissingError extends Error {
  constructor() {
    super('No hay un respaldo de la cuenta descargado en este dispositivo.');
    this.name = 'RegistryBackupMissingError';
  }
}

/** El respaldo descargado no es de este SDK (`createBackup`): no se puede restaurar. */
export class RegistryBackupUnsupportedError extends Error {
  constructor() {
    super('El respaldo descargado no tiene un formato compatible con esta versión.');
    this.name = 'RegistryBackupUnsupportedError';
  }
}

/**
 * Restaura en este dispositivo el respaldo que devolvió la recuperación con
 * carnet (`client.downloadRegistryBackup`). Es el que se subió en el registro
 * con `client.createBackup(pin)`, así que se descifra con el PIN de la cuenta.
 *
 * - PIN incorrecto: `UserDataBackupError` INVALID_BACKUP_PASSWORD, sin tocar
 *   los datos del dispositivo ni el respaldo descargado.
 * - Con el PIN correcto reemplaza la identidad y las credenciales que hubiera
 *   en el dispositivo, crea el vault con ese PIN (queda abierto) y borra el
 *   respaldo descargado.
 */
export async function restoreRegistryBackup(pin) {
  const client = await getPrivadoClient();
  const stored = await client.getStoredRegistryBackup();
  if (!stored) {
    throw new RegistryBackupMissingError();
  }
  if (!stored.isPrivadoBackup) {
    throw new RegistryBackupUnsupportedError();
  }
  const summary = await client.restoreBackup(stored.backup, pin, {replaceExisting: true});
  await client.deleteStoredRegistryBackup();
  return summary;
}

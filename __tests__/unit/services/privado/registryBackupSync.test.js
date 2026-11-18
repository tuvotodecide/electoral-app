import AsyncStorage from '@react-native-async-storage/async-storage';
import {createMockSession} from '@privado-id/expo-sdk';
import {
  REGISTRY_BACKUP_PENDING_KEY,
  clearRegistryBackupPending,
  isRegistryBackupPending,
  syncPendingRegistryBackup,
  uploadRegistryBackup,
} from '../../../../src/services/privado/registryBackupSync';
import {getPrivadoClient} from '../../../../src/services/privado/privadoSession';

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

let client;

beforeEach(() => {
  jest.clearAllMocks();
  // El mock global de AsyncStorage no guarda nada: aquí, un almacén en memoria.
  const store = new Map();
  AsyncStorage.getItem.mockImplementation(async key => store.get(key) ?? null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => {
    store.set(key, value);
  });
  AsyncStorage.removeItem.mockImplementation(async key => {
    store.delete(key);
  });
  client = createMockSession().client;
  getPrivadoClient.mockResolvedValue(client);
});

describe('uploadRegistryBackup', () => {
  it('crea el respaldo con el PIN y lo sube a /registry/profile', async () => {
    client.createBackup.mockResolvedValue('privado-id-backup:1:new');

    await uploadRegistryBackup(4321);

    expect(client.createBackup).toHaveBeenCalledWith('4321');
    expect(client.updateRegistryProfile).toHaveBeenCalledWith({
      backup: 'privado-id-backup:1:new',
    });
    await expect(isRegistryBackupPending()).resolves.toBe(false);
  });

  it('quita una marca de pendiente anterior al subirlo', async () => {
    await AsyncStorage.setItem(REGISTRY_BACKUP_PENDING_KEY, '1');

    await uploadRegistryBackup('4321');

    await expect(isRegistryBackupPending()).resolves.toBe(false);
  });

  it('si la subida falla deja la marca de pendiente y relanza', async () => {
    const error = new Error('offline');
    client.updateRegistryProfile.mockRejectedValue(error);

    await expect(uploadRegistryBackup('4321')).rejects.toBe(error);
    await expect(isRegistryBackupPending()).resolves.toBe(true);
  });

  it('si crear el respaldo falla (PIN incorrecto) también queda pendiente', async () => {
    client.createBackup.mockRejectedValue(new Error('INVALID_PIN'));

    await expect(uploadRegistryBackup('0000')).rejects.toThrow('INVALID_PIN');
    expect(client.updateRegistryProfile).not.toHaveBeenCalled();
    await expect(isRegistryBackupPending()).resolves.toBe(true);
  });
});

describe('syncPendingRegistryBackup', () => {
  it('sin marca no hace nada', async () => {
    await expect(syncPendingRegistryBackup('4321')).resolves.toBe(false);
    expect(client.createBackup).not.toHaveBeenCalled();
  });

  it('con marca sube el respaldo y la quita', async () => {
    await AsyncStorage.setItem(REGISTRY_BACKUP_PENDING_KEY, '1');

    await expect(syncPendingRegistryBackup('4321')).resolves.toBe(true);
    expect(client.updateRegistryProfile).toHaveBeenCalled();
    await expect(isRegistryBackupPending()).resolves.toBe(false);
  });

  it('no lanza si vuelve a fallar: devuelve el error y conserva la marca', async () => {
    await AsyncStorage.setItem(REGISTRY_BACKUP_PENDING_KEY, '1');
    const error = new Error('offline');
    client.updateRegistryProfile.mockRejectedValue(error);

    await expect(syncPendingRegistryBackup('4321')).resolves.toEqual({error});
    await expect(isRegistryBackupPending()).resolves.toBe(true);
  });
});

describe('clearRegistryBackupPending', () => {
  it('quita la marca', async () => {
    await AsyncStorage.setItem(REGISTRY_BACKUP_PENDING_KEY, '1');

    await clearRegistryBackupPending();

    await expect(isRegistryBackupPending()).resolves.toBe(false);
  });
});

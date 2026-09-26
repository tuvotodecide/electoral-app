import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
    incAttempts,
    isLocked,
    validateAttempts,
} from '../../../../src/utils/PinAttempts';
import { KEY, LOCK_KEY } from '../../../../src/common/constants';

// Mock AMBOS
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');

describe('PinAttempts with checksum validation', () => {
    beforeEach(() => {
        // Limpiar todos los mocks
        AsyncStorage.getItem.mockClear();
        AsyncStorage.setItem.mockClear();
        AsyncStorage.multiRemove.mockClear();
        SecureStore.getItemAsync.mockClear();
        SecureStore.setItemAsync.mockClear();
        SecureStore.deleteItemAsync.mockClear();

        // Reset por defecto: no hay datos
        AsyncStorage.getItem.mockResolvedValue(null);
        SecureStore.getItemAsync.mockResolvedValue(null);
    });

    describe('validateAttempts', () => {
        it('should return true on first call (no checksum yet)', async () => {
            const result = await validateAttempts();
            expect(result).toBe(true);
        });

        it('should return false if checksum does not match', async () => {
            // PRIMER LLAMADO: Guardar con checksum válido
            AsyncStorage.getItem.mockResolvedValue('0'); // attempts
            SecureStore.getItemAsync.mockResolvedValueOnce(null); // no hay salt
            SecureStore.getItemAsync.mockResolvedValueOnce(null); // no hay checksum

            const n1 = await incAttempts();
            expect(n1).toBe(1); // Se incrementó a 1

            // SEGUNDO LLAMADO: Atacante cambia los intentos
            AsyncStorage.getItem.mockClear();
            AsyncStorage.setItem.mockClear();

            // Mock para leer con datos alterados
            AsyncStorage.getItem
                .mockResolvedValueOnce('5') // attempts ALTERADO (era 1, ahora 5)
                .mockResolvedValueOnce(null); // lockUntil

            SecureStore.getItemAsync.mockClear();
            SecureStore.getItemAsync
                .mockResolvedValueOnce('salt123') // salt válido
                .mockResolvedValueOnce('checksum_original'); // checksum original (no coincidirá)

            const result = await validateAttempts();

            expect(result).toBe(false);
            expect(AsyncStorage.multiRemove).toHaveBeenCalled();
        });
    });

    describe('incAttempts', () => {
        it('should increment and save checksum', async () => {
            AsyncStorage.getItem.mockClear();
            AsyncStorage.setItem.mockClear();
            SecureStore.getItemAsync.mockClear();
            SecureStore.setItemAsync.mockClear();

            AsyncStorage.getItem.mockResolvedValue(null);
            SecureStore.getItemAsync.mockResolvedValue(null);

            const n = await incAttempts();

            expect(n).toBe(1);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                KEY,  // ← USA LA CONSTANTE
                '1'
            );
            expect(SecureStore.setItemAsync).toHaveBeenCalled();
        });

        it('should lock after 5 attempts', async () => {
            AsyncStorage.getItem.mockClear();
            AsyncStorage.setItem.mockClear();
            SecureStore.getItemAsync.mockClear();

            AsyncStorage.getItem.mockResolvedValue('4');
            SecureStore.getItemAsync.mockResolvedValue(null);

            const n = await incAttempts();

            expect(n).toBe(5);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                LOCK_KEY,
                expect.any(String)
            );
        });
    });


    describe('isLocked', () => {
        it('should return false when no lock', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);
            SecureStore.getItemAsync.mockResolvedValue(null);

            const locked = await isLocked();

            expect(locked).toBe(false);
        });

        it('should return true when lock is active', async () => {
            const futureTime = Date.now() + 60000;
            AsyncStorage.getItem.mockResolvedValue(String(futureTime));
            SecureStore.getItemAsync.mockResolvedValue(null);

            const locked = await isLocked();

            expect(locked).toBe(true);
        });

        it('should reset when lock expires', async () => {
            const pastTime = Date.now() - 1000;
            AsyncStorage.getItem.mockResolvedValue(String(pastTime));
            SecureStore.getItemAsync.mockResolvedValue(null);

            const locked = await isLocked();

            expect(locked).toBe(false);
            expect(AsyncStorage.multiRemove).toHaveBeenCalled();
        });
    });
});
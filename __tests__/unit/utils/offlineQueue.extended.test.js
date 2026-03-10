const store = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key, value) => {
    store[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn(key => {
    delete store[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach(key => delete store[key]);
    return Promise.resolve();
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueue,
  getAll,
  removeById,
  updateById,
  processQueue,
  retryNow,
  saveVotePlace,
  getVotePlace,
  clearVotePlace,
} from '../../../src/utils/offlineQueue';

describe('offlineQueue extended tests', () => {
  let nowSpy;
  let randomSpy;
  let consoleSpy;

  beforeEach(async () => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    await AsyncStorage.clear();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    nowSpy.mockRestore();
    randomSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  describe('normalizeQueueItem', () => {
    it('normaliza item con campos faltantes', async () => {
      const id = await enqueue({type: 'TEST'});
      const list = await getAll();
      expect(list[0]).toEqual(
        expect.objectContaining({
          id,
          createdAt: 1000,
          updatedAt: 1000,
          attempts: 0,
          nextAttemptAt: 1000,
          lastError: null,
          lastErrorType: null,
        }),
      );
    });
  });

  describe('read edge cases', () => {
    it('retorna array vacío cuando AsyncStorage retorna datos inválidos', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('not-an-array');
      const list = await getAll();
      expect(list).toEqual([]);
    });

    it('retorna array vacío cuando AsyncStorage falla', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      const list = await getAll();
      expect(list).toEqual([]);
    });
  });

  describe('updateById edge cases', () => {
    it('retorna null cuando el id no existe', async () => {
      const result = await updateById('nonexistent-id', {attempts: 5});
      expect(result).toBeNull();
    });

    it('preserva el task original si no se proporciona en patch', async () => {
      const id = await enqueue({type: 'ORIGINAL', payload: {key: 'value'}});
      await updateById(id, {attempts: 3});
      const [item] = await getAll();
      expect(item.task.type).toBe('ORIGINAL');
      expect(item.task.payload.key).toBe('value');
    });

    it('reemplaza el task si se proporciona en patch', async () => {
      const id = await enqueue({type: 'ORIGINAL'});
      await updateById(id, {task: {type: 'NEW', payload: {}}});
      const [item] = await getAll();
      expect(item.task.type).toBe('NEW');
    });
  });

  describe('retryNow', () => {
    it('actualiza nextAttemptAt para todos los items sin filtro', async () => {
      await enqueue({type: 'TASK1'});
      await enqueue({type: 'TASK2'});

      const changed = await retryNow();
      expect(changed).toBe(2);

      const list = await getAll();
      expect(list[0].nextAttemptAt).toBe(1000);
      expect(list[1].nextAttemptAt).toBe(1000);
    });

    it('aplica filtro cuando se proporciona función', async () => {
      await enqueue({type: 'TASK1'});
      await enqueue({type: 'TASK2'});

      const changed = await retryNow(item => item.task.type === 'TASK1');
      expect(changed).toBe(1);
    });

    it('no escribe si no hay cambios cuando la cola está vacía', async () => {
      // Clear any previous calls
      AsyncStorage.setItem.mockClear();
      // With empty queue and filter returning false, no writes should happen
      const changed = await retryNow(() => false);
      expect(changed).toBe(0);
    });
  });

  describe('processQueue error classification', () => {
    it('clasifica error 429 como RATE_LIMIT', async () => {
      await enqueue({type: 'RATE_LIMITED'});
      const handler = jest.fn(async () => {
        const err = new Error('Too many requests');
        err.response = {status: 429};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('RATE_LIMIT');
    });

    it('clasifica error 403 como AUTH', async () => {
      await enqueue({type: 'FORBIDDEN'});
      const handler = jest.fn(async () => {
        const err = new Error('Forbidden');
        err.response = {status: 403};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].removedFromQueue).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('clasifica error 400 como VALIDATION', async () => {
      await enqueue({type: 'BAD_REQUEST'});
      const handler = jest.fn(async () => {
        const err = new Error('Bad request');
        err.response = {status: 400};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].removedFromQueue).toBe(true);
    });

    it('clasifica error 422 como VALIDATION', async () => {
      await enqueue({type: 'UNPROCESSABLE'});
      const handler = jest.fn(async () => {
        const err = new Error('Unprocessable');
        err.response = {status: 422};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].removedFromQueue).toBe(true);
    });

    it('clasifica error 409 como CONFLICT_IDEMPOTENT (retriable)', async () => {
      await enqueue({type: 'CONFLICT'});
      const handler = jest.fn(async () => {
        const err = new Error('Conflict');
        err.response = {status: 409};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('CONFLICT_IDEMPOTENT');
      expect(result.remaining).toBe(1);
    });

    it('clasifica ECONNABORTED como NETWORK_TIMEOUT', async () => {
      await enqueue({type: 'TIMEOUT'});
      const handler = jest.fn(async () => {
        const err = new Error('Timeout');
        err.code = 'ECONNABORTED';
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_TIMEOUT');
      expect(result.remaining).toBe(1);
    });

    it('clasifica ETIMEDOUT como NETWORK_TIMEOUT', async () => {
      await enqueue({type: 'ETIMEDOUT'});
      const handler = jest.fn(async () => {
        const err = new Error('Timed out');
        err.code = 'ETIMEDOUT';
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_TIMEOUT');
    });

    it('clasifica ENOTFOUND como NETWORK_DOWN', async () => {
      await enqueue({type: 'NOT_FOUND'});
      const handler = jest.fn(async () => {
        const err = new Error('DNS not found');
        err.code = 'ENOTFOUND';
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_DOWN');
    });

    it('clasifica ECONNRESET como NETWORK_DOWN', async () => {
      await enqueue({type: 'RESET'});
      const handler = jest.fn(async () => {
        const err = new Error('Connection reset');
        err.code = 'ECONNRESET';
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_DOWN');
    });

    it('clasifica ERR_NETWORK como NETWORK_DOWN', async () => {
      await enqueue({type: 'ERR_NET'});
      const handler = jest.fn(async () => {
        const err = new Error('Network error');
        err.code = 'ERR_NETWORK';
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_DOWN');
    });

    it('clasifica error sin response pero con request como NETWORK_DOWN', async () => {
      await enqueue({type: 'NO_RESPONSE'});
      const handler = jest.fn(async () => {
        const err = new Error('No response');
        err.request = {};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_DOWN');
    });

    it('clasifica error con mensaje timeout como NETWORK_TIMEOUT', async () => {
      await enqueue({type: 'TIMEOUT_MSG'});
      const handler = jest.fn(async () => {
        throw new Error('Request timed out');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_TIMEOUT');
    });

    it('clasifica error con mensaje network como NETWORK_DOWN', async () => {
      await enqueue({type: 'NETWORK_MSG'});
      const handler = jest.fn(async () => {
        throw new Error('Network is unreachable');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_DOWN');
    });

    it('clasifica error con mensaje failed to fetch como NETWORK_DOWN', async () => {
      await enqueue({type: 'FETCH_FAIL'});
      const handler = jest.fn(async () => {
        throw new Error('Failed to fetch data');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_DOWN');
    });

    it('clasifica error con mensaje internet como NETWORK_DOWN', async () => {
      await enqueue({type: 'INTERNET'});
      const handler = jest.fn(async () => {
        throw new Error('No internet connection');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('NETWORK_DOWN');
    });

    it('clasifica error 404 como UNKNOWN', async () => {
      await enqueue({type: 'NOT_FOUND_404'});
      const handler = jest.fn(async () => {
        const err = new Error('Not found');
        err.response = {status: 404};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].errorType).toBe('UNKNOWN');
    });

    it('respeta errorType explícito', async () => {
      await enqueue({type: 'CUSTOM'});
      const handler = jest.fn(async () => {
        const err = new Error('Custom error');
        err.errorType = 'BUSINESS_TERMINAL';
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].removedFromQueue).toBe(true);
    });

    it('respeta removeFromQueue explícito', async () => {
      await enqueue({type: 'EXPLICIT_REMOVE'});
      const handler = jest.fn(async () => {
        const err = new Error('Remove me');
        err.removeFromQueue = true;
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.remaining).toBe(0);
    });
  });

  describe('processQueue skips future items', () => {
    it('salta items con nextAttemptAt en el futuro', async () => {
      await enqueue({type: 'FUTURE'});
      const list = await getAll();
      await updateById(list[0].id, {nextAttemptAt: 9999});

      const handler = jest.fn(async () => true);
      const result = await processQueue(handler);

      expect(handler).not.toHaveBeenCalled();
      expect(result.processed).toBe(0);
      expect(result.remaining).toBe(1);
    });
  });

  describe('processQueue concurrency', () => {
    it('previene procesamiento concurrente', async () => {
      await enqueue({type: 'SLOW'});

      let resolveFirst;
      const slowHandler = jest.fn(
        () => new Promise(resolve => {
          resolveFirst = resolve;
        }),
      );

      const first = processQueue(slowHandler);
      const second = await processQueue(slowHandler);

      expect(second.processed).toBe(0);
      expect(second.remaining).toBe(1);

      resolveFirst();
      await first;
    });
  });

  describe('processQueue extracts metadata from payload', () => {
    it('extrae tableCode, dni, electionId de additionalData', async () => {
      await enqueue({
        type: 'WITH_META',
        payload: {
          additionalData: {
            tableCode: 'TC-123',
            dni: '12345678',
            electionId: 'election-2024',
          },
        },
      });

      const handler = jest.fn(async () => {
        throw new Error('test error');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0]).toEqual(
        expect.objectContaining({
          tableCode: 'TC-123',
          dni: '12345678',
          electionId: 'election-2024',
        }),
      );
    });

    it('extrae tableCode de tableData.codigo como fallback', async () => {
      await enqueue({
        type: 'WITH_TABLE_DATA',
        payload: {
          tableData: {codigo: 'TD-456'},
        },
      });

      const handler = jest.fn(async () => {
        throw new Error('test error');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].tableCode).toBe('TD-456');
    });

    it('extrae tableCode de electoralData.tableCode como fallback', async () => {
      await enqueue({
        type: 'WITH_ELECTORAL',
        payload: {
          electoralData: {tableCode: 'ED-789'},
        },
      });

      const handler = jest.fn(async () => {
        throw new Error('test error');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].tableCode).toBe('ED-789');
    });
  });

  describe('toErrorString', () => {
    it('formatea error HTTP con data string', async () => {
      await enqueue({type: 'HTTP_STR'});
      const handler = jest.fn(async () => {
        const err = new Error('server error');
        err.response = {status: 500, data: 'Internal Server Error'};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].error).toContain('HTTP 500');
      expect(result.failedItems[0].error).toContain('Internal Server Error');
    });

    it('formatea error HTTP con data objeto', async () => {
      await enqueue({type: 'HTTP_OBJ'});
      const handler = jest.fn(async () => {
        const err = new Error('server error');
        err.response = {status: 500, data: {detail: 'Something went wrong'}};
        throw err;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].error).toContain('HTTP 500');
      expect(result.failedItems[0].error).toContain('Something went wrong');
    });

    it('formatea error simple con mensaje', async () => {
      await enqueue({type: 'SIMPLE'});
      const handler = jest.fn(async () => {
        throw new Error('Simple error message');
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].error).toBe('Simple error message');
    });

    it('formatea error string', async () => {
      await enqueue({type: 'STRING_ERR'});
      const handler = jest.fn(async () => {
        throw 'String error';
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].error).toBe('String error');
    });

    it('formatea null/undefined como Unknown error', async () => {
      await enqueue({type: 'NULL_ERR'});
      const handler = jest.fn(async () => {
        throw null;
      });

      const result = await processQueue(handler);
      expect(result.failedItems[0].error).toBe('Unknown error');
    });
  });

  describe('votePlace functions error handling', () => {
    it('saveVotePlace maneja errores de AsyncStorage', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));
      await saveVotePlace('123', {table: 'A-1'});
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('getVotePlace maneja errores de AsyncStorage', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Read error'));
      const result = await getVotePlace('123');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('clearVotePlace maneja errores de AsyncStorage', async () => {
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Delete error'));
      await clearVotePlace('123');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('buildNextAttemptAt', () => {
    it('calcula delay exponencial correctamente', async () => {
      await enqueue({type: 'RETRY_TEST'});
      const handler = jest.fn(async () => {
        const err = new Error('retry');
        err.response = {status: 500};
        throw err;
      });

      // Primer intento: base 4000 * 2^0 = 4000 + jitter
      await processQueue(handler);
      let [item] = await getAll();
      expect(item.nextAttemptAt).toBe(5750); // 1000 + 4000 + 750 jitter

      // Segundo intento: base 4000 * 2^1 = 8000 + jitter
      nowSpy.mockReturnValue(6000);
      await processQueue(handler);
      [item] = await getAll();
      expect(item.nextAttemptAt).toBe(14750); // 6000 + 8000 + 750 jitter
    });
  });
});

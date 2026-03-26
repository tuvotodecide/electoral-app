import * as mockedEnv from '@env';
import {
  HTTPS_REQUIRED_ENV_KEYS,
  assertHttpsUrl,
  validateCriticalRemoteEnvConfig,
  validateHttpsUrl,
} from '../../../src/config/envSecurity';

describe('envSecurity', () => {
  it('valida que los endpoints criticos configurados por env usen https', () => {
    const result = validateCriticalRemoteEnvConfig(mockedEnv);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    for (const key of HTTPS_REQUIRED_ENV_KEYS) {
      if (!(key in mockedEnv)) {
        continue;
      }

      expect(typeof mockedEnv[key]).toBe('string');
      expect(String(mockedEnv[key]).trim()).not.toBe('');
      expect(String(mockedEnv[key])).toMatch(/^https:\/\//i);
      expect(String(mockedEnv[key])).not.toMatch(/^http:\/\//i);
    }
  });

  it('rechaza valores vacios o malformados', () => {
    expect(validateHttpsUrl('BACKEND_RESULT', '').ok).toBe(false);
    expect(validateHttpsUrl('BACKEND_RESULT', 'backend.example').ok).toBe(false);
  });

  it('rechaza explicitamente http y lanza error descriptivo', () => {
    expect(validateHttpsUrl('API_URL', 'http://api.example').reason).toBe(
      'http_not_allowed',
    );

    expect(() => assertHttpsUrl('API_URL', 'http://api.example')).toThrow(
      '[ENV] API_URL must be a non-empty https:// URL (http_not_allowed)',
    );
  });

  it('acepta https valido y retorna la url normalizada', () => {
    expect(assertHttpsUrl('API_URL', 'https://api.example')).toBe(
      'https://api.example',
    );
  });
});

import * as env from '@env';

// URLs remotas críticas que deben usar HTTPS en entornos reales.
export const HTTPS_REQUIRED_ENV_KEYS = [
  'BACKEND',
  'BACKEND_RESULT',
  'BACKEND_URL',
  'API_URL',
  'BACKEND_IDENTITY',
  'BACKEND_BLOCKCHAIN',
  'CIRCUITS_URL',
  'GATEWAY_BASE',
  'TERMS_URL',
  'PRIVACY_URL',
  'VERIFIER_REQUEST_ENDPOINT',
  'BUNDLER',
  'BUNDLER_ARBITRUM',
  'BUNDLER_MAIN',
  'BUNDLER_MAIN_ARBITRUM',
];

const normalizeUrlValue = value => String(value || '').trim();

export const validateHttpsUrl = (name, value, {required = true} = {}) => {
  const normalized = normalizeUrlValue(value);

  if (!normalized) {
    return {
      ok: required === false,
      reason: required ? 'missing' : null,
      value: normalized,
      name,
    };
  }

  if (!/^https:\/\//i.test(normalized)) {
    return {
      ok: false,
      reason: /^http:\/\//i.test(normalized) ? 'http_not_allowed' : 'malformed_protocol',
      value: normalized,
      name,
    };
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:') {
      return {
        ok: false,
        reason: 'invalid_protocol',
        value: normalized,
        name,
      };
    }
  } catch {
    return {
      ok: false,
      reason: 'invalid_url',
      value: normalized,
      name,
    };
  }

  return {
    ok: true,
    reason: null,
    value: normalized,
    name,
  };
};

export const validateCriticalRemoteEnvConfig = (sourceEnv = env) => {
  const results = HTTPS_REQUIRED_ENV_KEYS.map(key =>
    validateHttpsUrl(key, sourceEnv?.[key], {required: false}),
  );

  return {
    valid: results.every(item => item.ok),
    results,
    errors: results.filter(item => !item.ok),
  };
};

export const assertHttpsUrl = (name, value, options) => {
  const result = validateHttpsUrl(name, value, options);
  if (!result.ok) {
    throw new Error(
      `[ENV] ${name} must be a non-empty https:// URL${result.reason ? ` (${result.reason})` : ''}`,
    );
  }
  return result.value;
};

export default {
  HTTPS_REQUIRED_ENV_KEYS,
  validateHttpsUrl,
  validateCriticalRemoteEnvConfig,
  assertHttpsUrl,
};

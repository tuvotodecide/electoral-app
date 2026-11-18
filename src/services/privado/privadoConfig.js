import {
  BACKEND_IDENTITY,
  IDENTITY_KEY,
  PRIVADO_BLOCKCHAIN,
  PRIVADO_NETWORK,
  PRIVADO_CHAIN_ID,
  PRIVADO_RPC_URL,
  PRIVADO_STATE_CONTRACT_ADDRESS,
  PRIVADO_UNIVERSAL_VERIFIER_ADDRESS,
  PRIVADO_DID_RESOLVER_URL,
  PRIVADO_ISSUER_DID,
  PRIVADO_ISSUER_BASE_URL,
  PRIVADO_ISSUER_LEGACY_STATUS_ORIGINS,
  PRIVADO_CRED_TYPE,
  PRIVADO_CRED_SCHEMA_URL,
  PRIVADO_CRED_CONTEXT_URL,
  PRIVADO_IDENTITY_CREDENTIAL_TYPE,
  PRIVADO_VOTE_CREDENTIAL_TYPE,
  PRIVADO_IPFS_GATEWAY_URL,
  PRIVADO_LOCK_ON_BACKGROUND,
  PRIVADO_IDLE_TIMEOUT_MINUTES,
} from '@env';

const trim = value => String(value ?? '').trim();

const requireEnv = (name, value) => {
  const normalized = trim(value);
  if (!normalized) {
    throw new Error(`[privado] Falta la variable de entorno ${name}.`);
  }
  return normalized;
};

const optionalEnv = value => trim(value) || undefined;

/**
 * Configuración del SDK de Privado ID (Base Sepolia) a partir de `.env`.
 * Es una función para que la falta de una variable falle al crear la sesión,
 * no al importar el módulo.
 */
export function buildPrivadoConfig() {
  const chainId = Number(requireEnv('PRIVADO_CHAIN_ID', PRIVADO_CHAIN_ID));
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error('[privado] PRIVADO_CHAIN_ID debe ser un entero positivo.');
  }

  const config = {
    network: {
      blockchain: requireEnv('PRIVADO_BLOCKCHAIN', PRIVADO_BLOCKCHAIN),
      name: requireEnv('PRIVADO_NETWORK', PRIVADO_NETWORK),
      chainId,
      rpcUrl: requireEnv('PRIVADO_RPC_URL', PRIVADO_RPC_URL),
    },
    contracts: {
      stateContractAddress: requireEnv(
        'PRIVADO_STATE_CONTRACT_ADDRESS',
        PRIVADO_STATE_CONTRACT_ADDRESS,
      ),
      universalVerifierAddress: requireEnv(
        'PRIVADO_UNIVERSAL_VERIFIER_ADDRESS',
        PRIVADO_UNIVERSAL_VERIFIER_ADDRESS,
      ),
    },
    didResolver: {
      didResolverUrl: requireEnv('PRIVADO_DID_RESOLVER_URL', PRIVADO_DID_RESOLVER_URL),
    },
    // backend-identity: sesión de billetera (SIWE) y proxy del paymaster.
    identityApi: {
      baseUrl: requireEnv('BACKEND_IDENTITY', BACKEND_IDENTITY),
      apiKey: requireEnv('IDENTITY_KEY', IDENTITY_KEY),
    },
    circuits: {artifacts: []},
  };

  const issuerDid = optionalEnv(PRIVADO_ISSUER_DID);
  if (issuerDid) {
    const issuerBaseUrl = optionalEnv(PRIVADO_ISSUER_BASE_URL);
    config.issuer = {
      issuerDid,
      issuerBaseUrl,
      credentialStatusOriginRewrites: buildStatusOriginRewrites(issuerBaseUrl),
    };
  }

  const credentialType = optionalEnv(PRIVADO_CRED_TYPE);
  if (credentialType) {
    config.credential = {
      credentialType,
      credentialSchema: requireEnv('PRIVADO_CRED_SCHEMA_URL', PRIVADO_CRED_SCHEMA_URL),
      credentialContext: requireEnv('PRIVADO_CRED_CONTEXT_URL', PRIVADO_CRED_CONTEXT_URL),
    };
  }

  return config;
}

/**
 * PRIVADO_ISSUER_LEGACY_STATUS_ORIGINS: orígenes internos del issuer node (separados
 * por coma, p. ej. `http://localhost:3001`) que quedaron grabados en el
 * `credentialStatus.id` de credenciales ya emitidas. Al comprobar la revocación,
 * el SDK los reemplaza por el origen de PRIVADO_ISSUER_BASE_URL.
 */
function buildStatusOriginRewrites(issuerBaseUrl) {
  const origins = trim(PRIVADO_ISSUER_LEGACY_STATUS_ORIGINS)
    .split(',')
    .map(trim)
    .filter(Boolean);
  if (origins.length === 0) {
    return undefined;
  }
  if (!issuerBaseUrl) {
    throw new Error(
      '[privado] PRIVADO_ISSUER_LEGACY_STATUS_ORIGINS requiere PRIVADO_ISSUER_BASE_URL.',
    );
  }
  return Object.fromEntries(origins.map(origin => [origin, issuerBaseUrl]));
}

/**
 * Tipo de la credencial de identidad (PRIVADO_IDENTITY_CREDENTIAL_TYPE), la que
 * emite backend-identity en el registro. Debe coincidir con su ISSUER_CREDENTIAL_TYPE.
 */
export const getIdentityCredentialType = () =>
  requireEnv('PRIVADO_IDENTITY_CREDENTIAL_TYPE', PRIVADO_IDENTITY_CREDENTIAL_TYPE);

/**
 * Tipo de la credencial de voto (PRIVADO_VOTE_CREDENTIAL_TYPE), la que emite
 * back-results para cada evento. Debe coincidir con su VOTE_CRED_TYPE.
 */
export const getVoteCredentialType = () =>
  requireEnv('PRIVADO_VOTE_CREDENTIAL_TYPE', PRIVADO_VOTE_CREDENTIAL_TYPE);

/** Gateway para contextos JSON-LD `ipfs://`. Sin valor, el SDK usa su gateway por defecto. */
export const getPrivadoIpfsGatewayUrl = () => optionalEnv(PRIVADO_IPFS_GATEWAY_URL);

/**
 * Política de bloqueo del vault (obligatoria en el SDK):
 * - PRIVADO_LOCK_ON_BACKGROUND: `true` / `false`, bloquear al pasar a segundo plano.
 * - PRIVADO_IDLE_TIMEOUT_MINUTES: minutos sin uso antes de bloquear (> 0).
 */
export function buildPrivadoLockPolicy() {
  const background = requireEnv('PRIVADO_LOCK_ON_BACKGROUND', PRIVADO_LOCK_ON_BACKGROUND).toLowerCase();
  if (background !== 'true' && background !== 'false') {
    throw new Error('[privado] PRIVADO_LOCK_ON_BACKGROUND debe ser true o false.');
  }
  const minutes = Number(requireEnv('PRIVADO_IDLE_TIMEOUT_MINUTES', PRIVADO_IDLE_TIMEOUT_MINUTES));
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error('[privado] PRIVADO_IDLE_TIMEOUT_MINUTES debe ser un número mayor que 0.');
  }
  return {lockOnBackground: background === 'true', idleTimeoutMinutes: minutes};
}

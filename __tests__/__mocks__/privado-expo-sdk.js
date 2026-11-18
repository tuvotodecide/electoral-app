// Mock de @privado-id/expo-sdk: el SDK real carga módulos nativos
// (expo-sqlite, rapidsnark, witnesscalc) que no existen en Jest.

const CircuitId = {
  AuthV2: 'AuthV2',
  CredentialAtomicQuerySigV2: 'credentialAtomicQuerySigV2',
  CredentialAtomicQuerySigV2OnChain: 'credentialAtomicQuerySigV2OnChain',
  CredentialAtomicQueryMTPV2: 'credentialAtomicQueryMTPV2',
  CredentialAtomicQueryMTPV2OnChain: 'credentialAtomicQueryMTPV2OnChain',
  CredentialAtomicQueryV3OnChain: 'credentialAtomicQueryV3OnChain',
};

class PrivadoExpoSdkError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'PrivadoExpoSdkError';
    this.cause = cause;
  }
}

class IdentityApiError extends PrivadoExpoSdkError {
  constructor(message, status, path, cause) {
    super(message, cause);
    this.status = status;
    this.path = path;
  }
}

class IdentityApiUnreachableError extends IdentityApiError {
  constructor(path, cause) {
    super(
      `backend-identity is not reachable (${path}): ${cause?.message ?? cause}`,
      undefined,
      path,
      cause,
    );
  }
}

class RegistryRefusalError extends PrivadoExpoSdkError {
  constructor(summary, code, analysisCode, details) {
    super(
      `${summary}: ${code}${analysisCode ? ` (${analysisCode})` : ''}${details ? `: ${details}` : ''}`,
    );
    this.code = code;
    this.analysisCode = analysisCode;
    this.details = details;
  }
}

class RegistryRecoveryError extends RegistryRefusalError {
  constructor(code, analysisCode, details) {
    super('backend-identity did not return the backup', code, analysisCode, details);
  }
}

class RegistryRegistrationError extends RegistryRefusalError {
  constructor(code, details) {
    super('backend-identity did not register the account', code, undefined, details);
  }
}

class RegistryProfileError extends RegistryRefusalError {
  constructor(code, details) {
    super('backend-identity did not update the registry record', code, undefined, details);
  }
}

class IdentityDocumentAnalysisError extends RegistryRefusalError {
  constructor(code, analysisCode, details) {
    super('backend-identity did not analyze the identity document', code, analysisCode, details);
  }
}

class IdentityCredentialError extends PrivadoExpoSdkError {
  constructor(code, message, details, cause) {
    super(message, cause);
    this.code = code;
    this.details = details;
  }
}

class VaultError extends PrivadoExpoSdkError {
  constructor(code, message, cause) {
    super(message, cause);
    this.code = code;
  }
}

class VerifierResponseError extends PrivadoExpoSdkError {
  constructor(callbackUrl, httpStatus, responseText = '') {
    super(`Verifier rejected the response with HTTP ${httpStatus}${responseText ? `: ${responseText}` : '.'}`);
    this.callbackUrl = callbackUrl;
    this.httpStatus = httpStatus;
    this.responseText = responseText;
  }
}

class UserOperationReceiptError extends Error {
  constructor(userOperationHash, timedOut, cause) {
    super(
      timedOut
        ? `Timed out waiting for the receipt of UserOperation ${userOperationHash}`
        : `Could not read the receipt of UserOperation ${userOperationHash}`,
    );
    this.name = 'UserOperationReceiptError';
    this.userOperationHash = userOperationHash;
    this.timedOut = timedOut;
    this.cause = cause;
  }
}

class UserDataBackupError extends PrivadoExpoSdkError {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const createMockVault = () => {
  let unlocked = false;
  return {
    exists: jest.fn(async () => true),
    unlock: jest.fn(async () => {
      unlocked = true;
    }),
    lock: jest.fn(() => {
      unlocked = false;
    }),
    isUnlocked: jest.fn(() => unlocked),
    touch: jest.fn(),
    onStateChange: jest.fn(() => () => undefined),
    verifyPin: jest.fn(async () => true),
    changePin: jest.fn(async () => undefined),
    canUseBiometrics: jest.fn(async () => true),
    isBiometricsEnabled: jest.fn(async () => false),
    enableBiometrics: jest.fn(async () => undefined),
    disableBiometrics: jest.fn(async () => undefined),
    reset: jest.fn(async () => undefined),
    lockPolicy: {lockOnBackground: true, idleTimeoutMinutes: 5},
  };
};

const createMockSession = () => {
  const vault = createMockVault();
  return {
  vault,

  client: {
    vault,
    config: {network: {blockchain: 'base', name: 'sepolia', chainId: 84532}},
    init: jest.fn(async () => undefined),
    getHolderDid: jest.fn(async () => undefined),
    getCredentials: jest.fn(async () => []),
    getCredentialById: jest.fn(async () => undefined),
    findCredentialsByType: jest.fn(async () => []),
    getCredentialByType: jest.fn(async () => undefined),
    analyzeIdentityDocument: jest.fn(async () => ({
      data: {
        numeroDoc: '00000000',
        fullName: 'Mock User',
        fechaNacimiento: '1990-01-01',
        fechaExpedicion: '2020-01-01',
        lugarExpedicion: 'La Paz',
        faceMatch: true,
      },
      identityToken: 'mock.identity.token',
      identityTokenExpiresAt: '2026-01-01T00:10:00.000Z',
    })),
    requestIdentityCredential: jest.fn(async () => ({
      credentialId: 'mock-credential-id',
      deepLink: 'iden3comm://?request_uri=https%3A%2F%2Fissuer.example%2Fqr',
      statePublication: {status: 'published', txId: '0xmock'},
    })),
    claimCredentialFromIssuer: jest.fn(async () => ({stored: true})),
    createOrLoadHolderDid: jest.fn(async () => ({
      did: 'did:iden3:base:sepolia:mock',
      keyId: 'BJJ:mock',
      wallet: {address: '0x00000000000000000000000000000000000000aa'},
      isNew: true,
    })),
    createBackup: jest.fn(async () => 'privado-id-backup:1:mock'),
    registerAccount: jest.fn(async () => ({
      id: 'did:iden3:base:sepolia:mock',
      did: 'did:iden3:base:sepolia:mock',
      accountAddress: '0x00000000000000000000000000000000000000aa',
    })),
    offChainZk: {
      getZkRequest: jest.fn(async () => ({})),
      generateZkResponse: jest.fn(async () => ({})),
      submitZkResponse: jest.fn(async () => ({})),
    },
    onChainZk: {
      sendHolderUserOperation: jest.fn(async () => ({
        sender: '0x00000000000000000000000000000000000000aa',
        userOperationHash: `0x${'cd'.repeat(32)}`,
      })),
      waitForUserOperationReceipt: jest.fn(async ({userOperationHash}) => ({
        sender: '0x00000000000000000000000000000000000000aa',
        userOperationHash,
        transactionHash: `0x${'ab'.repeat(32)}`,
        success: true,
        blockNumber: '16',
        actualGasCost: '1',
      })),
      sendHolderSmartWalletCalls: jest.fn(async () => ({
        sender: '0x00000000000000000000000000000000000000aa',
        userOperationHash: `0x${'cd'.repeat(32)}`,
        transactionHash: `0x${'ab'.repeat(32)}`,
        success: true,
        blockNumber: '16',
        actualGasCost: '1',
      })),
      readContract: jest.fn(async () => undefined),
    },
    downloadRegistryBackup: jest.fn(async () => ({
      discoverableHash: '0xmock',
      storedAt: '2026-01-01T00:00:00.000Z',
      isPrivadoBackup: true,
    })),
    getStoredRegistryBackup: jest.fn(async () => undefined),
    deleteLocalData: jest.fn(async () => undefined),
    changePin: jest.fn(async () => ({registryBackupUpdated: true})),
    getRegistryProfile: jest.fn(async () => ({
      did: 'did:iden3:base:sepolia:mock',
      accountAddress: '0x00000000000000000000000000000000000000aa',
    })),
    updateRegistryProfile: jest.fn(async () => ({id: 'did:iden3:base:sepolia:mock'})),
    restoreBackup: jest.fn(async () => ({
      createdAt: '2026-01-01T00:00:00.000Z',
      did: 'did:iden3:base:sepolia:mock',
      credentials: 1,
      privateKeys: 1,
    })),
    deleteStoredRegistryBackup: jest.fn(async () => undefined),
    registryCheckByDni: jest.fn(async dni => ({
      exists: false,
      discoverableHash: `0xmock-${dni}`,
    })),
  },
  storage: {
    databaseName: 'privado_id_credentials.db',
    databaseDirectory: '/mock/SQLite',
    databasePath: '/mock/SQLite/privado_id_credentials.db',
    platform: 'android',
    excludedFromBackup: true,
  },
  circuits: {
    store: {},
    registerCached: jest.fn(async () => ({descriptors: [], missing: []})),
    createDownloader: jest.fn(() => ({
      prepare: jest.fn(async () => ({status: 'downloaded', descriptors: []})),
    })),
  },
  jsonLd: {contextStore: {}},
  };
};

module.exports = {
  __esModule: true,
  CircuitId,
  PrivadoExpoSdkError,
  IdentityApiError,
  IdentityApiUnreachableError,
  RegistryRefusalError,
  RegistryRecoveryError,
  IdentityDocumentAnalysisError,
  RegistryRegistrationError,
  RegistryProfileError,
  VaultError,
  IdentityCredentialError,
  UserDataBackupError,
  UserOperationReceiptError,
  VerifierResponseError,
  createMockVault,
  createMockSession,
  createPersistentPrivadoExpoClient: jest.fn(async () => createMockSession()),
};

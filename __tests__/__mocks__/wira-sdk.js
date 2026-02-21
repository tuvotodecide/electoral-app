class SharedSession {
  constructor() {}

  checkRegisteredOnThisDevice = jest.fn(async () => []);
  openFirstAppFound = jest.fn(async () => undefined);
  signInWithSharedSession = jest.fn(async () => undefined);
  handleShareResponse = jest.fn((_setSharedUrl, _onAccept, _onDecline) => undefined);
  onShareSession = jest.fn(async () => undefined);
}

class RegistryApi {
  constructor() {}

  registryCheckByDni = jest.fn(async () => ({exists: false}));
}

class RecoveryService {
  constructor() {}

  recoveryFromBackup = jest.fn(async () => ({
    identity: true,
    dni: '00000000',
  }));
  recoveryAndSave = jest.fn(async () => undefined);
  saveBackupData = jest.fn(async () => undefined);
  recoveryFromGuardians = jest.fn(async () => JSON.stringify({}));
  saveRecoveryDataFromGuardians = jest.fn(async () => undefined);
}

class Registerer {
  constructor() {
    this.walletData = {address: '0xmock'};
  }

  createVC = jest.fn(async () => undefined);
  createWallet = jest.fn(async () => ({guardianAddress: '0xguardian'}));
  storeOnDevice = jest.fn(async () => undefined);
  storeDataOnServer = jest.fn(async () => ({ok: true}));
}

class GuardiansApi {
  constructor() {}

  inviteUrl = '/guardians/invite';
  requestRecoveryUrl = '/guardians/recovery';

  invite = jest.fn(async () => ({ok: true}));
  requestRecovery = jest.fn(async () => ({ok: true}));
  removeGuardian = jest.fn(async () => ({ok: true}));
  updateGuardianNickname = jest.fn(async () => ({ok: true}));
  respondInvitation = jest.fn(async () => ({ok: true}));
  respondRecovery = jest.fn(async () => ({ok: true}));
  hasGuardians = jest.fn(async () => ({has: true}));
  recoveryDetail = jest.fn(async () => ({ok: true}));
  recoveryStatus = jest.fn(async () => ({ok: true}));
  myGuardians = jest.fn(async () => ({guardians: []}));
  listInvitations = jest.fn(async () => ({invitations: []}));
  listRecoveries = jest.fn(async () => ({requests: []}));
  getThreshold = jest.fn(async () => ({threshold: 2}));
}

const wira = {
  SharedSession,
  RegistryApi,
  RecoveryService,
  Registerer,
  GuardiansApi,
  Storage: {
    checkUserData: jest.fn(async () => false),
  },
  DeviceId: {
    getDeviceId: jest.fn(async () => 'mock-device-id'),
  },
  Biometric: {
    getBioFlag: jest.fn(async () => false),
  },
  idCardAnalyzer: {
    ensureClient: jest.fn(async () => undefined),
    analyze: jest.fn(async () => ({success: true, data: {numeroDoc: '00000000'}})),
  },
  signIn: jest.fn(async () => ({
    did: 'did:mock',
    account: '0xmock',
    guardian: '0xguardian',
  })),
  checkBiometricAuth: jest.fn(async () => ({error: null, userData: null})),
  initWiraSdk: jest.fn(async () => undefined),
  provision: {
    ensureProvisioned: jest.fn(async () => undefined),
  },
  authenticateWithVerifier: jest.fn(async () => undefined),
};

const config = {
  CircuitDownloadStatus: {
    DOWNLOADING: 'DOWNLOADING',
    DONE: 'DONE',
    ERROR: 'ERROR',
  },
  initDownloadCircuits: jest.fn(async () => undefined),
};

module.exports = wira;
module.exports.default = wira;
module.exports.config = config;

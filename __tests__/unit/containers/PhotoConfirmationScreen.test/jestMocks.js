jest.mock(
  'react-redux',
  () => jest.requireActual('../../../__mocks__/react-redux'),
);

jest.mock(
  '../../../../src/components/common/CSafeAreaView',
  () => require('../../../__mocks__/components/common/CSafeAreaView'),
);

jest.mock(
  '../../../../src/components/common/CText',
  () => require('../../../__mocks__/components/common/CText'),
);

jest.mock(
  '../../../../src/components/common/UniversalHeader',
  () => require('../../../__mocks__/components/common/UniversalHeader'),
);

jest.mock(
  '../../../../src/components/modal/InfoModal',
  () => ({visible, title, message, onClose}) => {
    if (!visible) {
      return null;
    }
    const React = require('react');
    const {View, Text, TouchableOpacity} = require('react-native');
    return React.createElement(
      View,
      {testID: 'infoModal'},
      React.createElement(Text, {testID: 'infoModalTitle'}, title),
      React.createElement(Text, {testID: 'infoModalMessage'}, message),
      React.createElement(
        TouchableOpacity,
        {testID: 'infoModalCloseButton', onPress: onClose},
        React.createElement(Text, null, 'close'),
      ),
    );
  },
);

jest.mock(
  '../../../../src/i18n/String',
  () => require('../../../__mocks__/String').default,
);


jest.mock(
  '@react-navigation/native',
  () => jest.requireActual('../../../__mocks__/@react-navigation/native'),
);

jest.mock('react-native-vector-icons/Ionicons', () => {
  const {Ionicons} = require('../../../__mocks__/react-native-vector-icons');
  return Ionicons;
});

jest.mock('../../../../src/utils/pinataService', () => ({
  checkDuplicateBallot: jest.fn(),
  uploadElectoralActComplete: jest.fn(),
}));

jest.mock('../../../../src/api/account', () => ({
  executeOperation: jest.fn(),
}));

jest.mock('../../../../src/api/oracle', () => ({
  oracleCalls: {
    requestRegister: jest.fn(),
    createAttestation: jest.fn(),
    attest: jest.fn(),
  },
  oracleReads: {
    isRegistered: jest.fn(),
    waitForOracleEvent: jest.fn(),
    isUserJury: jest.fn(),
  },
}));

jest.mock('../../../../src/api/params', () => ({
  availableNetworks: {
    'test-chain': {
      explorer: 'https://explorer/',
      nftExplorer: 'https://nft/',
      attestationNft: 'attestation',
    },
  },
}));

jest.mock('../../../../src/utils/offlineQueue', () => ({
  enqueue: jest.fn(),
}));

jest.mock('../../../../src/utils/persistLocalImage', () => ({
  persistLocalImage: jest.fn(),
}));

jest.mock('../../../../src/utils/ballotValidation', () => ({
  validateBallotLocally: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('react-native-quick-crypto', () => ({
  randomBytes: jest.fn((size) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }),
  QuickCrypto: {
    randomBytes: jest.fn((size) => new Uint8Array(size)),
    pbkdf2: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  },
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => new Uint8Array(32)),
  })),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => new Uint8Array(32)),
  })),
  pbkdf2: jest.fn(() => Promise.resolve(new Uint8Array(32))),
}));

jest.mock('../../../../src/utils/Cifrate', () => ({
  createBundleFromPrivKey: jest.fn(() => Promise.resolve({
    seedHex: 'mock-seed-hex',
    cipherHex: 'mock-cipher-hex',
    saltHex: 'mock-salt-hex',
  })),
  createSeedBundle: jest.fn(() => Promise.resolve({
    seedHex: 'mock-seed-hex',
    cipherHex: 'mock-cipher-hex',
    saltHex: 'mock-salt-hex',
  })),
  signWithKey: jest.fn(() => Promise.resolve('mock-signature')),
  unlockSeed: jest.fn(() => Promise.resolve('mock-seed')),
  saveBundleFile: jest.fn(() => Promise.resolve()),
  loadBundleFile: jest.fn(() => Promise.resolve({
    cipherHex: 'mock-cipher-hex',
    saltHex: 'mock-salt-hex',
  })),
  getCredentialSubjectFromPayload: jest.fn((payload) => ({
    fullName: payload?.vc?.credentialSubject?.fullName || 'Test User',
    email: payload?.vc?.credentialSubject?.email || 'test@example.com',
    did: payload?.vc?.credentialSubject?.did || 'did:test:123',
  })),
}));

jest.mock('../../../../src/utils/aesGcm', () => ({
  aesGcmEncrypt: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  aesGcmDecrypt: jest.fn(() => Promise.resolve(new Uint8Array(32))),
}));

jest.mock('../../../../src/utils/BioFlag', () => ({
  getBioFlag: jest.fn(() => Promise.resolve(false)),
  setBioFlag: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../src/utils/ensureBundle', () => ({
  readBundleFile: jest.fn(() => Promise.resolve('{}')),
  writeBundleAtomic: jest.fn(() => Promise.resolve()),
}));

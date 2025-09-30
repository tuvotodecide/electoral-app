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

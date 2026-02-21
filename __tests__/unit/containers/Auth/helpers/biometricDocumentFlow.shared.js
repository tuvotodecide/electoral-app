jest.mock('../../../../../src/components/modal/SelectCountryModal', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({testID}) => React.createElement(View, {testID: testID || 'countrySelectionModal'});
});

jest.mock('../../../../../src/assets/svg', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    LockIcon: ({testID}) => React.createElement(View, {testID: testID || 'lockIcon'}),
    USFlagIcon: ({testID}) => React.createElement(View, {testID: testID || 'usFlagIcon'}),
  };
});

jest.mock('react-native-vector-icons/EvilIcons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return {
    __esModule: true,
    default: ({testID}) => React.createElement(Text, {testID: testID || 'evilIcon'}),
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return {
    __esModule: true,
    default: ({testID}) => React.createElement(Text, {testID: testID || 'ionIcon'}),
  };
});

jest.mock('../../../../../src/components/modal/TakePictureModal', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({testID}) => React.createElement(View, {testID: testID || 'selfieWithIdCardModal'});
});

export const limpiarMocksFlujoBiometria = () => {
  jest.clearAllMocks();
};

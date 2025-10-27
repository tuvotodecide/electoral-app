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
  '../../../../src/i18n/String',
  () => require('../../../__mocks__/String').default,
);

jest.mock(
  '../../../../src/hooks/useNavigationLogger',
  () => require('../../../__mocks__/hooks/useNavigationLogger'),
);

jest.mock('react-native-vector-icons/Ionicons', () => {
  const {Ionicons} = require('../../../__mocks__/react-native-vector-icons');
  return Ionicons;
});

jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const {MaterialIcons} = require('../../../__mocks__/react-native-vector-icons');
  return MaterialIcons;
});

jest.mock(
  '@react-navigation/native',
  () => jest.requireActual('../../../__mocks__/@react-navigation/native'),
);

jest.mock(
  '../../../../src/container/Vote/UploadRecord/CameraScreen',
  () => 'CameraScreen',
);

jest.mock(
  '../../../../src/components/common/CAlert',
  () => require('../../../__mocks__/components/common/CAlert').default,
);

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const MockIcon = ({ name, size = 24, color = '#000', style, onPress, testID }) => {
    return React.createElement('Text', {
      testID: testID || `icon-${name}`,
      style: [{ fontSize: size, color }, style],
      onPress,
      children: name,
    });
  };
  MockIcon.loadFont = jest.fn(() => Promise.resolve());
  MockIcon.hasIcon = jest.fn(() => Promise.resolve(true));
  MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mocked' }));
  MockIcon.getRawGlyphMap = jest.fn(() => ({}));
  return MockIcon;
});

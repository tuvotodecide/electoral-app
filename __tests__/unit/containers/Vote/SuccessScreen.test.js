import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import SuccessScreen from '../../../../src/container/Vote/common/SuccessScreen';
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';

const mockNavigation = {
  reset: jest.fn(),
  goBack: jest.fn(),
};
const mockRoute = {
  params: {
    fromNotifications: false,
    certificateData: {
      imageUrl: 'https://ipfs/certificate.png',
    },
    ipfsData: {
      imageUrl: 'https://ipfs/acta.png',
      jsonUrl: 'https://ipfs/acta.json',
    },
    nftData: {
      nftUrl: 'https://nft/123',
    },
  },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
  useFocusEffect: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector =>
    selector({
      theme: {
        theme: {
          background: '#FFFFFF',
          text: '#111111',
          primary: '#17694A',
        },
      },
      wallet: {
        payload: {
          vc: {
            credentialSubject: {
              fullName: 'Test User',
            },
          },
        },
      },
    }),
  ),
}));

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
jest.mock('../../../../src/components/modal/InfoModal', () => () => null);
jest.mock('../../../../src/utils/Cifrate', () => ({
  getCredentialSubjectFromPayload: () => ({fullName: 'Test User'}),
}));
jest.mock('../../../../src/utils/normalizedUri', () => ({
  normalizeUri: value => value || null,
}));
jest.mock('react-native-paper', () => ({
  ActivityIndicator: 'ActivityIndicator',
}));
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({name}) => React.createElement('Text', {testID: `icon-${name}`}, name);
});

describe('SuccessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.params = {
      fromNotifications: false,
      certificateData: {imageUrl: 'https://ipfs/certificate.png'},
      ipfsData: {
        imageUrl: 'https://ipfs/acta.png',
        jsonUrl: 'https://ipfs/acta.json',
      },
      nftData: {nftUrl: 'https://nft/123'},
    };
  });

  test('renderiza acciones principales de compartir y volver al inicio', () => {
    const {getByText} = render(<SuccessScreen />);

    expect(getByText('Compartir mi certificado')).toBeTruthy();
    expect(getByText('Compartir acta (resultados)')).toBeTruthy();
    expect(getByText('Regresar al inicio')).toBeTruthy();
  });

  test('al regresar desde flujo normal resetea a Home', () => {
    const {getByTestId} = render(<SuccessScreen />);

    fireEvent.press(getByTestId('UniversalHeaderBackButton'));

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: {screen: TabNav.HomeScreen},
        },
      ],
    });
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });

  test('si viene de notificaciones usa goBack en lugar de reset', () => {
    mockRoute.params = {
      ...mockRoute.params,
      fromNotifications: true,
    };

    const {getByTestId} = render(<SuccessScreen />);

    fireEvent.press(getByTestId('UniversalHeaderBackButton'));

    expect(mockNavigation.goBack).toHaveBeenCalled();
    expect(mockNavigation.reset).not.toHaveBeenCalled();
  });
});

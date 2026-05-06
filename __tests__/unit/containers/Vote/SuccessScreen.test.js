import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import SuccessScreen from '../../../../src/container/Vote/common/SuccessScreen';
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';
import {Share} from 'react-native';

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
  normalizeUri: value => {
    if (!value) return null;
    const raw = String(value);
    if (raw.startsWith('ipfs://')) {
      return `https://ipfs.io/ipfs/${raw.slice(7)}`;
    }
    return raw;
  },
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
    Share.share.mockResolvedValue({action: Share.sharedAction});
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

  test('comparte el acta usando image ipfs cuando llega en tableData', () => {
    mockRoute.params = {
      fromNotifications: false,
      certificateData: {imageUrl: 'https://ipfs/certificate.png'},
      tableData: {
        image: 'ipfs://QmActa1234567890',
      },
    };

    const {getByText} = render(<SuccessScreen />);

    fireEvent.press(getByText('Compartir acta (resultados)'));

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Compartir acta (resultados)',
        message: 'Resultados del acta: https://ipfs.io/ipfs/QmActa1234567890',
        url: 'https://ipfs.io/ipfs/QmActa1234567890',
      }),
      expect.objectContaining({
        dialogTitle: 'Compartir acta (resultados)',
      }),
    );
  });
});

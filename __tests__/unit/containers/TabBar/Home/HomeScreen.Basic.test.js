import React from 'react';
import {Linking} from 'react-native';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {renderWithProviders} from '../../../../setup/test-utils';
import axios from 'axios';

import HomeScreen from '../../../../../src/container/TabBar/Home/HomeScreen';
import {useElectionRepository} from '../../../../../src/features/voting';
import {StackNav} from '../../../../../src/navigation/NavigationKey';
import {clearSession} from '../../../../../src/utils/Session';

const mockNavigate = jest.fn();
const buildNavigation = () => ({
  navigate: mockNavigate,
  reset: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
});

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://result.example',
  FRONTEND_RESULTS: 'https://frontend.example',
}));

jest.mock('@react-navigation/native', () => {
  return {
    NavigationContainer: ({children}) => children,
    useFocusEffect: jest.fn(callback => callback()),
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => true),
    }),
  };
});

jest.mock('axios', () => ({
  defaults: {headers: {common: {}}},
  get: jest.fn(() => Promise.resolve({data: []})),
  post: jest.fn(() => Promise.resolve({data: {}})),
}));

jest.mock('../../../../../src/features/voting', () => {
  const actual = jest.requireActual('../../../../../src/features/voting');
  return {
    ...actual,
    useElectionRepository: jest.fn(),
  };
});

jest.mock('../../../../../src/assets/images', () => ({}));

jest.mock('../../../../../src/utils/offlineQueue', () => ({
  getAll: jest.fn(() => Promise.resolve([])),
  clearVotePlace: jest.fn(() => Promise.resolve()),
  getVotePlace: jest.fn(() => Promise.resolve(null)),
  processQueue: jest.fn(() => Promise.resolve()),
  removeById: jest.fn(() => Promise.resolve()),
  saveVotePlace: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('api-key')),
  publishActaHandler: jest.fn(() => Promise.resolve()),
  publishWorksheetHandler: jest.fn(() => Promise.resolve()),
  syncActaBackendHandler: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/worksheetLocalStatus', () => ({
  clearWorksheetLocalStatus: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/networkUtils', () => ({
  backendProbe: jest.fn(() => Promise.resolve({ok: true})),
}));

jest.mock('../../../../../src/utils/networkQuality', () => ({
  isStateEffectivelyOnline: jest.fn(() => true),
  NET_POLICIES: {balanced: {minWifiPercent: 25}},
}));

jest.mock('../../../../../src/utils/lookupCache', () => ({
  getCache: jest.fn(() => Promise.resolve(null)),
  isFresh: jest.fn(() => Promise.resolve(false)),
  setCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/attestationAvailabilityCache', () => ({
  getAttestationAvailabilityCache: jest.fn(() => Promise.resolve(null)),
  saveAttestationAvailabilityCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/Session', () => ({
  clearSession: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/notifications', () => ({
  alertNewBackendNotifications: jest.fn(() => Promise.resolve()),
  getLocalStoredNotifications: jest.fn(() => Promise.resolve([])),
  mergeAndDedupeNotifications: jest.fn(({localList = [], remoteList = []}) => [
    ...localList,
    ...remoteList,
  ]),
}));

jest.mock('../../../../../src/hooks/useBackupCheck', () => ({
  useBackupCheck: jest.fn(() => ({hasBackup: true})),
}));

jest.mock('react-native-paper', () => ({
  ActivityIndicator: 'ActivityIndicator',
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const MockExpoImage = props => React.createElement('Image', props, props.children);
  return {
    Image: MockExpoImage,
  };
});

jest.mock('wira-sdk', () => ({
  MigrationService: jest.fn().mockImplementation(() => ({
    checkMigration: jest.fn(() => Promise.resolve(false)),
    startMigration: jest.fn(() => Promise.resolve()),
  })),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({data: []});
    axios.post.mockResolvedValue({data: {}});
    useElectionRepository.mockReturnValue({
      getElections: jest.fn(() => Promise.resolve([])),
    });
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renderiza la pantalla principal', () => {
    const {getByTestId} = renderWithProviders(<HomeScreen navigation={buildNavigation()} />, {
      initialState: {
        auth: {isAuthenticated: false},
        wallet: {payload: {account: '0xabc', vc: {credentialSubject: {fullName: 'Ana'}}}},
      },
    });
    expect(getByTestId('homeContainer')).toBeTruthy();
  });

  it('renderiza header, token card y banner sin mostrar eleccion mockeada cuando no hay data real', async () => {
    const screen = renderWithProviders(<HomeScreen navigation={buildNavigation()} />, {
      initialState: {
        auth: {isAuthenticated: false},
        wallet: {payload: {account: '0xabc', vc: {credentialSubject: {fullName: 'Ana'}}}},
      },
    });

    expect(screen.getByTestId('homeMiVotoLogo')).toBeTruthy();
    expect(screen.getByText('Tu Voto Decide')).toBeTruthy();
    expect(screen.getByText('Control ciudadano del voto')).toBeTruthy();
    expect(screen.getByText('¡Bienvenido,')).toBeTruthy();
    expect(screen.getByText(/.+!/)).toBeTruthy();
    expect(screen.getByTestId('homeRewardsTokenCard')).toBeTruthy();
    expect(screen.getByLabelText('Ver mis recompensas')).toBeTruthy();
    expect(screen.getByTestId('homeRewardsTokenAmount')).toHaveTextContent('100');
    expect(screen.getByTestId('homeRewardsTokenCurrency')).toHaveTextContent('TVD');

    fireEvent.press(screen.getByTestId('homeRewardsTokenCard'));
    expect(mockNavigate).toHaveBeenCalledWith(StackNav.RewardsScreen);

    expect(screen.getByTestId('homeCarouselItem_1')).toBeTruthy();
    expect(screen.getByTestId('homeCarouselItem_2')).toBeTruthy();
    expect(screen.getByText('¿Necesita una app blockchain?')).toBeTruthy();
    expect(screen.getByText('Asoblockchain')).toBeTruthy();

    fireEvent.press(screen.getByTestId('homeCarouselButton_1'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://blockchainconsultora.com/es');
    fireEvent.press(screen.getByTestId('homeCarouselButton_2'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://asoblockchainbolivia.org/');

    await waitFor(() => {
      expect(screen.queryByTestId('voting-election-inline-loader')).toBeNull();
    });

    expect(screen.queryByText('Elecciones Universitarias')).toBeNull();
    expect(screen.queryByText('Carrera de Informática')).toBeNull();
    expect(screen.queryByText('2h 11m 33s')).toBeNull();
    expect(screen.queryByText('Votar ahora')).toBeNull();
    expect(screen.queryByTestId('myWitnessesButtonRegular')).toBeNull();
    expect(screen.queryByTestId('myWitnessesButton')).toBeNull();
  });

  it('renderiza ElectionCard cuando el flujo real entrega una eleccion visible', async () => {
    useElectionRepository.mockReturnValue({
      getElections: jest.fn(() =>
        Promise.resolve([
          {
            id: 'real-election-1',
            title: 'Elección real disponible',
            status: 'ACTIVA',
            instituteName: 'Proceso institucional real',
            organization: 'Universidad Real',
            closesInLabel: 'Cierra pronto',
            closesAt: null,
            startsAt: null,
            isEligible: true,
            canVote: true,
          },
        ]),
      ),
    });

    const screen = renderWithProviders(<HomeScreen navigation={buildNavigation()} />, {
      initialState: {
        auth: {isAuthenticated: false},
        wallet: {payload: {account: '0xabc', vc: {credentialSubject: {fullName: 'Ana'}}}},
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Elección real disponible')).toBeTruthy();
    });

    expect(screen.getByText('Proceso institucional real')).toBeTruthy();
    expect(screen.getByText('Votar ahora')).toBeTruthy();
    expect(screen.queryByText('Elecciones Universitarias')).toBeNull();
    expect(screen.queryByText('Carrera de Informática')).toBeNull();
    expect(screen.queryByText('2h 11m 33s')).toBeNull();
  });

  it('mantiene boton de notificaciones', async () => {
    const {getByTestId} = renderWithProviders(<HomeScreen navigation={buildNavigation()} />, {
      initialState: {
        auth: {isAuthenticated: false},
        wallet: {payload: {account: '0xabc', vc: {credentialSubject: {fullName: 'Ana'}}}},
      },
    });

    fireEvent.press(getByTestId('notificationsButton'));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(StackNav.Notification),
    );
  });

  it('abre el modal de logout y confirma cierre', async () => {
    const {getByTestId} = renderWithProviders(<HomeScreen navigation={buildNavigation()} />, {
      initialState: {
        auth: {isAuthenticated: true},
        wallet: {payload: {account: '0xabc', vc: {credentialSubject: {fullName: 'Ana'}}}},
      },
    });

    const modal = getByTestId('homeLogoutModal');
    expect(modal.props.visible).toBe(false);

    fireEvent.press(getByTestId('logoutButton'));
    await waitFor(() =>
      expect(getByTestId('homeLogoutModal').props.visible).toBe(true),
    );

    fireEvent.press(getByTestId('homeLogoutModalConfirmButton'));
    await waitFor(() => expect(clearSession).toHaveBeenCalled());
  });
});

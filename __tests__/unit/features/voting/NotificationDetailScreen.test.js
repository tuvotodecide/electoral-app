import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {Linking, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StackNav} from '../../../../src/navigation/NavigationKey';
import NotificationDetailScreen, {
  resolvePublicElectionUrl,
  resolveValidImageUrl,
} from '../../../../src/features/voting/screens/NotificationDetailScreen';

const mockUseRoute = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://backend.example',
  FRONTEND_RESULTS: 'https://frontend-results.example',
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  NavigationContainer: ({children}) => children,
  createNavigationContainerRef: () => ({
    current: null,
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
}));

jest.mock('../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children}) => <View>{children}</View>;
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({title}) => <Text>{title}</Text>;
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, ...props}) => <Text {...props}>{children}</Text>;
});

jest.mock('../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  return ({title, onPress, testID, disabled}) => (
    <TouchableOpacity testID={testID} onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({name}) => <Text>{name}</Text>;
});

describe('NotificationDetailScreen', () => {
  const walletState = {
    wallet: {
      payload: {
        dni: '12345678',
      },
    },
  };

  const renderScreen = notification => {
    mockUseRoute.mockReturnValue({
      params: {notification},
    });

    const {renderWithProviders} = require('../../../setup/test-utils');
    return renderWithProviders(<NotificationDetailScreen />, {
      initialState: walletState,
    });
  };

  const mockEligibilityResponse = status => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({status}),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    Linking.openURL = jest.fn(() => Promise.resolve());
  });

  it('marca localmente la notificacion como vista al abrir el detalle', async () => {
    renderScreen({
      title: 'Ya puedes votar',
      body: 'Tu habilitación ya está activa.',
      createdAt: '2026-01-10T10:00:00.000Z',
      kind: 'voting_event',
      data: {
        type: 'INSTITUTIONAL_VOTING_ENABLED',
      },
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications:last-seen:12345678',
        expect.any(String),
      );
    });
  });

  it('no muestra CTA inútil cuando la noticia no trae enlace', () => {
    const screen = renderScreen({
      title: 'Nueva noticia',
      body: 'Se publicó una novedad.',
      kind: 'news',
      direccion: 'Se publicó una novedad.',
      data: {
        type: 'INSTITUTIONAL_NEWS',
      },
    });

    expect(screen.queryByTestId('goToResultsButton')).toBeNull();
  });

  it('muestra la descripcion de noticia una sola vez y solo en la tarjeta de contenido', () => {
    const description = 'Se publicó una novedad importante para los votantes.';
    const screen = renderScreen({
      title: 'Nueva noticia',
      body: description,
      kind: 'news',
      direccion: description,
      data: {
        type: 'INSTITUTIONAL_NEWS',
      },
    });

    expect(screen.queryAllByText(description)).toHaveLength(1);
  });

  it('solo renderiza la imagen de noticia cuando la URL parece una imagen valida', () => {
    const invalidScreen = renderScreen({
      title: 'Nueva noticia',
      body: 'Texto',
      kind: 'news',
      direccion: 'Texto',
      imageUrl: 'javascript:alert(1)',
      data: {
        type: 'INSTITUTIONAL_NEWS',
      },
    });

    expect(invalidScreen.queryByTestId('notificationDetailNewsImage')).toBeNull();

    const validScreen = renderScreen({
      title: 'Nueva noticia',
      body: 'Texto',
      kind: 'news',
      direccion: 'Texto',
      imageUrl: 'https://cdn.example.com/noticia.webp?token=1',
      data: {
        type: 'INSTITUTIONAL_NEWS',
      },
    });

    expect(validScreen.getByTestId('notificationDetailNewsImage')).toBeTruthy();
  });

  it('muestra fechas solo cuando existen datos reales', () => {
    const withoutDates = renderScreen({
      title: 'Cronograma actualizado',
      body: 'Revisa el nuevo cronograma.',
      kind: 'voting_event',
      direccion: 'Revisa el nuevo cronograma.',
      data: {
        type: 'INSTITUTIONAL_SCHEDULE_UPDATED',
      },
    });

    expect(withoutDates.queryByText('Fechas de la votación')).toBeNull();

    const withDates = renderScreen({
      title: 'Cronograma actualizado',
      body: 'Revisa el nuevo cronograma.',
      kind: 'voting_event',
      direccion: 'Revisa el nuevo cronograma.',
      data: {
        type: 'INSTITUTIONAL_SCHEDULE_UPDATED',
        votingStart: '2026-04-18T08:00:00.000Z',
      },
    });

    expect(withDates.getByText('Fechas de la votación')).toBeTruthy();
    expect(withDates.getByText('Inicio')).toBeTruthy();
    expect(withDates.queryByText('Cierre')).toBeNull();
    expect(withDates.queryByText('Resultados')).toBeNull();
  });

  it('muestra todas las fechas de publicacion oficial cuando el payload las trae', () => {
    const screen = renderScreen({
      title: 'Publicación oficial',
      body: 'La votación fue publicada oficialmente.',
      kind: 'voting_event',
      direccion: 'La votación fue publicada oficialmente.',
      data: {
        type: 'INSTITUTIONAL_OFFICIAL_PUBLICATION_CONFIRMED',
        votingStart: '2026-04-18T08:00:00.000Z',
        votingEnd: '2026-04-18T18:00:00.000Z',
        resultsPublishAt: '2026-04-18T19:00:00.000Z',
      },
    });

    expect(screen.getByText('Fechas de la votación')).toBeTruthy();
    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.getByText('Cierre')).toBeTruthy();
    expect(screen.getByText('Resultados')).toBeTruthy();
  });

  it('no repite el mismo texto en el bloque verde y en la tarjeta blanca para eventos institucionales', () => {
    const description = 'La votación fue publicada oficialmente.';
    const screen = renderScreen({
      title: 'Publicación oficial',
      body: description,
      kind: 'voting_event',
      direccion: description,
      data: {
        type: 'INSTITUTIONAL_OFFICIAL_PUBLICATION_CONFIRMED',
      },
    });

    expect(screen.queryAllByText(description)).toHaveLength(1);
  });

  it('usa CTA Ver votación para publicación oficial aunque sea referendum', () => {
    const screen = renderScreen({
      title: 'Referéndum institucional',
      body: 'Consulta tu habilitación.',
      kind: 'voting_event',
      direccion: 'Consulta tu habilitación.',
      data: {
        type: 'INSTITUTIONAL_OFFICIAL_PUBLICATION_CONFIRMED',
        isReferendum: true,
        publicUrl: 'https://frontend-results.example/elections/ref-1/public',
      },
    });

    expect(screen.getByText('Referéndum')).toBeTruthy();
    expect(screen.getByText('Ver votación')).toBeTruthy();
    expect(screen.queryByText('Ver elección pública')).toBeNull();
  });

  it('muestra badge Habilitado para convocatoria cuando eligibility responde ELIGIBLE', async () => {
    mockEligibilityResponse('ELIGIBLE');

    const screen = renderScreen({
      title: 'Revisión de padrón',
      body: 'Consulta tu habilitación.',
      kind: 'voting_event',
      direccion: 'Consulta tu habilitación.',
      data: {
        type: 'INSTITUTIONAL_PADRON_REVIEW_OPEN',
        eventId: 'event-1',
        publicPath: '/votacion/elecciones/event-1/publica',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Habilitado')).toBeTruthy();
    });

    const renderedTexts = screen.UNSAFE_root.findAllByType(Text)
      .map(node => node.props.children)
      .filter(value => typeof value === 'string');
    expect(renderedTexts.indexOf('Revisión de padrón')).toBeLessThan(
      renderedTexts.indexOf('Habilitado'),
    );
    expect(renderedTexts.indexOf('Habilitado')).toBeLessThan(
      renderedTexts.indexOf('Votación'),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend.example/api/v1/voting/events/event-1/eligibility/public?carnet=12345678',
      {
        method: 'GET',
        headers: {Accept: 'application/json'},
      },
    );
  });

  it('muestra No habilitado cuando eligibility responde DISABLED', async () => {
    mockEligibilityResponse('DISABLED');

    const screen = renderScreen({
      title: 'Revisión de padrón',
      body: 'Consulta tu habilitación.',
      kind: 'voting_event',
      direccion: 'Consulta tu habilitación.',
      data: {
        type: 'INSTITUTIONAL_PADRON_REVIEW_OPEN',
        eventId: 'event-2',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-2/publica',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('No habilitado')).toBeTruthy();
    });
  });

  it('carga fechas de votación para los 3 tipos si el payload no las trae', async () => {
    global.fetch = jest.fn(url => {
      if (String(url).includes('/eligibility/public')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({status: 'ELIGIBLE'}),
        });
      }

      return Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          votingStart: '2026-04-18T08:00:00.000Z',
          votingEnd: '2026-04-18T18:00:00.000Z',
          resultsPublishAt: '2026-04-18T19:00:00.000Z',
        }),
      });
    });

    const screen = renderScreen({
      title: 'Revisión de padrón',
      body: 'Consulta tu habilitación.',
      kind: 'voting_event',
      direccion: 'Consulta tu habilitación.',
      data: {
        type: 'INSTITUTIONAL_PADRON_REVIEW_OPEN',
        eventId: 'event-dates',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-dates/publica',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Fechas de la votación')).toBeTruthy();
    });
    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.getByText('Cierre')).toBeTruthy();
    expect(screen.getByText('Resultados')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend.example/api/v1/voting/events/public/detail/event-dates',
      {
        method: 'GET',
        headers: {Accept: 'application/json'},
      },
    );
  });

  it('muestra badge y botón WebView para publicación oficial y habilitación manual', async () => {
    mockEligibilityResponse('ELIGIBLE');

    const officialScreen = renderScreen({
      title: 'Publicación oficial',
      body: 'La votación fue publicada oficialmente.',
      kind: 'voting_event',
      direccion: 'La votación fue publicada oficialmente.',
      data: {
        type: 'INSTITUTIONAL_OFFICIAL_PUBLICATION_CONFIRMED',
        eventId: 'event-3',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-3/publica',
      },
    });

    await waitFor(() => {
      expect(officialScreen.getByText('Habilitado')).toBeTruthy();
    });
    expect(officialScreen.getByText('Ver votación')).toBeTruthy();
    expect(officialScreen.queryByText('Ver elección pública')).toBeNull();

    mockEligibilityResponse('ELIGIBLE');
    const enabledScreen = renderScreen({
      title: 'Ya puedes votar',
      body: 'Tu habilitación ya está activa.',
      kind: 'voting_event',
      direccion: 'Tu habilitación ya está activa.',
      data: {
        type: 'INSTITUTIONAL_VOTING_ENABLED',
        eventId: 'event-4',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-4/publica',
      },
    });

    await waitFor(() => {
      expect(enabledScreen.getByText('Habilitado')).toBeTruthy();
    });
    expect(enabledScreen.getByText('Ver votación')).toBeTruthy();
    expect(enabledScreen.queryByText('Ver elección pública')).toBeNull();
  });

  it('si eligibility falla no rompe la pantalla ni muestra badge tecnico', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));

    const screen = renderScreen({
      title: 'Revisión de padrón',
      body: 'Consulta tu habilitación.',
      kind: 'voting_event',
      direccion: 'Consulta tu habilitación.',
      data: {
        type: 'INSTITUTIONAL_PADRON_REVIEW_OPEN',
        eventId: 'event-5',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-5/publica',
      },
    });

    expect(screen.getByText('Consulta tu habilitación.')).toBeTruthy();

    await waitFor(() => {
      expect(screen.queryByTestId('eligibilityBadge')).toBeNull();
    });
    expect(screen.queryByText('eligibility failed')).toBeNull();
  });

  it('no muestra badge para resultados disponibles ni noticia institucional', () => {
    const resultsScreen = renderScreen({
      title: 'Resultados disponibles',
      body: 'Consulta los resultados.',
      kind: 'election_results',
      direccion: 'Consulta los resultados.',
      data: {
        type: 'INSTITUTIONAL_RESULTS_AVAILABLE',
      },
      resultsSummary: [
        {id: '1', name: 'Opción A', party: 'A', votes: 10, percent: 100},
      ],
    });

    expect(resultsScreen.queryByTestId('eligibilityBadge')).toBeNull();

    const newsScreen = renderScreen({
      title: 'Nueva noticia',
      body: 'Se publicó una novedad.',
      kind: 'news',
      direccion: 'Se publicó una novedad.',
      data: {
        type: 'INSTITUTIONAL_NEWS',
        eventId: 'event-news',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-news/publica',
      },
    });

    expect(newsScreen.queryByTestId('eligibilityBadge')).toBeNull();
  });

  it('oculta el botón Ver votación si no hay URL pública válida', () => {
    const screen = renderScreen({
      title: 'Revisión de padrón',
      body: 'Consulta tu habilitación.',
      kind: 'voting_event',
      direccion: 'Consulta tu habilitación.',
      data: {
        type: 'INSTITUTIONAL_PADRON_REVIEW_OPEN',
        publicUrl: 'https://frontend-results.example/noticias/externa',
      },
    });

    expect(screen.queryByText('Ver votación')).toBeNull();
    expect(screen.queryByTestId('goToResultsButton')).toBeNull();
  });

  it('el botón Ver votación navega a WebView interno y no abre navegador externo', async () => {
    mockEligibilityResponse('ELIGIBLE');

    const screen = renderScreen({
      title: 'Revisión de padrón',
      body: 'Consulta tu habilitación.',
      kind: 'voting_event',
      direccion: 'Consulta tu habilitación.',
      data: {
        type: 'INSTITUTIONAL_PADRON_REVIEW_OPEN',
        eventId: 'event-6',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-6/publica',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Ver votación')).toBeTruthy();
    });
    expect(screen.queryByText('Ver elección pública')).toBeNull();

    fireEvent.press(screen.getByTestId('goToResultsButton'));

    expect(mockNavigate).toHaveBeenCalledWith(StackNav.PublicElectionWebViewScreen, {
      url: 'https://frontend-results.example/votacion/elecciones/event-6/publica',
      title: 'Elección',
    });
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('el botón Ver detalles de resultados navega a WebView interno y no abre navegador externo', () => {
    const screen = renderScreen({
      title: 'Resultados disponibles',
      body: 'Consulta los resultados.',
      kind: 'election_results',
      direccion: 'Consulta los resultados.',
      data: {
        type: 'INSTITUTIONAL_RESULTS_AVAILABLE',
        eventId: 'event-results',
        publicUrl: 'https://frontend-results.example/votacion/elecciones/event-results/publica',
      },
      resultsSummary: [
        {id: '1', name: 'Opción A', party: 'A', votes: 10, percent: 100},
      ],
    });

    expect(screen.getByText('Ver detalles')).toBeTruthy();

    fireEvent.press(screen.getByTestId('goToResultsButton'));

    expect(mockNavigate).toHaveBeenCalledWith(StackNav.PublicElectionWebViewScreen, {
      url: 'https://frontend-results.example/votacion/elecciones/event-results/publica',
      title: 'Resultados',
    });
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('valida y resuelve URLs públicas de elección en el orden esperado', () => {
    expect(resolvePublicElectionUrl({
      data: {
        publicUrl: 'https://frontend-results.example/votacion/elecciones/public-url/publica',
        actionUrl: 'https://frontend-results.example/votacion/elecciones/action-url/publica',
      },
    })).toBe('https://frontend-results.example/votacion/elecciones/public-url/publica');

    expect(resolvePublicElectionUrl({
      data: {
        actionUrl: 'https://frontend-results.example/votacion/elecciones/action-url/publica',
      },
    })).toBe('https://frontend-results.example/votacion/elecciones/action-url/publica');

    expect(resolvePublicElectionUrl({
      data: {
        link: 'https://frontend-results.example/votacion/elecciones/link-url/publica',
      },
    })).toBe('https://frontend-results.example/votacion/elecciones/link-url/publica');

    expect(resolvePublicElectionUrl({
      data: {
        publicPath: '/votacion/elecciones/path-url/publica',
      },
    })).toBe('https://frontend-results.example/votacion/elecciones/path-url/publica');

    expect(resolvePublicElectionUrl({
      data: {
        eventId: 'fallback-url',
      },
    })).toBe('https://frontend-results.example/votacion/elecciones/fallback-url/publica');
  });

  it('rechaza URLs no http/https o externas que no apuntan a elección pública', () => {
    expect(resolvePublicElectionUrl({
      data: {
        publicUrl: 'ftp://frontend-results.example/votacion/elecciones/event-1/publica',
      },
    })).toBeNull();

    expect(resolvePublicElectionUrl({
      data: {
        publicUrl: 'https://frontend-results.example/noticias/externa',
      },
    })).toBeNull();

    expect(resolvePublicElectionUrl({
      data: {
        link: 'https://external.example/article',
      },
    })).toBeNull();
  });

  it('valida imagenes de noticia con protocolo seguro y extension conocida', () => {
    expect(resolveValidImageUrl('https://cdn.example.com/news-image.png')).toBe(
      'https://cdn.example.com/news-image.png',
    );
    expect(resolveValidImageUrl('http://cdn.example.com/news-image.jpeg?token=1')).toBe(
      'http://cdn.example.com/news-image.jpeg?token=1',
    );
    expect(resolveValidImageUrl('ftp://cdn.example.com/news-image.png')).toBeNull();
    expect(resolveValidImageUrl('https://cdn.example.com/page.html')).toBeNull();
  });
});

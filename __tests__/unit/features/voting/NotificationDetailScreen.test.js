import React from 'react';
import {waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationDetailScreen, {
  resolveValidImageUrl,
} from '../../../../src/features/voting/screens/NotificationDetailScreen';

const mockUseRoute = jest.fn();

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://backend.example',
  FRONTEND_RESULTS: 'https://frontend-results.example',
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
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

  it('usa CTA y copy coherentes para un referendum', () => {
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
    expect(screen.getByText('Ver referéndum')).toBeTruthy();
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

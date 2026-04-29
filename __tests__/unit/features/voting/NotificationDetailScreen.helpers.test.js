import {
  resolveNotificationActionLabel,
  resolvePublicResultsUrl,
} from '../../../../src/features/voting/screens/NotificationDetailScreen';

describe('NotificationDetailScreen helpers', () => {
  it('prioriza publicUrl absoluto enviado por backend para notificaciones institucionales', () => {
    expect(
      resolvePublicResultsUrl({
        data: {
          publicUrl: 'https://resultados.example/elections/event-1/public',
          publicPath: '/elections/event-1/public',
          deepLink: 'myapp://event/event-1',
        },
      }),
    ).toBe('https://resultados.example/elections/event-1/public');
  });

  it('construye URL web con FRONTEND_RESULTS cuando backend solo manda publicPath o link relativo', () => {
    expect(
      resolvePublicResultsUrl({
        data: {
          publicPath: '/elections/event-2/public',
          link: '/elections/event-ignored/public',
          deepLink: 'myapp://event/event-2',
        },
      }),
    ).toBe('https://frontend-results.example/elections/event-2/public');

    expect(
      resolvePublicResultsUrl({
        data: {
          link: '/elections/event-3/public',
          deepLink: 'myapp://event/event-3',
        },
      }),
    ).toBe('https://frontend-results.example/elections/event-3/public');
  });

  it('usa link absoluto de noticias y deja deepLink como ultimo fallback', () => {
    expect(
      resolvePublicResultsUrl({
        data: {
          type: 'INSTITUTIONAL_NEWS',
          link: 'https://news.example/noticia-1',
        },
      }),
    ).toBe('https://news.example/noticia-1');

    expect(
      resolvePublicResultsUrl({
        data: {
          deepLink: 'myapp://event/event-4',
        },
      }),
    ).toBe('myapp://event/event-4');
  });

  it('resuelve CTA de habilitacion como Ver padron y no como Votar', () => {
    expect(
      resolveNotificationActionLabel({
        notification: {},
        kind: 'voting_event',
        isNews: false,
        type: 'INSTITUTIONAL_VOTING_ENABLED',
      }),
    ).toBe('Ver padrón');

    expect(
      resolveNotificationActionLabel({
        notification: {},
        kind: 'news',
        isNews: true,
        type: 'INSTITUTIONAL_NEWS',
      }),
    ).toBe('Abrir enlace');
  });

  it('ajusta el CTA explicito viejo cuando la notificacion corresponde a un referendum', () => {
    expect(
      resolveNotificationActionLabel({
        notification: {
          actionLabel: 'Ver elección',
        },
        kind: 'voting_event',
        isNews: false,
        isReferendum: true,
        type: 'INSTITUTIONAL_VOTING_ENABLED',
      }),
    ).toBe('Ver referéndum');
  });
});

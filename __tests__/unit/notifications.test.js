import {
  alertNewBackendNotifications,
  buildInstitutionalNotificationCopy,
  buildInstitutionalNotificationForDetail,
  buildNotificationSemanticKey,
  buildNotificationTextFallback,
  buildRouteFromNotification,
  consumePendingNotificationNavigation,
  handleNotificationPress,
  markNotificationAsAlerted,
  mergeAndDedupeNotifications,
  maybeStorePendingNavFromRemote,
  showActaPublishedNotification,
  showLocalNotification,
} from '../../src/notifications';

const mockStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(mockStorage.has(key) ? mockStorage.get(key) : null)),
  setItem: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn(key => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

jest.mock('@notifee/react-native', () => {
  const localMock = {
    createChannel: jest.fn(() => Promise.resolve('channel')),
    displayNotification: jest.fn(() => Promise.resolve()),
    requestPermission: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(),
    onBackgroundEvent: jest.fn(),
  };
  return {
    __esModule: true,
    default: localMock,
    AndroidImportance: {HIGH: 4},
    EventType: {PRESS: 'PRESS'},
  };
});

jest.mock('../../src/redux/store', () => {
  const state = {
    auth: {
      isAuthenticated: false,
      pendingNotificationNavigation: null,
    },
  };
  const dispatch = jest.fn();
  return {
    __esModule: true,
    default: {
      getState: () => state,
      dispatch,
    },
    __setAuthState: next => {
      state.auth = next;
    },
    __getDispatch: () => dispatch,
  };
});

jest.mock('../../src/redux/slices/authSlice', () => ({
  setPendingNav: payload => ({type: 'setPendingNav', payload}),
  setPendingNotificationNavigation: payload => ({
    type: 'setPendingNotificationNavigation',
    payload,
  }),
  clearPendingNotificationNavigation: () => ({
    type: 'clearPendingNotificationNavigation',
  }),
}));

jest.mock('../../src/navigation/RootNavigation', () => {
  const navigate = jest.fn();
  return {
    navigate,
    safeNavigate: jest.fn((name, params) => {
      navigate(name, params);
      return true;
    }),
  };
});

jest.mock('../../src/utils/Session', () => ({
  isSessionValid: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../src/navigation/NavigationKey', () => ({
  StackNav: {
    Splash: 'Splash',
    TabNavigation: 'TabNavigation',
    SuccessScreen: 'SuccessScreen',
    ClaimCredScreen: 'ClaimCredScreen',
    VotingNotificationDetailScreen: 'VotingNotificationDetailScreen',
  },
  TabNav: {HomeScreen: 'HomeScreen'},
}));

const notifee = require('@notifee/react-native').default;
const storeModule = require('../../src/redux/store');
const rootNav = require('../../src/navigation/RootNavigation');
const session = require('../../src/utils/Session');

describe('notifications', () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
    storeModule.__setAuthState({
      isAuthenticated: false,
      pendingNotificationNavigation: null,
    });
    session.isSessionValid.mockResolvedValue(true);
  });

  it('deduplica notificaciones semanticas y prioriza la remota frente a la local', () => {
    const local = {
      _id: 'local_1',
      source: 'local',
      createdAt: '2026-01-01T10:00:00.000Z',
      data: {
        type: 'participation_certificate',
        electionId: 'election-1',
        imageUrl: 'https://nft.example/1',
      },
    };
    const remote = {
      _id: 'remote-1',
      createdAt: '2026-01-01T10:01:00.000Z',
      data: {
        type: 'participation_certificate',
        electionId: 'election-1',
        imageUrl: 'https://nft.example/1',
      },
    };

    const out = mergeAndDedupeNotifications({
      localList: [local],
      remoteList: [remote],
    });

    expect(out).toHaveLength(1);
    expect(out[0]).toBe(remote);
  });

  it('genera key semantica estable para attestation usando fingerprint util', () => {
    const key = buildNotificationSemanticKey({
      data: {
        type: 'acta_published',
        electionId: 'election-1',
        imageUrl: 'https://image.example/cert.png',
      },
    });

    expect(key).toBe('attestation:election-1:https://image.example/cert.png');
  });

  it('construye textos fallback distintos para publicar votacion, acta y certificado', () => {
    expect(
      buildNotificationTextFallback({
        data: {type: 'participation_certificate', tableNumber: '15'},
      }),
    ).toMatchObject({
      title: 'Atestiguamiento exitoso',
      body: 'Tu atestiguamiento de la mesa 15 se registró correctamente.',
    });

    expect(
      buildNotificationTextFallback({
        data: {type: 'acta_published', tableCode: 'A-22'},
      }),
    ).toMatchObject({
      title: 'Hoja de trabajo subida exitosamente',
      body: 'Tu hoja de trabajo de la mesa A-22 fue publicada correctamente.',
    });
  });

  it('normaliza copy institucional util para revision de padron y publicacion oficial', () => {
    expect(
      buildNotificationTextFallback({
        data: {
          type: 'INSTITUTIONAL_PADRON_REVIEW_OPEN',
          eventName: 'Referéndum UMSA',
        },
      }),
    ).toMatchObject({
      title: 'Revisa tu padrón',
      body: expect.stringContaining('te invita a revisar Referéndum UMSA'),
    });

    expect(
      buildNotificationTextFallback({
        data: {
          type: 'INSTITUTIONAL_OFFICIAL_PUBLICATION_CONFIRMED',
        },
      }),
    ).toMatchObject({
      title: 'La votación fue publicada oficialmente',
      body: expect.stringContaining('Verifica si te encuentras habilitado'),
    });
  });

  it('normaliza copy y detalle institucional para votacion eliminada', () => {
    const notification = {
      data: {
        type: 'INSTITUTIONAL_VOTING_CANCELLED',
        eventId: 'event-cancelled',
        eventName: 'Elección cancelada',
        state: 'CANCELLED',
        status: 'cancelled',
        severity: 'error',
      },
    };

    expect(buildInstitutionalNotificationCopy(notification)).toEqual({
      title: 'Votación eliminada',
      body: 'Elección cancelada fue eliminada por el administrador.',
    });
    expect(buildNotificationTextFallback(notification)).toMatchObject({
      title: 'Votación eliminada',
      body: 'Elección cancelada fue eliminada por el administrador.',
    });
    expect(buildInstitutionalNotificationForDetail(notification)).toMatchObject({
      kind: 'voting_event',
      tipo: 'Eliminada',
      direccion: 'Elección cancelada fue eliminada por el administrador.',
      statusTone: 'danger',
      actionUrl: null,
      actionLabel: undefined,
      data: expect.objectContaining({
        type: 'INSTITUTIONAL_VOTING_CANCELLED',
        eventId: 'event-cancelled',
      }),
    });
  });

  it('normaliza copy institucional para recordatorios de inicio y cierre de votacion', () => {
    expect(
      buildNotificationTextFallback({
        body: 'Elección recordatorio comienza a las 10:00.',
        data: {
          type: 'INSTITUTIONAL_VOTING_STARTS_IN_1H',
          eventName: 'Elección recordatorio',
          votingStart: '2026-07-10T14:00:00.000Z',
        },
      }),
    ).toMatchObject({
      title: 'La votación inicia en 1 hora',
      body: 'Elección recordatorio comienza a las 10:00.',
    });

    const closingReminder = {
      body: 'Elección activa cierra a las 14:00.',
      data: {
        type: 'INSTITUTIONAL_VOTING_ENDS_IN_15M',
        eventId: 'event-reminder',
        eventName: 'Elección activa',
        votingEnd: '2026-07-10T18:00:00.000Z',
        publicUrl: 'https://results.example/votacion/elecciones/event-reminder/publica',
      },
    };

    expect(buildNotificationTextFallback(closingReminder)).toMatchObject({
      title: 'La votación termina en 15 minutos',
      body: 'Elección activa cierra a las 14:00.',
    });
    expect(buildInstitutionalNotificationForDetail(closingReminder)).toMatchObject({
      kind: 'voting_event',
      tipo: 'Ver votación',
      statusTone: 'success',
      actionLabel: 'Ver votación',
      actionUrl: 'https://results.example/votacion/elecciones/event-reminder/publica',
      reminderDetailBody: expect.stringMatching(/^Cierra a las \d{2}:\d{2}\.$/),
      data: expect.objectContaining({
        type: 'INSTITUTIONAL_VOTING_ENDS_IN_15M',
        eventId: 'event-reminder',
      }),
    });
  });

  it.each([
    ['INSTITUTIONAL_VOTING_STARTS_IN_1H', 'La votación inicia en 1 hora', 'START', '60'],
    ['INSTITUTIONAL_VOTING_STARTS_IN_15M', 'La votación inicia en 15 minutos', 'START', '15'],
    ['INSTITUTIONAL_VOTING_ENDS_IN_1H', 'La votación termina en 1 hora', 'END', '60'],
    ['INSTITUTIONAL_VOTING_ENDS_IN_15M', 'La votación termina en 15 minutos', 'END', '15'],
  ])('prepara CTA Ver votación para %s', (type, title, phase, offsetMinutes) => {
    const notification = buildInstitutionalNotificationForDetail({
      data: {
        type,
        eventId: 'event-reminder',
        eventName: 'Elección recordatorio',
        phase,
        offsetMinutes,
        votingStart: '2026-07-10T14:00:00.000Z',
        votingEnd: '2026-07-10T18:00:00.000Z',
        scheduledFor: phase === 'START'
          ? '2026-07-10T14:00:00.000Z'
          : '2026-07-10T18:00:00.000Z',
        publicUrl: 'https://results.example/votacion/elecciones/event-reminder/publica',
      },
    });

    expect(notification).toMatchObject({
      kind: 'voting_event',
      tipo: 'Ver votación',
      title,
      actionLabel: 'Ver votación',
      actionUrl: 'https://results.example/votacion/elecciones/event-reminder/publica',
    });
    expect(notification.reminderDetailBody).toMatch(
      phase === 'START' ? /^Comienza a las \d{2}:\d{2}\.$/ : /^Cierra a las \d{2}:\d{2}\.$/,
    );
  });

  it('alerta solo una vez por notificacion backend deduplicada y persiste la marca', async () => {
    const notification = {
      _id: 'remote-1',
      createdAt: '2026-01-01T10:00:00.000Z',
      title: 'Hoja de trabajo subida exitosamente',
      data: {type: 'acta_published', tableNumber: '8'},
    };

    await alertNewBackendNotifications({
      dni: '123',
      notifications: [notification],
    });
    await alertNewBackendNotifications({
      dni: '123',
      notifications: [notification],
    });

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
    expect(mockStorage.get('@backend-notifications:alerted:v1:123')).toContain(
      'id:remote-1',
    );
  });

  it('permite marcar una notificacion como ya alertada para evitar duplicados entre foreground y fetch backend', async () => {
    const notification = {
      title: 'Horario actualizado',
      body: 'Se actualizó el horario de Referéndum UMSA',
      data: {
        type: 'INSTITUTIONAL_SCHEDULE_UPDATED',
        eventId: 'event-1',
        eventName: 'Referéndum UMSA',
      },
    };

    await markNotificationAsAlerted({
      dni: '123',
      notification,
    });

    await alertNewBackendNotifications({
      dni: '123',
      notifications: [
        {
          _id: 'remote-schedule-1',
          createdAt: '2026-01-01T10:00:00.000Z',
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
      ],
    });

    expect(notifee.displayNotification).not.toHaveBeenCalled();
    expect(mockStorage.get('@backend-notifications:alerted:v1:123')).toContain(
      'sem:text:institutional_schedule_updated:::horario actualizado:se actualizó el horario de referéndum umsa',
    );
  });

  it('persiste una notificacion local de acta publicada con routeParams serializados', async () => {
    await showActaPublishedNotification({
      ipfsData: {jsonUrl: 'https://ipfs.example/doc.json'},
      nftData: {nftUrl: 'https://nft.example/1'},
      tableData: {codigo: 'A-15', tableNumber: '15'},
      certificateData: {imageUrl: 'https://cdn.example/cert.png'},
      dni: '12345678',
      electionId: 'election-1',
    });

    expect(notifee.displayNotification).toHaveBeenCalled();
    const stored = JSON.parse(mockStorage.get('@local-notifications:v1'));
    expect(stored[0]).toMatchObject({
      source: 'local',
      dni: '12345678',
      data: expect.objectContaining({
        type: 'acta_published',
        screen: 'SuccessScreen',
        tableCode: 'A-15',
        tableNumber: '15',
        electionId: 'election-1',
      }),
    });
    expect(() => JSON.parse(stored[0].data.routeParams)).not.toThrow();
  });

  it('showLocalNotification usa notifee y permite persistencia opcional', async () => {
    await showLocalNotification({
      title: 'Nueva votación',
      body: 'Abierta',
      data: {type: 'INSTITUTIONAL_EVENT_PUBLISHED'},
      persistLocal: true,
      dni: '999',
    });

    expect(notifee.displayNotification).toHaveBeenCalled();
    const stored = JSON.parse(mockStorage.get('@local-notifications:v1'));
    expect(stored[0]).toMatchObject({
      title: 'Nueva votación',
      body: 'Abierta',
      dni: '999',
    });
  });

  it('resuelve rutas especiales para worksheet_uploaded y announce_count', () => {
    expect(buildRouteFromNotification({data: {type: 'worksheet_uploaded'}})).toEqual({
      name: 'TabNavigation',
      params: {screen: 'HomeScreen'},
    });

    expect(buildRouteFromNotification({data: {type: 'announce_count'}})).toEqual({
      name: 'TabNavigation',
      params: {screen: 'HomeScreen'},
    });
  });

  it('abre el detalle institucional desde push para tipos de votacion sin caer a Splash', () => {
    const institutionalTypes = [
      'INSTITUTIONAL_PADRON_REVIEW_OPEN',
      'INSTITUTIONAL_OFFICIAL_PUBLICATION_CONFIRMED',
      'INSTITUTIONAL_RESULTS_AVAILABLE',
      'INSTITUTIONAL_SCHEDULE_UPDATED',
      'INSTITUTIONAL_VOTING_CANCELLED',
    ];

    institutionalTypes.forEach(type => {
      const route = buildRouteFromNotification({
        title: 'Titulo institucional',
        body: 'Resumen institucional',
        data: {
          type,
          eventId: 'event-1',
          publicUrl: 'https://resultados.example/elections/event-1/public',
        },
      });

      expect(route.name).toBe('VotingNotificationDetailScreen');
      expect(route.params.notification).toMatchObject({
        data: expect.objectContaining({type}),
        mesa: expect.any(String),
        direccion: expect.any(String),
      });
    });
  });

  it('mantiene habilitacion para votar como detalle informativo con CTA Ver padron desde push', () => {
    const route = buildRouteFromNotification({
      title: 'Ya puedes votar',
      body: 'Tu habilitación ya está activa',
      data: {
        type: 'INSTITUTIONAL_VOTING_ENABLED',
        publicUrl: 'https://resultados.example/elections/event-1/public',
      },
    });

    expect(route).toMatchObject({
      name: 'VotingNotificationDetailScreen',
      params: {
        notification: {
          kind: 'voting_event',
          tipo: 'Abrir votación',
          actionLabel: 'Ver padrón',
          actionUrl: 'https://resultados.example/elections/event-1/public',
        },
      },
    });
  });

  it('navega directamente cuando el usuario esta autenticado y la sesion local esta vigente', async () => {
    storeModule.__setAuthState({isAuthenticated: true});

    await handleNotificationPress({
      data: {
        screen: 'ClaimCredScreen',
        routeParams: JSON.stringify({notificationId: 'abc'}),
      },
    });

    expect(session.isSessionValid).toHaveBeenCalled();
    expect(rootNav.navigate).toHaveBeenCalledWith('ClaimCredScreen', {
      notificationId: 'abc',
    });
  });

  it('guarda navegacion pendiente y manda al login cuando no hay auth', async () => {
    storeModule.__setAuthState({isAuthenticated: false});

    await handleNotificationPress({
      data: {
        screen: 'SuccessScreen',
        routeParams: '{bad-json',
      },
    });

    expect(storeModule.__getDispatch()).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setPendingNotificationNavigation',
        payload: expect.objectContaining({
          type: 'notification',
          targetRoute: 'SuccessScreen',
        }),
      }),
    );
    expect(rootNav.navigate).toHaveBeenCalledWith('LoginUser');
  });

  it('con auth persistida pero sesion expirada guarda pending y no navega al destino', async () => {
    storeModule.__setAuthState({isAuthenticated: true});
    session.isSessionValid.mockResolvedValue(false);

    await handleNotificationPress({
      data: {
        screen: 'ClaimCredScreen',
        routeParams: JSON.stringify({notificationId: 'expired-session'}),
      },
    });

    expect(rootNav.navigate).not.toHaveBeenCalledWith('ClaimCredScreen', {
      notificationId: 'expired-session',
    });
    expect(storeModule.__getDispatch()).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setPendingNotificationNavigation',
        payload: expect.objectContaining({
          targetRoute: 'ClaimCredScreen',
          params: {notificationId: 'expired-session'},
        }),
      }),
    );
    expect(rootNav.navigate).toHaveBeenCalledWith('LoginUser');
  });

  it('consume pending de notificacion cuando la sesion ya es valida', async () => {
    const pendingIntent = {
      type: 'notification',
      targetRoute: 'ClaimCredScreen',
      params: {notificationId: 'after-pin'},
      createdAt: Date.now(),
      dedupeKey: 'notification:test:ClaimCredScreen:after-pin',
    };
    storeModule.__setAuthState({
      isAuthenticated: true,
      pendingNotificationNavigation: pendingIntent,
    });
    session.isSessionValid.mockResolvedValue(true);

    await consumePendingNotificationNavigation();

    expect(rootNav.navigate).toHaveBeenCalledWith('ClaimCredScreen', {
      notificationId: 'after-pin',
    });
    expect(storeModule.__getDispatch()).toHaveBeenCalledWith({
      type: 'clearPendingNotificationNavigation',
    });
  });

  it('conserva pending de notificacion si el navigator aun no esta listo', async () => {
    const pendingIntent = {
      type: 'notification',
      targetRoute: 'VotingNotificationDetailScreen',
      params: {notification: {title: 'Convocatoria'}},
      createdAt: Date.now(),
      dedupeKey: 'notification:test:VotingNotificationDetailScreen:not-ready',
    };
    storeModule.__setAuthState({
      isAuthenticated: true,
      pendingNotificationNavigation: pendingIntent,
    });
    session.isSessionValid.mockResolvedValue(true);
    rootNav.safeNavigate.mockReturnValueOnce(false);

    const consumed = await consumePendingNotificationNavigation();

    expect(consumed).toBe(false);
    expect(rootNav.safeNavigate).toHaveBeenCalledWith(
      'VotingNotificationDetailScreen',
      {notification: {title: 'Convocatoria'}},
    );
    expect(storeModule.__getDispatch()).not.toHaveBeenCalledWith({
      type: 'clearPendingNotificationNavigation',
    });
  });

  it('no procesa dos veces la misma notificacion en ventana corta', async () => {
    storeModule.__setAuthState({isAuthenticated: true});
    const notification = {
      data: {
        id: 'dedupe-1',
        screen: 'ClaimCredScreen',
        routeParams: JSON.stringify({notificationId: 'dedupe-1'}),
      },
    };

    await handleNotificationPress(notification);
    await handleNotificationPress(notification);

    expect(rootNav.navigate).toHaveBeenCalledTimes(1);
  });

  it('no guarda navegacion pendiente si el payload remoto no trae screen valido', () => {
    maybeStorePendingNavFromRemote({data: {}});
    expect(storeModule.__getDispatch()).not.toHaveBeenCalled();
  });
});

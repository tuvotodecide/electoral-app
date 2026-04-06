import {
  buildNotificationNavigationTarget,
  getNotificationKind,
  mapResultsSummary,
  resolveVotingEventDescription,
  safeParseNotificationRouteParams,
} from '../../../../../src/container/TabBar/Home/Notification';

describe('Notification routing helpers', () => {
  it('clasifica correctamente notificaciones de publicacion de votacion y resultados', () => {
    expect(
      getNotificationKind({
        type: 'INSTITUTIONAL_EVENT_PUBLISHED',
        title: 'Convocatoria',
        body: '',
      }),
    ).toBe('voting_event');

    expect(
      getNotificationKind({
        type: 'ELECTION_RESULTS',
        title: 'Resultados',
        body: '',
      }),
    ).toBe('election_results');
  });

  it('mapea previews de resultados para el detalle de notificacion', () => {
    expect(
      mapResultsSummary({
        rankings: [
          {id: '2', name: 'Lista B', percentage: 21.4, votes: 98},
          {id: '1', name: 'Lista A', percentage: 65.1, votes: 300},
        ],
      }),
    ).toEqual([
      {id: '1', name: 'Lista A', percent: 65.1, votes: 300},
      {id: '2', name: 'Lista B', percent: 21.4, votes: 98},
    ]);
  });

  it('para convocatorias muestra solo el titulo de la eleccion en el cuerpo secundario', () => {
    expect(
      resolveVotingEventDescription(
        {eventName: 'Elección Directiva 2026'},
        'Ya puedes participar en "Elección Directiva 2026"',
      ),
    ).toBe('Elección Directiva 2026');

    expect(
      resolveVotingEventDescription(
        {},
        'Ya puedes participar en "Elección Directiva 2026"',
      ),
    ).toBe('Elección Directiva 2026');
  });

  it('navega al detalle de voting cuando la notificacion es de publicacion o resultados', () => {
    const target = buildNotificationNavigationTarget({
      kind: 'voting_event',
      data: {type: 'INSTITUTIONAL_EVENT_PUBLISHED'},
    }, {enableVotingFlow: true});

    expect(target).toEqual({
      name: 'VotingNotificationDetailScreen',
      params: {
        notification: {
          kind: 'voting_event',
          data: {type: 'INSTITUTIONAL_EVENT_PUBLISHED'},
        },
      },
    });
  });

  it('navega al mismo detalle voting cuando llega una modificacion de cronograma', () => {
    const target = buildNotificationNavigationTarget({
      kind: 'voting_event',
      isScheduleUpdate: true,
      data: {type: 'INSTITUTIONAL_SCHEDULE_UPDATED'},
    }, {enableVotingFlow: true});

    expect(target).toEqual({
      name: 'VotingNotificationDetailScreen',
      params: {
        notification: {
          kind: 'voting_event',
          isScheduleUpdate: true,
          data: {type: 'INSTITUTIONAL_SCHEDULE_UPDATED'},
        },
      },
    });
  });

  it('redirige worksheet_uploaded al home sin navegar a pantallas erradas', () => {
    expect(
      buildNotificationNavigationTarget({
        data: {type: 'worksheet_uploaded'},
      }),
    ).toEqual({
      name: 'TabNavigation',
      params: {screen: 'HomeScreen'},
    });
  });

  it('construye payload robusto para SuccessScreen aunque routeParams venga incompleto', () => {
    const target = buildNotificationNavigationTarget({
      screen: 'SuccessScreen',
      routeParams: JSON.stringify({
        ipfsData: {jsonUrl: 'https://ipfs.example/doc.json'},
      }),
      data: {
        type: 'acta_published',
        imageUrl: 'https://cdn.example/cert.png',
        ipfsUri: 'ipfs://cid',
      },
    });

    expect(target).toEqual({
      name: 'SuccessScreen',
      params: {
        ipfsData: {
          jsonUrl: 'https://ipfs.example/doc.json',
          imageUrl: 'https://cdn.example/cert.png',
          ipfsUri: 'ipfs://cid',
          url: null,
        },
        certificateData: {
          imageUrl: null,
          jsonUrl: null,
          certificateUrl: null,
        },
        nftData: {
          nftUrl: null,
        },
        notificationType: 'acta_published',
        fromNotifications: true,
      },
    });
  });

  it('evita navegacion cuando el payload trae una pantalla invalida o routeParams malformado', () => {
    expect(safeParseNotificationRouteParams('{bad-json')).toEqual({});
    expect(
      buildNotificationNavigationTarget({
        screen: 'PantallaInventada',
        routeParams: '{bad-json',
        data: {},
      }),
    ).toBeNull();
  });
});

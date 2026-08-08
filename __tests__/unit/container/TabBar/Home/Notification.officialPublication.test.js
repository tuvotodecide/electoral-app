import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';

import {
  buildNotificationNavigationTarget,
  getNotificationKind,
} from '../../../../../src/container/TabBar/Home/Notification';
import Notification from '../../../../../src/container/TabBar/Home/Notification';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://results.example',
}));

jest.mock('../../../../../src/features/officialPublication/components/OfficialPublicationNotificationCard', () => {
  const React = require('react');
  const {Text, View} = require('react-native');
  const getOfficialPublicationSummaryStatus = status => {
    switch (String(status || '').toUpperCase()) {
      case 'SUBMITTED':
      case 'CHAIN_PENDING':
        return 'Firmada y enviada';
      case 'COMPLETED':
        return 'Publicada oficialmente';
      case 'REJECTED':
        return 'Solicitud rechazada';
      case 'EXPIRED':
        return 'Solicitud expirada';
      default:
        return 'Pendiente de confirmación';
    }
  };
  function OfficialPublicationNotificationCard() {
    return React.createElement(
      View,
      {testID: 'officialPublicationNotificationCard'},
      React.createElement(Text, null, 'Fecha de inicio'),
      React.createElement(Text, null, 'Fecha de finalización'),
      React.createElement(Text, null, 'Publicación de resultados'),
      React.createElement(Text, null, 'Empadronados'),
      React.createElement(Text, null, 'Créditos requeridos'),
      React.createElement(Text, null, 'TVD requerido'),
      React.createElement(Text, null, 'Smart account'),
      React.createElement(Text, null, '1 TVD'),
    );
  };
  return {
    __esModule: true,
    default: OfficialPublicationNotificationCard,
    getOfficialPublicationSummaryStatus,
  };
});

jest.mock('@shopify/flash-list', () => ({
  FlashList: ({data = [], renderItem, ListEmptyComponent}) => {
    const React = require('react');
    const {View} = require('react-native');
    if (!data.length && ListEmptyComponent) {
      return React.createElement(ListEmptyComponent);
    }
    return React.createElement(
      View,
      {testID: 'notificationList'},
      data.map((item, index) =>
        React.createElement(View, {key: String(item.id || index)}, renderItem({item, index})),
      ),
    );
  },
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector =>
    selector({
      wallet: {
        payload: {
          did: 'did:example:admin',
          privKey: '0xpriv',
          vc: {credentialSubject: {nationalIdNumber: '1234567'}},
        },
      },
    }),
  ),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => null),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../../../../../src/services/pushPermission', () => ({
  requestPushPermissionExplicit: jest.fn(async () => true),
}));

jest.mock('../../../../../src/services/notifications', () => ({
  formatTiempoRelativo: jest.fn(() => 'Hace 3 minutos'),
}));

jest.mock('../../../../../src/notifications', () => ({
  buildNotificationTextFallback: jest.fn(notification => ({
    title: notification?.title,
    body: notification?.body,
  })),
  getLocalStoredNotifications: jest.fn(async () => []),
  mergeAndDedupeNotifications: jest.fn(({localList = [], remoteList = []}) => [
    ...remoteList,
    ...localList,
  ]),
}));

jest.mock('../../../../../src/utils/lookupCache', () => ({
  getCache: jest.fn(async () => null),
  setCache: jest.fn(async () => null),
}));

jest.mock('../../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(async () => 'api-key'),
}));

jest.mock('../../../../../src/config/featureFlags', () => ({
  FEATURE_FLAGS: {ENABLE_VOTING_FLOW: true},
  DEV_FLAGS: {FORCE_HAS_NOT_VOTED: false},
}));

jest.mock('../../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../../../src/components/common/CStandardHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  function CStandardHeader({title}) {
    return React.createElement(Text, null, title);
  }
  return CStandardHeader;
});

jest.mock('../../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  function CSafeAreaView({children}) {
    return React.createElement(View, null, children);
  }
  return CSafeAreaView;
});

const axios = require('axios');

describe('Notification official publication integration', () => {
  const notification = {
    _id: 'notif-1',
    title: 'Solicitud de publicación oficial',
    body: 'Pendiente de confirmación',
    createdAt: new Date().toISOString(),
    data: {
      type: 'OFFICIAL_PUBLICATION_REQUEST',
      requestId: 'req-1',
      eventName: 'Votación oficial',
      institutionName: 'Institución TVD Prueba 2026',
      status: 'SUBMITTED',
      votingStartAt: '2099-01-01T12:00:00.000Z',
      votingEndAt: '2099-01-01T18:00:00.000Z',
      resultsPublishAt: '2099-01-01T20:00:00.000Z',
      expiresAt: '2099-01-01T21:00:00.000Z',
      votersCount: '120',
      requiredCredits: '4',
      requiredTvd: '1000000000000000000',
      smartAccountAddress: '0x1111111111111111111111111111111111111111',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({data: {data: [notification]}});
  });

  it('mantiene la publicación oficial dentro de notificaciones sin navegar a otra pantalla', () => {
    const item = {
      kind: 'voting_event',
      data: {
        type: 'OFFICIAL_PUBLICATION_REQUEST',
        requestId: 'req-1',
      },
    };

    expect(
      getNotificationKind({
        type: 'OFFICIAL_PUBLICATION_REQUEST',
        title: 'Publicación oficial',
        body: 'Pendiente de confirmación',
      }),
    ).toBe('voting_event');
    expect(buildNotificationNavigationTarget(item)).toBeNull();
  });

  it('muestra lista compacta y abre el detalle al tocar la notificación específica', async () => {
    const navigation = {
      addListener: jest.fn(() => jest.fn()),
      navigate: jest.fn(),
      goBack: jest.fn(),
    };
    const screen = render(<Notification navigation={navigation} />);

    expect(await screen.findByText('Publicación oficial pendiente')).toBeTruthy();
    expect(screen.getByText('Institución TVD Prueba 2026')).toBeTruthy();
    expect(
      screen.queryByText('La votación “Votación oficial” requiere tu autorización desde este dispositivo.'),
    ).toBeNull();
    expect(screen.getByText('Firmada y enviada')).toBeTruthy();
    expect(screen.getByText('Hace 3 minutos')).toBeTruthy();
    expect(screen.getByTestId('notificationOpenIndicator_0')).toBeTruthy();

    expect(screen.queryByText('Fecha de inicio')).toBeNull();
    expect(screen.queryByText('Fecha de finalización')).toBeNull();
    expect(screen.queryByText('Publicación de resultados')).toBeNull();
    expect(screen.queryByText('Empadronados')).toBeNull();
    expect(screen.queryByText('Créditos requeridos')).toBeNull();
    expect(screen.queryByText('TVD requerido')).toBeNull();
    expect(screen.queryByText('Smart account')).toBeNull();
    expect(screen.queryByText('Revisar solicitud')).toBeNull();

    fireEvent.press(screen.getByTestId('notificationItem_0'));

    expect(await screen.findByTestId('officialPublicationNotificationCard')).toBeTruthy();
    expect(screen.getByText('Fecha de inicio')).toBeTruthy();
    expect(screen.getByText('TVD requerido')).toBeTruthy();
    expect(screen.getByText('1 TVD')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('mantiene la notificación disponible después de estados terminales', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            ...notification,
            _id: 'notif-completed',
            data: {...notification.data, status: 'COMPLETED'},
          },
        ],
      },
    });
    const navigation = {
      addListener: jest.fn(() => jest.fn()),
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const screen = render(<Notification navigation={navigation} />);

    expect(await screen.findByText('Publicada oficialmente')).toBeTruthy();
    expect(screen.getByText('Publicación oficial pendiente')).toBeTruthy();
    fireEvent.press(screen.getByTestId('notificationItem_0'));
    expect(await screen.findByTestId('officialPublicationNotificationCard')).toBeTruthy();
  });
});

import React from 'react';
import {render, waitFor} from '@testing-library/react-native';

let capturedOnStateChange;

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children, onStateChange}) => {
    capturedOnStateChange = onStateChange;
    return children;
  },
}));

jest.mock('../../../src/navigation/RootNavigation', () => {
  const navigationRef = {
    isReady: jest.fn(() => true),
    getRootState: jest.fn(() => ({
      index: 0,
      routes: [
        {
          name: 'Home',
          state: {
            index: 1,
            routes: [{name: 'Feed'}, {name: 'Details'}],
          },
        },
      ],
    })),
    getCurrentRoute: jest.fn(() => ({name: 'Home', params: {foo: 'bar'}})),
  };
  return {
    __esModule: true,
    navigationRef,
  };
});

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getInitialNotification: jest.fn(() =>
      Promise.resolve({notification: {id: 'notif-1'}}),
    ),
  },
}));

jest.mock('../../../src/notifications', () => ({
  handleNotificationPress: jest.fn(),
}));

jest.mock('../../../src/config/navigationLogConfig', () => ({
  NavigationLogConfig: {
    enabled: true,
    logs: {stackPath: true, routeParams: true},
    visual: {showOverlay: true, overlayPosition: 'top-left'},
  },
  navLog: jest.fn(),
}));

jest.mock('../../../src/config/sentry', () => ({
  addNavigationBreadcrumb: jest.fn(),
}));

jest.mock('../../../src/navigation/type/StackNavigation', () => () => null);
jest.mock('../../../src/components/common/NavigationDebugOverlay', () => () =>
  'NavigationDebugOverlay',
);

import AppNavigator from '../../../src/navigation';
import {handleNotificationPress} from '../../../src/notifications';
import {navLog} from '../../../src/config/navigationLogConfig';
import {addNavigationBreadcrumb} from '../../../src/config/sentry';

describe('AppNavigator', () => {
  it('procesa notificaciones iniciales y registra cambios de navegaciÃ³n', async () => {
    render(<AppNavigator />);

    await waitFor(() =>
      expect(handleNotificationPress).toHaveBeenCalledWith({id: 'notif-1'}),
    );

    capturedOnStateChange?.();

    expect(addNavigationBreadcrumb).toHaveBeenCalledWith('Home', {foo: 'bar'});
    expect(navLog).toHaveBeenCalledWith(
      'stack',
      expect.stringContaining('Home -> Details'),
    );
    expect(navLog).toHaveBeenCalledWith('screen', 'Home');
  });
});

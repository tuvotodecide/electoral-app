import AsyncStorage from '@react-native-async-storage/async-storage';
import wira from 'wira-sdk';

import {
  activateDemoSession,
  clearDemoData,
  exitDemoSession,
} from '../../../../src/features/demo/demoLifecycle';
import {DEMO_WALLET_PAYLOAD} from '../../../../src/features/demo/demoAccount';
import {
  __resetDemoSessionForTests,
  isDemoActive,
} from '../../../../src/features/demo/demoSession';
import {StackNav} from '../../../../src/navigation/NavigationKey';
import {logOut} from '../../../../src/utils/auth';
import {startLocalSession} from '../../../../src/utils/Session';

jest.mock('../../../../src/utils/auth', () => ({
  logOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../src/utils/Session', () => ({
  startLocalSession: jest.fn(() => Promise.resolve()),
}));

describe('demoLifecycle', () => {
  let dispatch;
  let navigation;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetDemoSessionForTests();
    dispatch = jest.fn();
    navigation = {reset: jest.fn()};
    AsyncStorage.getAllKeys.mockResolvedValue([]);
  });

  describe('activateDemoSession', () => {
    it('siembra redux, abre sesión local y entra a TabNavigation', async () => {
      await activateDemoSession({dispatch, navigation});

      const acciones = dispatch.mock.calls.map(([accion]) => accion);
      expect(acciones).toContainEqual(
        expect.objectContaining({payload: DEMO_WALLET_PAYLOAD}),
      );
      expect(acciones).toContainEqual(
        expect.objectContaining({
          payload: {account: DEMO_WALLET_PAYLOAD.account, guardian: null},
        }),
      );
      expect(acciones).toContainEqual(
        expect.objectContaining({payload: true}),
      );

      expect(startLocalSession).toHaveBeenCalledTimes(1);
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
      expect(isDemoActive()).toBe(true);
    });

    it('no toca el almacenamiento del SDK de wira', async () => {
      await activateDemoSession({dispatch, navigation});

      expect(wira.Storage.checkUserData).not.toHaveBeenCalled();
      expect(wira.Storage.checkFirstLaunch).not.toHaveBeenCalled();
      expect(wira.signIn).not.toHaveBeenCalled();
      expect(wira.checkBiometricAuth).not.toHaveBeenCalled();
    });
  });

  describe('clearDemoData', () => {
    it('conserva participaciones reales y elimina solo las demo', async () => {
      AsyncStorage.getItem.mockImplementation(async key => {
        if (key === 'voting.participations') {
          return JSON.stringify([
            {id: 'real_1', electionId: 'evento_real'},
            {id: 'demo_1', electionId: 'demo_election_active'},
          ]);
        }
        return null;
      });

      await clearDemoData();

      const escritura = AsyncStorage.multiSet.mock.calls[0][0].find(
        ([key]) => key === 'voting.participations',
      );
      expect(JSON.parse(escritura[1])).toEqual([
        {id: 'real_1', electionId: 'evento_real'},
      ]);
      expect(isDemoActive()).toBe(false);
    });

    it('nunca borra la cola offline compartida', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.getAllKeys.mockResolvedValue(['@offline_queue_v1']);

      await clearDemoData();

      const eliminadas = AsyncStorage.multiRemove.mock.calls.flat(2);
      expect(eliminadas).not.toContain('@offline_queue_v1');
    });

    it('no borra el recibo local si pertenece a una elección real', async () => {
      AsyncStorage.getItem.mockImplementation(async key => {
        if (key === 'voting.lastReceipt') {
          return JSON.stringify({electionId: 'evento_real'});
        }
        if (key === 'voting.electionId') {
          return 'evento_real';
        }
        return null;
      });

      await clearDemoData();

      const eliminadas = AsyncStorage.multiRemove.mock.calls.flat(2);
      expect(eliminadas).not.toContain('voting.lastReceipt');
      expect(eliminadas).not.toContain('voting.hasVoted');
    });
  });

  describe('exitDemoSession', () => {
    it('limpia los datos demo y luego cierra sesión', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await exitDemoSession(navigation);

      expect(logOut).toHaveBeenCalledWith(navigation);
      expect(isDemoActive()).toBe(false);
    });
  });
});

/**
 * Activación y salida del modo demostración.
 *
 * Es el análogo de `LoginUser.unlock()` (LoginUser.js:134-173) pero sin tocar
 * el Keychain de wira, sin FINLINE_FLAGS y sin consumir navegación pendiente
 * de notificaciones.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {StackNav} from '../../navigation/NavigationKey';
import {setSecrets} from '../../redux/action/walletAction';
import {setAddresses} from '../../redux/slices/addressSlice';
import {setAuthenticated} from '../../redux/slices/authSlice';
import {logOut} from '../../utils/auth';
import {startLocalSession} from '../../utils/Session';
import ElectionRepositoryMock from '../voting/data/repositories/ElectionRepository.mock';
import {DEMO_WALLET_PAYLOAD} from './demoAccount';
import {DEMO_DNI, isDemoOwnedId} from './demoConfig';
import {endDemoSession, startDemoSession} from './demoSession';

const VOTING_KEYS = {
  HAS_VOTED: 'voting.hasVoted',
  VOTE_SYNCED: 'voting.voteSynced',
  SELECTED_CANDIDATE_ID: 'voting.selectedCandidateId',
  ELECTION_ID: 'voting.electionId',
  VOTE_TIMESTAMP: 'voting.voteTimestamp',
  PARTICIPATION_ID: 'voting.participationId',
  LAST_RECEIPT: 'voting.lastReceipt',
  PARTICIPATIONS: 'voting.participations',
  PENDING_JOURNAL: 'voting.pendingJournal',
  LANDING_CACHE: 'voting.cache.publicLanding',
};
const CANDIDATES_CACHE_PREFIX = 'voting.cache.candidates:';
const LOCAL_NOTIFICATIONS_KEY = '@local-notifications:v1';

const safeParseJson = value => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Activa el modo demostración. Equivalente demo de `unlock()`.
 * @param {{dispatch: Function, navigation: object}} params
 */
export const activateDemoSession = async ({dispatch, navigation}) => {
  await startDemoSession();

  dispatch(setSecrets(DEMO_WALLET_PAYLOAD));
  dispatch(
    setAddresses({
      account: DEMO_WALLET_PAYLOAD.account,
      guardian: null,
    }),
  );
  dispatch(setAuthenticated(true));

  // TabNavigation.useKeepAlive() (TabNavigation.js:33-88) expulsa a
  // AuthNavigation si no hay sesión local válida.
  await startLocalSession();

  navigation.reset({
    index: 0,
    routes: [{name: StackNav.TabNavigation}],
  });
};

/**
 * Borra únicamente los datos generados por el modo demostración.
 * No toca `@offline_queue_v1` ni participaciones de elecciones reales.
 */
export const clearDemoData = async () => {
  await ElectionRepositoryMock.reset();

  const [participationsRaw, lastReceiptRaw, electionIdRaw, localNotifRaw] =
    await Promise.all([
      AsyncStorage.getItem(VOTING_KEYS.PARTICIPATIONS),
      AsyncStorage.getItem(VOTING_KEYS.LAST_RECEIPT),
      AsyncStorage.getItem(VOTING_KEYS.ELECTION_ID),
      AsyncStorage.getItem(LOCAL_NOTIFICATIONS_KEY),
    ]);

  const participations = safeParseJson(participationsRaw);
  const lastReceipt = safeParseJson(lastReceiptRaw);
  const removals = [];
  const writes = [];

  if (Array.isArray(participations)) {
    writes.push([
      VOTING_KEYS.PARTICIPATIONS,
      JSON.stringify(
        participations.filter(item => !isDemoOwnedId(item?.electionId)),
      ),
    ]);
  }

  if (isDemoOwnedId(lastReceipt?.electionId)) {
    removals.push(VOTING_KEYS.LAST_RECEIPT);
  }
  if (isDemoOwnedId(electionIdRaw)) {
    removals.push(
      VOTING_KEYS.HAS_VOTED,
      VOTING_KEYS.VOTE_SYNCED,
      VOTING_KEYS.SELECTED_CANDIDATE_ID,
      VOTING_KEYS.ELECTION_ID,
      VOTING_KEYS.VOTE_TIMESTAMP,
      VOTING_KEYS.PARTICIPATION_ID,
    );
  }

  const journal = safeParseJson(
    await AsyncStorage.getItem(VOTING_KEYS.PENDING_JOURNAL),
  );
  if (journal && typeof journal === 'object') {
    writes.push([
      VOTING_KEYS.PENDING_JOURNAL,
      JSON.stringify(
        Object.fromEntries(
          Object.entries(journal).filter(
            ([electionId]) => !isDemoOwnedId(electionId),
          ),
        ),
      ),
    ]);
  }

  const localNotifications = safeParseJson(localNotifRaw);
  if (Array.isArray(localNotifications)) {
    writes.push([
      LOCAL_NOTIFICATIONS_KEY,
      JSON.stringify(
        localNotifications.filter(
          item => String(item?.dni || '').trim() !== DEMO_DNI,
        ),
      ),
    ]);
  }

  const allKeys = (await AsyncStorage.getAllKeys()) || [];
  removals.push(
    VOTING_KEYS.LANDING_CACHE,
    ...allKeys.filter(
      key =>
        key.startsWith(CANDIDATES_CACHE_PREFIX) &&
        isDemoOwnedId(key.slice(CANDIDATES_CACHE_PREFIX.length)),
    ),
    `@notifications:last-seen:${DEMO_DNI}`,
    `@backend-notifications:alerted:v1:${DEMO_DNI}`,
  );

  if (writes.length) {
    await AsyncStorage.multiSet(writes);
  }
  if (removals.length) {
    await AsyncStorage.multiRemove(removals);
  }

  await endDemoSession();
};

/**
 * "Salir del modo demostración": limpia datos demo y luego cierra sesión con
 * el flujo canónico (`utils/auth.js:10-22`).
 *
 * El orden importa: `clearDemoData` termina en `endDemoSession()`, así que
 * `isDemoActive()` ya es falso cuando `logOut` desmonta el árbol y se vuelve a
 * resolver el repositorio.
 */
export const exitDemoSession = async navigation => {
  await clearDemoData();
  await logOut(navigation);
};

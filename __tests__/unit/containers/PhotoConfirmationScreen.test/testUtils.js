const React = require('react');
const {render, act} = require('@testing-library/react-native');
const PhotoConfirmationModule = require('../../../../src/container/Vote/UploadRecord/PhotoConfirmationScreen');
const PhotoConfirmationScreen =
  PhotoConfirmationModule.default ?? PhotoConfirmationModule;
const axios = require('axios');
const NetInfo = require('@react-native-community/netinfo');
const pinataService = require('../../../../src/utils/pinataService');
const {executeOperation} = require('../../../../src/api/account');
const {oracleCalls, oracleReads} = require('../../../../src/api/oracle');
const {availableNetworks} = require('../../../../src/api/params');
const {enqueue, getAll: getOfflineQueue} = require('../../../../src/utils/offlineQueue');
const {persistLocalImage} = require('../../../../src/utils/persistLocalImage');
const {validateBallotLocally} = require('../../../../src/utils/ballotValidation');
const {
  WorksheetStatus,
  upsertWorksheetLocalStatus,
} = require('../../../../src/utils/worksheetLocalStatus');
const {
  useNavigation,
  useRoute,
} = require('@react-navigation/native');
const {useSelector} = require('react-redux');
const String = require('../../../__mocks__/String').default;

const baseTheme = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#4F9858',
  primaryLight: '#E8F5E8',
};

const baseWallet = {
  account: '0x123',
  id: 'user-id',
  dni: '789456',
  privKey: 'private-key',
  vc: {
    credentialSubject: {
      fullName: 'Test User',
    },
  },
};

const defaultPartyResults = [
  {partido: 'unidad', presidente: '10', diputado: '8'},
  {partido: 'pdc', presidente: '5', diputado: '3'},
];

const defaultVoteSummaryResults = [
  {id: 'validos', label: 'Votos Válidos', value1: '15', value2: '11'},
  {id: 'nulos', label: 'Votos Nulos', value1: '1', value2: '2'},
  {id: 'blancos', label: 'Votos en Blanco', value1: '0', value2: '1'},
];

const buildRouteParams = overrides => ({
  tableData: {
    tableNumber: '1234',
    numero: '1234',
    codigo: 'C-1234',
    recinto: 'Colegio Central',
    ubicacion: 'Colegio Central, Provincia Test',
    idRecinto: 'loc-001',
    ...overrides?.tableData,
  },
  photoUri: overrides?.photoUri ?? 'file:///acta.jpg',
  partyResults: overrides?.partyResults ?? defaultPartyResults,
  voteSummaryResults:
    overrides?.voteSummaryResults ?? defaultVoteSummaryResults,
  aiAnalysis: overrides?.aiAnalysis ?? {score: 0.9},
  mesaData: overrides?.mesaData,
  mesa: overrides?.mesa,
});

const buildReduxState = overrides => ({
  theme: {theme: {...baseTheme, ...(overrides?.theme ?? {})}},
  wallet: {payload: {...baseWallet, ...(overrides?.wallet ?? {})}},
});

const mockSelectors = overrides => {
  useSelector.mockImplementation(selector => selector(buildReduxState(overrides)));
};

const restoreSelectors = () => {
  useSelector.mockReset();
};

const setupRoute = params => {
  useRoute.mockReturnValue({params});
};

const setupNavigation = overrides => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  };
  useNavigation.mockReturnValue(navigation);
  return navigation;
};

const renderPhotoConfirmation = ({params, navigationOverrides, selectorOverrides} = {}) => {
  const finalParams = params ?? buildRouteParams();
  setupRoute(finalParams);
  const navigation = setupNavigation(navigationOverrides);
  mockSelectors(selectorOverrides);

  const utils = render(
    React.createElement(PhotoConfirmationScreen, {
      route: {params: finalParams},
    }),
  );

  return {
    params: finalParams,
    navigation,
    ...utils,
  };
};

const flushPromises = () => new Promise(resolve => Promise.resolve().then(resolve));

const resetMocks = () => {
  jest.clearAllMocks();
  useNavigation.mockReset && useNavigation.mockReset();
  useRoute.mockReset && useRoute.mockReset();
  restoreSelectors();
  axios.post.mockReset();
  pinataService.checkDuplicateBallot.mockReset();
  pinataService.uploadElectoralActComplete.mockReset();
  NetInfo.fetch.mockReset();
  validateBallotLocally.mockReset();
  enqueue.mockReset();
  getOfflineQueue.mockReset();
  persistLocalImage.mockReset();
  upsertWorksheetLocalStatus.mockReset();
  executeOperation.mockReset();
  oracleCalls.requestRegister.mockReset();
  oracleCalls.createAttestation.mockReset();
  oracleCalls.attest.mockReset();
  oracleReads.isRegistered.mockReset();
  oracleReads.waitForOracleEvent.mockReset();
  oracleReads.isUserJury.mockReset();
};

module.exports = {
  renderPhotoConfirmation,
  buildRouteParams,
  defaultPartyResults,
  defaultVoteSummaryResults,
  mockSelectors,
  restoreSelectors,
  setupRoute,
  setupNavigation,
  flushPromises,
  resetMocks,
  axios,
  NetInfo,
  pinataService,
  executeOperation,
  oracleCalls,
  oracleReads,
  availableNetworks,
  enqueue,
  getOfflineQueue,
  persistLocalImage,
  validateBallotLocally,
  upsertWorksheetLocalStatus,
  WorksheetStatus,
  String,
  act,
};

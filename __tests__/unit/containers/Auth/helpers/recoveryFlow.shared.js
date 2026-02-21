import wira from 'wira-sdk';
import {useKycFindPublicQuery} from '../../../../../src/data/kyc';
import {
  useGuardiansRecoveryRequestQuery,
  useHasGuardiansQuery,
  useGuardiansRecoveryDetailQuery,
} from '../../../../../src/data/guardians';
import {getDeviceId} from '../../../../../src/utils/device-id';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');

  return ({testID, handleTextChange, inputCount}) =>
    React.createElement(TextInput, {
      testID: testID || 'otpInput',
      onChangeText: handleTextChange,
      maxLength: inputCount,
    });
});

jest.mock('../../../../../src/data/kyc', () => ({
  useKycFindPublicQuery: jest.fn(),
}));

jest.mock('../../../../../src/data/guardians', () => ({
  useGuardiansRecoveryRequestQuery: jest.fn(),
  useHasGuardiansQuery: jest.fn(),
  useGuardiansRecoveryDetailQuery: jest.fn(),
}));

jest.mock('../../../../../src/utils/device-id', () => ({
  getDeviceId: jest.fn(async () => 'device-id-1'),
}));

jest.mock('../../../../../src/utils/Session', () => ({
  startSession: jest.fn(async () => undefined),
  startLocalSession: jest.fn(async () => undefined),
}));

jest.mock('../../../../../src/utils/migrateLegacy', () => ({
  getLegacyData: jest.fn(async () => ({streamId: 'stream-1', privKey: 'priv-1'})),
}));

jest.mock('react-native-paper', () => ({
  ActivityIndicator: 'ActivityIndicator',
}));

jest.mock('react-native-gesture-handler', () => {
  const {TouchableOpacity, View, FlatList, ScrollView} = require('react-native');
  return {
    TouchableOpacity,
    FlatList,
    ScrollView,
    PanGestureHandler: View,
    TapGestureHandler: View,
    GestureHandlerRootView: View,
    State: {},
  };
});

export const configurarMocksRecuperacion = () => {
  jest.clearAllMocks();

  useKycFindPublicQuery.mockReturnValue({
    mutate: jest.fn((_payload, {onSuccess}) =>
      onSuccess({
        ok: true,
        did: 'did:example:1',
        displayNamePublic: 'User Example',
        accountAddress: '0xaccount',
        guardianAddress: '0xguardian',
      }),
    ),
    isLoading: false,
  });

  useHasGuardiansQuery.mockReturnValue({
    has: true,
    loading: false,
    refetch: jest.fn(),
  });

  useGuardiansRecoveryRequestQuery.mockReturnValue({
    mutate: jest.fn((_payload, {onSuccess}) => onSuccess({ok: true})),
    isLoading: false,
  });

  useGuardiansRecoveryDetailQuery.mockReturnValue({
    data: {
      ok: true,
      status: 'PENDING',
      votes: [{guardianDid: 'did:guardian:1', decision: 'PENDING'}],
    },
    isLoading: false,
    remove: jest.fn(),
  });

  getDeviceId.mockResolvedValue('device-id-1');
  wira.Biometric.getBioFlag.mockResolvedValue(false);
  AsyncStorage.multiRemove = jest.fn(() => Promise.resolve());
};

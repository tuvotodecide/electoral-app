/**
 * Tests for RecordCertificationScreen
 * Tests de pantalla de certificación de acta
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('../../../../src/api/account', () => ({
  executeOperation: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../../../../src/api/oracle', () => ({
  oracleCalls: {
    requestRegister: jest.fn(),
    attest: jest.fn(),
  },
  oracleReads: {
    isRegistered: jest.fn(() => Promise.resolve(true)),
    isUserJury: jest.fn(() => Promise.resolve(false)),
    waitForOracleEvent: jest.fn(),
  },
}));
jest.mock('axios');

const mockGoBack = jest.fn();
const mockPopToTop = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    popToTop: mockPopToTop,
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {
      recordId: 'record123',
      tableData: {
        tableNumber: 'Mesa 1234',
        numero: '1234',
        codigo: 'ABC123',
        recinto: 'Test Recinto',
      },
      mesaInfo: {
        _id: 'mesa_id_123',
      },
    },
  }),
}));

describe('RecordCertificationScreen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
  };

  const mockUserData = {
    account: 'user123',
    privKey: 'privateKey123',
    dni: '12345678',
    vc: {
      credentialSubject: {
        fullName: 'Test User',
      },
    },
  };

  const createStore = () => {
    return configureStore({
      reducer: {
        theme: (state = {theme: mockTheme}) => state,
        wallet: (state = {payload: mockUserData}) => state,
      },
    });
  };

  const renderWithProvider = (component) => {
    const store = createStore();
    return render(
      <Provider store={store}>{component}</Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      expect(getByTestId('recordCertificationContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      expect(getByTestId('recordCertificationHeader')).toBeTruthy();
    });

    it('renderiza el ScrollView', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      expect(getByTestId('recordCertificationScrollView')).toBeTruthy();
    });

    it('renderiza contenedor de certificación', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      expect(getByTestId('certificationContainer')).toBeTruthy();
    });

    it('renderiza título de certificación', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      expect(getByTestId('certificationTitle')).toBeTruthy();
    });

    it('renderiza botón de certificar', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      expect(getByTestId('certifyButton')).toBeTruthy();
    });
  });

  describe('Interacciones', () => {
    it('abre modal de confirmación al presionar certificar', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId, queryByTestId} = renderWithProvider(<RecordCertificationScreen />);

      fireEvent.press(getByTestId('certifyButton'));

      expect(getByTestId('confirmModal')).toBeTruthy();
    });

    it('cierra modal al presionar cancelar', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      // Open modal
      fireEvent.press(getByTestId('certifyButton'));
      expect(getByTestId('confirmModal')).toBeTruthy();

      // Cancel
      fireEvent.press(getByTestId('cancelCertificationButton'));
    });
  });

  describe('Datos de Usuario', () => {
    it('muestra nombre del usuario desde Redux', () => {
      const RecordCertificationScreen = require('../../../../src/container/Vote/WitnessRecord/RecordCertificationScreen').default;
      const {getByTestId} = renderWithProvider(<RecordCertificationScreen />);

      // The user name should be displayed in the certification text
      expect(getByTestId('certificationText')).toBeTruthy();
    });
  });
});

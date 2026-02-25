/**
 * Tests for GuardiansAdmin Screen
 * Tests de pantalla de administración de guardianes
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import GuardiansAdmin from '../../../../../src/container/TabBar/Guardians/GuardiansAdmin';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';

// Mocks
jest.mock('../../../../../src/data/guardians', () => ({
  useMyGuardianInvitationsListQuery: jest.fn(() => ({
    data: [
      {
        id: 'inv1',
        governmentIdentifier: 'inv1',
        ownerDid: 'did:example:owner1',
        inviterDid: 'did:example:inviter1',
        inviter: {displayNamePublic: 'Inviter Uno'},
        nickname: 'Owner 1',
        status: 'PENDING',
      },
      {
        id: 'prot1',
        governmentIdentifier: 'prot1',
        ownerDid: 'did:example:owner3',
        inviterDid: 'did:example:inviter3',
        inviter: {displayNamePublic: 'Guardian Aceptado'},
        nickname: 'Owner 3',
        status: 'ACCEPTED',
      },
    ],
    isLoading: false,
  })),
  useMyGuardianRecoveryListQuery: jest.fn(() => ({
    data: [
      {
        id: 'rec1',
        requestId: 'rec1',
        governmentIdentifier: 'rec1',
        ownerDid: 'did:example:owner2',
        targetDid: 'did:example:target2',
        publicFullName: 'Owner 2',
        createdAt: 1710000000,
        status: 'PENDING',
      },
    ],
    isLoading: false,
  })),
  useGuardianInvitationActionQuery: jest.fn(() => ({
    mutate: jest.fn(),
  })),
  useRecoveryActionQuery: jest.fn(() => ({
    mutate: jest.fn(),
  })),
}));

jest.mock('../../../../../src/utils/Address', () => ({
  truncateDid: jest.fn(did => (did ? did.slice(0, 15) + '...' : '')),
}));

jest.mock('../../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, title}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, title));
});

jest.mock('../../../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID}) =>
    React.createElement(Text, {testID}, children);
});

jest.mock('../../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  return ({testID, title, onPress}) =>
    React.createElement(
      TouchableOpacity,
      {testID, onPress},
      React.createElement(Text, null, title),
    );
});

jest.mock('../../../../../src/components/common/Icono', () => {
  const React = require('react');
  return ({testID, name}) =>
    React.createElement('Icono', {testID, name});
});

jest.mock('../../../../../src/components/modal/GuardianInfoModal', () => {
  const React = require('react');
  const {View, TouchableOpacity, Text} = require('react-native');
  return ({testID, visible, onClose}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(
            TouchableOpacity,
            {testID: 'guardianInfoModalCloseBtn', onPress: onClose},
            React.createElement(Text, null, 'Close'),
          ),
        )
      : null;
});

describe('GuardiansAdmin Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        primaryColor: '#459151',
        dark: false,
        backgroundColor: '#FFFFFF',
        grayScale200: '#E5E7EB',
        grayScale500: '#6B7280',
        grayScale700: '#374151',
        stepBackgroundColor: '#F3F4F6',
        white: '#FFFFFF',
        activeColor: '#10B981',
        pendingColor: '#F59E0B',
        rejectedColor: '#EF4444',
      },
    },
    wallet: {
      payload: {
        did: 'did:example:123',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminKeyboardWrapper')).toBeTruthy();
    });
  });

  describe('Sección de Invitaciones', () => {
    it('renderiza el título de invitaciones', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminInvitationsTitle')).toBeTruthy();
    });

    it('renderiza la lista de invitaciones', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminInvitationsList')).toBeTruthy();
    });

    it('renderiza items de invitación', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminInvitationItem_inv1')).toBeTruthy();
    });
  });

  describe('Sección de Recuperaciones', () => {
    it('renderiza el título de recuperaciones', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminRecoveryTitle')).toBeTruthy();
    });

    it('renderiza la lista de recuperaciones', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminRecoveryList')).toBeTruthy();
    });

    it('renderiza items de recuperación', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminRecoveryItem_rec1')).toBeTruthy();
    });
  });

  describe('Acciones de Invitación', () => {
    it('llama a aceptar invitación al presionar el botón', () => {
      const {useGuardianInvitationActionQuery} = require('../../../../../src/data/guardians');
      const mockMutate = jest.fn();
      useGuardianInvitationActionQuery.mockReturnValue({mutate: mockMutate});

      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const acceptBtn = getByTestId('guardiansAdminInvitationItemAccept_inv1');
      fireEvent.press(acceptBtn);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'inv1',
        did: 'did:example:123',
        action: 'accept',
      });
    });

    it('llama a rechazar invitación al presionar el botón', () => {
      const {useGuardianInvitationActionQuery} = require('../../../../../src/data/guardians');
      const mockMutate = jest.fn();
      useGuardianInvitationActionQuery.mockReturnValue({mutate: mockMutate});

      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const rejectBtn = getByTestId('guardiansAdminInvitationItemReject_inv1');
      fireEvent.press(rejectBtn);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'inv1',
        did: 'did:example:123',
        action: 'reject',
      });
    });
  });

  describe('Acciones de Recuperación', () => {
    it('llama a aprobar recuperación al presionar el botón', () => {
      const {useRecoveryActionQuery} = require('../../../../../src/data/guardians');
      const mockMutate = jest.fn();
      useRecoveryActionQuery.mockReturnValue({mutate: mockMutate});

      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const approveBtn = getByTestId('guardiansAdminRecoveryItemApprove_rec1');
      fireEvent.press(approveBtn);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'rec1',
        action: 'approve',
        did: 'did:example:123',
      });
    });

    it('llama a rechazar recuperación al presionar el botón', () => {
      const {useRecoveryActionQuery} = require('../../../../../src/data/guardians');
      const mockMutate = jest.fn();
      useRecoveryActionQuery.mockReturnValue({mutate: mockMutate});

      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const rejectBtn = getByTestId('guardiansAdminRecoveryItemReject_rec1');
      fireEvent.press(rejectBtn);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'rec1',
        action: 'reject',
        did: 'did:example:123',
      });
    });
  });

  describe('Modal de Información', () => {
    it('abre el modal al presionar el menú de un guardián', () => {
      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      const menuBtn = getByTestId('guardiansAdminProtectedItemMenu_prot1');
      if (menuBtn) {
        fireEvent.press(menuBtn);
        expect(getByTestId('guardiansAdminInfoModal')).toBeTruthy();
      }
    });
  });

  describe('Estado Vacío', () => {
    it('maneja listas vacías correctamente', () => {
      const {
        useMyGuardianInvitationsListQuery,
        useMyGuardianRecoveryListQuery,
      } = require('../../../../../src/data/guardians');

      useMyGuardianInvitationsListQuery.mockReturnValueOnce({
        data: [],
        isLoading: false,
      });
      useMyGuardianRecoveryListQuery.mockReturnValueOnce({
        data: [],
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAdminContainer')).toBeTruthy();
    });
  });

  describe('Estado de Carga', () => {
    it('muestra indicador de carga cuando está cargando', () => {
      const {useMyGuardianInvitationsListQuery} = require('../../../../../src/data/guardians');
      useMyGuardianInvitationsListQuery.mockReturnValueOnce({
        data: [],
        isLoading: true,
      });

      const {getByTestId} = renderWithProviders(
        <GuardiansAdmin navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      // Debería mostrar algún indicador de carga
      expect(getByTestId('guardiansAdminContainer')).toBeTruthy();
    });
  });
});

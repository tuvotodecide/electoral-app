/**
 * Tests for Guardians Screen
 * Tests de pantalla de guardianes
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import Guardians from '../../../../../src/container/TabBar/Guardians/Guardians';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';
import {StackNav} from '../../../../../src/navigation/NavigationKey';

// Mocks
jest.mock('../../../../../src/data/guardians', () => ({
  guardianApi: {
    updateThreshold: jest.fn(() => Promise.resolve({ok: true})),
  },
  useMyGuardiansAllListQuery: jest.fn(() => ({
    data: [
      {
        id: 'guardian1',
        nickname: 'Guardian 1',
        guardianDid: 'did:example:guardian1',
        status: 'ACCEPTED',
      },
      {
        id: 'guardian2',
        nickname: 'Guardian 2',
        guardianDid: 'did:example:guardian2',
        status: 'PENDING',
      },
    ],
    error: null,
    isLoading: false,
  })),
  useGuardiansThresholdQuery: jest.fn(() => ({
    data: 2,
  })),
  useGuardianDeleteQuery: jest.fn(() => ({
    mutate: jest.fn(),
  })),
  useGuardianPatchQuery: jest.fn(() => ({
    mutate: jest.fn(),
  })),
}));

jest.mock('../../../../../src/utils/Address', () => ({
  truncateDid: jest.fn(did => did.slice(0, 15) + '...'),
}));

jest.mock('react-native-actions-sheet', () => {
  const React = require('react');
  const {View} = require('react-native');
  return React.forwardRef(({children}, ref) => {
    React.useImperativeHandle(ref, () => ({
      show: jest.fn(),
      hide: jest.fn(),
    }));
    return React.createElement(View, {testID: 'actionSheet'}, children);
  });
});

jest.mock('react-native-paper', () => ({
  ActivityIndicator: ({testID}) => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, {testID});
  },
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
  return ({testID, title, rightIcon}) =>
    React.createElement(
      View,
      {testID},
      React.createElement(Text, null, title),
      rightIcon,
    );
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
  return ({testID, title, onPress, frontIcon}) =>
    React.createElement(
      TouchableOpacity,
      {testID, onPress},
      frontIcon,
      React.createElement(Text, null, title),
    );
});

jest.mock('../../../../../src/components/common/Icono', () => {
  const React = require('react');
  return ({testID, name}) =>
    React.createElement('Icono', {testID, name});
});

jest.mock('../../../../../src/components/common/CAlert', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, message}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, message));
});

jest.mock('../../../../../src/components/common/CInput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');
  return ({testID, _value, toGetTextFieldValue}) =>
    React.createElement(TextInput, {
      testID,
      value: _value,
      onChangeText: toGetTextFieldValue,
    });
});

jest.mock('../../../../../src/components/common/CIconButton', () => {
  const React = require('react');
  const {TouchableOpacity} = require('react-native');
  return ({testID, onPress}) =>
    React.createElement(TouchableOpacity, {testID: 'saveThresholdBtn', onPress});
});

jest.mock('../../../../../src/components/modal/GuardianActionModal', () => {
  const React = require('react');
  const {View, TouchableOpacity, Text} = require('react-native');
  return ({testID, visible, guardian, onClose, onSave, onDelete}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(Text, null, guardian?.nickname),
          React.createElement(
            TouchableOpacity,
            {testID: 'guardianModalSaveBtn', onPress: () => onSave('New Nick')},
            React.createElement(Text, null, 'Save'),
          ),
          React.createElement(
            TouchableOpacity,
            {testID: 'guardianModalDeleteBtn', onPress: onDelete},
            React.createElement(Text, null, 'Delete'),
          ),
          React.createElement(
            TouchableOpacity,
            {testID: 'guardianModalCloseBtn', onPress: onClose},
            React.createElement(Text, null, 'Close'),
          ),
        )
      : null;
});

describe('Guardians Screen', () => {
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
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansKeyboardWrapper')).toBeTruthy();
    });

    it('renderiza el subtítulo', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansSubtitle')).toBeTruthy();
    });

    it('renderiza la lista de guardianes', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansList')).toBeTruthy();
    });

    it('renderiza el botón de agregar guardián', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansAddButton')).toBeTruthy();
    });
  });

  describe('Lista de Guardianes', () => {
    it('renderiza los items de guardianes', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansListItem_guardian1')).toBeTruthy();
      expect(getByTestId('guardiansListItem_guardian2')).toBeTruthy();
    });

    it('muestra el nombre del guardián', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansListItemName_guardian1')).toBeTruthy();
    });

    it('muestra el estado del guardián', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansListItemStatus_guardian1')).toBeTruthy();
    });
  });

  describe('Interacciones de Usuario', () => {
    it('navega a AddGuardians al presionar el botón de agregar', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={localNavigation} />,
        {initialState: mockStore},
      );

      fireEvent.press(getByTestId('guardiansAddButton'));

      expect(localNavigation.navigate).toHaveBeenCalledWith(StackNav.AddGuardians);
    });

    it('abre el modal de acciones al presionar el menú de un guardián', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      fireEvent.press(getByTestId('guardiansListItemMenu_guardian1'));

      expect(getByTestId('guardiansActionModal')).toBeTruthy();
    });

    it('cierra el modal al presionar cerrar', async () => {
      const {getByTestId, queryByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      fireEvent.press(getByTestId('guardiansListItemMenu_guardian1'));
      expect(getByTestId('guardiansActionModal')).toBeTruthy();

      fireEvent.press(getByTestId('guardianModalCloseBtn'));

      await waitFor(() => {
        expect(queryByTestId('guardiansActionModal')).toBeNull();
      });
    });
  });

  describe('Iconos del Header', () => {
    it('renderiza los iconos de la derecha del header', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansRightIcons')).toBeTruthy();
    });

    it('navega a OnBoardingGuardians al presionar info', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={localNavigation} />,
        {initialState: mockStore},
      );

      fireEvent.press(getByTestId('guardiansInfoButton'));

      expect(localNavigation.navigate).toHaveBeenCalledWith(
        StackNav.OnBoardingGuardians,
      );
    });
  });

  describe('Estado de Carga', () => {
    it('muestra loader cuando está cargando', () => {
      const {useMyGuardiansAllListQuery} = require('../../../../../src/data/guardians');
      useMyGuardiansAllListQuery.mockReturnValueOnce({
        data: [],
        error: null,
        isLoading: true,
      });

      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansLoadingIndicator')).toBeTruthy();
    });
  });

  describe('Lista Vacía', () => {
    it('muestra info card cuando no hay guardianes', () => {
      const {useMyGuardiansAllListQuery} = require('../../../../../src/data/guardians');
      useMyGuardiansAllListQuery.mockReturnValueOnce({
        data: [],
        error: null,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansInfoCard')).toBeTruthy();
    });
  });

  describe('Alerta de Guardianes Requeridos', () => {
    it('muestra alerta cuando hay menos de 2 guardianes', () => {
      const {useMyGuardiansAllListQuery} = require('../../../../../src/data/guardians');
      useMyGuardiansAllListQuery.mockReturnValueOnce({
        data: [
          {
            id: 'guardian1',
            nickname: 'Guardian 1',
            guardianDid: 'did:example:guardian1',
            status: 'ACCEPTED',
          },
        ],
        error: null,
        isLoading: false,
      });

      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('guardiansRequiredAlert')).toBeTruthy();
    });
  });

  describe('Configuración de Threshold', () => {
    it('renderiza el input de threshold en el action sheet', () => {
      const {getByTestId} = renderWithProviders(
        <Guardians navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('threshholdInput')).toBeTruthy();
    });
  });
});

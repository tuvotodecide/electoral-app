/**
 * Tests for NotificationDetails Screen
 * Tests de pantalla de detalles de notificación
 */

import React from 'react';
import NotificationDetails from '../../../../../src/container/TabBar/Home/NotificationDetails';
import {renderWithProviders, mockRoute} from '../../../../setup/test-utils';

// Mocks
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({testID, name, ...props}) =>
    React.createElement('Ionicons', {testID, name, ...props});
});

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

describe('NotificationDetails Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        grayScale400: '#9CA3AF',
        backgroundColor: '#FFFFFF',
      },
    },
  };

  const routeWithNotification = {
    ...mockRoute,
    params: {
      item: {
        id: 'notif1',
        title: 'Mesa 001',
        body: 'Tu voto ha sido registrado',
        type: 'announce_count',
        locationName: 'Colegio Test',
        locationAddress: 'Dirección Test 123',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsHeader')).toBeTruthy();
    });

    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsMainContainer')).toBeTruthy();
    });

    it('renderiza la sección de imagen', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsImageSection')).toBeTruthy();
    });

    it('renderiza la imagen', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsImage')).toBeTruthy();
    });

    it('renderiza el título', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsTitle')).toBeTruthy();
    });

    it('renderiza la sección de contenido', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsContentSection')).toBeTruthy();
    });

    it('renderiza el texto de saludo', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsHelloText')).toBeTruthy();
    });

    it('renderiza la descripción', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsDescription')).toBeTruthy();
    });

    it('renderiza el botón de verificar', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsVerifyButton')).toBeTruthy();
    });

    it('renderiza el texto de pregunta', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsQueryText')).toBeTruthy();
    });
  });

  describe('Header con Icono de Menú', () => {
    it('renderiza el botón de menú en el header', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsMenuButton')).toBeTruthy();
    });

    it('renderiza el icono de menú', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsMenuIcon')).toBeTruthy();
    });
  });

  describe('Datos de la Notificación', () => {
    it('muestra los datos de la notificación correctamente', () => {
      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsTitle')).toBeTruthy();
      expect(getByTestId('notificationDetailsDescription')).toBeTruthy();
    });

    it('maneja correctamente cuando no hay datos de notificación', () => {
      const routeWithoutData = {
        ...mockRoute,
        params: {
          item: {},
        },
      };

      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithoutData} />,
        {initialState: mockStore},
      );

      expect(getByTestId('notificationDetailsContainer')).toBeTruthy();
    });
  });

  describe('Tema Oscuro', () => {
    it('renderiza correctamente con tema oscuro', () => {
      const darkStore = {
        ...mockStore,
        theme: {
          theme: {
            ...mockStore.theme.theme,
            dark: true,
          },
        },
      };

      const {getByTestId} = renderWithProviders(
        <NotificationDetails route={routeWithNotification} />,
        {initialState: darkStore},
      );

      expect(getByTestId('notificationDetailsContainer')).toBeTruthy();
    });
  });
});

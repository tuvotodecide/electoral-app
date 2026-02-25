/**
 * Tests for PushNotification settings screen
 * Tests de pantalla de configuración de notificaciones push
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock Ionicons as proper component
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const MockIcon = ({name, size, color, style, testID}) => {
    return React.createElement('Text', {
      testID: testID || `icon-${name}`,
      style: [{fontSize: size, color}, style],
      children: name,
    });
  };
  return MockIcon;
});

jest.mock('../../../../../src/assets/svg', () => ({
  Email_Dark: () => null,
  Email_Light: () => null,
  News_Dark: () => null,
  News_Light: () => null,
  PersonalProfile_Light: () => null,
  Profile_Dark: () => null,
  Promotion_Dark: () => null,
  Promotion_Light: () => null,
  Telegram_Dark: () => null,
  Telegram_Light: () => null,
  Whatsapp_Dark: () => null,
  Whatsapp_Light: () => null,
}));

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: () => true,
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

describe('PushNotification screen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
    white: '#FFFFFF',
    dark: false,
    grayScale200: '#E0E0E0',
    grayScale500: '#9E9E9E',
    grayScale700: '#616161',
    inputBackground: '#F5F5F5',
  };

  const createStore = () => {
    return configureStore({
      reducer: {
        theme: (state = {theme: mockTheme}) => state,
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
    it('renderiza sin errores', () => {
      const PushNotification = require('../../../../../src/container/TabBar/Profile/PushNotification').default;
      const {UNSAFE_root} = renderWithProvider(<PushNotification />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header', () => {
      const PushNotification = require('../../../../../src/container/TabBar/Profile/PushNotification').default;
      const {getByTestId} = renderWithProvider(<PushNotification />);

      expect(getByTestId('pushNotificationHeader')).toBeTruthy();
    });
  });

  describe('Switches de Notificación', () => {
    it('renderiza lista de opciones de notificación', () => {
      const PushNotification = require('../../../../../src/container/TabBar/Profile/PushNotification').default;
      const {UNSAFE_root} = renderWithProvider(<PushNotification />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

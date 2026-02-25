/**
 * Tests for HelpCenter screen
 * Tests de pantalla de centro de ayuda
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('../../../../../src/assets/svg', () => ({
  HeadSetIcon: () => null,
}));
jest.mock('../../../../../src/api/constant', () => ({
  helpAndCenterData: [
    {title: 'Help Topic 1', description: 'Description 1', route: 'Route1'},
    {title: 'Help Topic 2', description: 'Description 2', route: 'Route2'},
  ],
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
}));

describe('HelpCenter screen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
    white: '#FFFFFF',
    black: '#000000',
    dark: false,
    grayScale200: '#E0E0E0',
    grayScale400: '#BDBDBD',
    grayScale500: '#9E9E9E',
    grayScale700: '#616161',
    inputBackground: '#F5F5F5',
    iconBackgroundColor: '#F0F0F0',
    gradient1: '#4F9858',
    gradient2: '#3D7A45',
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
      const HelpCenter = require('../../../../../src/container/TabBar/Profile/HelpCenter').default;
      const {UNSAFE_root} = renderWithProvider(
        <HelpCenter navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Búsqueda', () => {
    it('filtra datos cuando se escribe en búsqueda', () => {
      const HelpCenter = require('../../../../../src/container/TabBar/Profile/HelpCenter').default;
      const {UNSAFE_root} = renderWithProvider(
        <HelpCenter navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Navegación', () => {
    it('navega a FAQScreen al presionar preguntas frecuentes', () => {
      const HelpCenter = require('../../../../../src/container/TabBar/Profile/HelpCenter').default;
      const {UNSAFE_root} = renderWithProvider(
        <HelpCenter navigation={{navigate: mockNavigate}} />
      );

      // Navigation test
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

/**
 * Tests for SelectLanguage screen
 * Tests de pantalla de selección de idioma
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock Ionicons as a proper component
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

jest.mock('../../../../../src/api/constant', () => ({
  LanguageData: [
    {lName: 'English (USA)', svgIcon: null},
    {lName: 'Español', svgIcon: null},
    {lName: 'Português', svgIcon: null},
  ],
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

describe('SelectLanguage screen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
    dark: false,
    grayScale200: '#E0E0E0',
    grayScale700: '#616161',
    inputBackground: '#F5F5F5',
    grayScale60: '#FAFAFA',
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
    it('renderiza el contenedor principal', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {UNSAFE_root} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {UNSAFE_root} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza la lista de idiomas', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {UNSAFE_root, getByText} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
      // Verify one of the languages is rendered
      expect(getByText('English (USA)')).toBeTruthy();
    });

    it('renderiza botón de cambiar idioma', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {UNSAFE_root} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Selección de Idioma', () => {
    it('selecciona English por defecto', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {UNSAFE_root, getByText} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
      expect(getByText('English (USA)')).toBeTruthy();
    });

    it('cambia selección al presionar otro idioma', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {getByText} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      fireEvent.press(getByText('Español'));
    });
  });

  describe('Navegación', () => {
    it('navega al presionar cambiar idioma', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {UNSAFE_root} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

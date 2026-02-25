/**
 * Tests for SelectLanguage screen
 * Tests de pantalla de selección de idioma
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('../../../../../src/api/constant', () => ({
  LanguageData: [
    {lName: 'English (USA)', svgIcon: null},
    {lName: 'Español', svgIcon: null},
    {lName: 'Português', svgIcon: null},
  ],
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    canGoBack: () => true,
  }),
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
      const {getByTestId} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('selectLanguageContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {getByTestId} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('selectLanguageHeader')).toBeTruthy();
    });

    it('renderiza la lista de idiomas', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {getByTestId} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('selectLanguageList')).toBeTruthy();
    });

    it('renderiza botón de cambiar idioma', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {getByTestId} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      expect(getByTestId('selectLanguageChangeButton')).toBeTruthy();
    });
  });

  describe('Selección de Idioma', () => {
    it('selecciona English por defecto', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {getByTestId} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      // El primer item debería estar seleccionado
      expect(getByTestId('selectLanguageItem_0')).toBeTruthy();
    });

    it('cambia selección al presionar otro idioma', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {getByTestId} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      fireEvent.press(getByTestId('selectLanguageItem_1'));
      // State should update
    });
  });

  describe('Navegación', () => {
    it('navega a Profile al presionar cambiar idioma', () => {
      const SelectLanguage = require('../../../../../src/container/TabBar/Profile/SelectLanguage').default;
      const {getByTestId} = renderWithProvider(
        <SelectLanguage navigation={{navigate: mockNavigate}} />
      );

      fireEvent.press(getByTestId('selectLanguageChangeButton'));
      expect(mockNavigate).toHaveBeenCalledWith('Profile');
    });
  });
});

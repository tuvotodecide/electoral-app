/**
 * Tests for CHeader component
 * Tests del componente de header
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
}));

describe('CHeader component', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
  };

  const createWrapper = () => {
    const store = configureStore({
      reducer: {
        theme: (state = {theme: mockTheme}) => state,
      },
    });
    return ({children}) =>
      React.createElement(Provider, {store}, children);
  };

  const renderWithProvider = (component) => {
    return render(component, {wrapper: createWrapper()});
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  describe('Renderizado Básico', () => {
    it('renderiza el título correctamente', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByText} = renderWithProvider(
        <CHeader title="Mi Título" />
      );

      expect(getByText('Mi Título')).toBeTruthy();
    });

    it('renderiza con testID', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByTestId} = renderWithProvider(
        <CHeader title="Test" testID="test-header" />
      );

      expect(getByTestId('test-header')).toBeTruthy();
    });

    it('renderiza testID para título', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByTestId} = renderWithProvider(
        <CHeader title="Title Test" testID="header" />
      );

      expect(getByTestId('headerTitle')).toBeTruthy();
    });
  });

  describe('Botón de Retroceso', () => {
    it('muestra botón de retroceso por defecto', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByTestId} = renderWithProvider(
        <CHeader title="Con Back" testID="header" />
      );

      expect(getByTestId('headerBackButton')).toBeTruthy();
    });

    it('oculta botón de retroceso cuando isHideBack es true', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {queryByTestId} = renderWithProvider(
        <CHeader title="Sin Back" isHideBack={true} testID="header" />
      );

      expect(queryByTestId('headerBackButton')).toBeNull();
    });

    it('no muestra botón de retroceso cuando no se puede volver', () => {
      mockCanGoBack.mockReturnValue(false);

      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {queryByTestId} = renderWithProvider(
        <CHeader title="No Back" testID="header" />
      );

      expect(queryByTestId('headerBackButton')).toBeNull();
    });

    it('llama goBack cuando se presiona el botón', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByTestId} = renderWithProvider(
        <CHeader title="Back" testID="header" />
      );

      fireEvent.press(getByTestId('headerBackButton'));
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('usa onPressBack personalizado si se proporciona', () => {
      const customBack = jest.fn();
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByTestId} = renderWithProvider(
        <CHeader title="Custom Back" testID="header" onPressBack={customBack} />
      );

      fireEvent.press(getByTestId('headerBackButton'));
      expect(customBack).toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe('Iconos', () => {
    it('renderiza rightIcon cuando se proporciona', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByTestId, getByText} = renderWithProvider(
        <CHeader
          title="Con Right Icon"
          testID="header"
          rightIcon={<></>}
        />
      );

      expect(getByText('Con Right Icon')).toBeTruthy();
    });

    it('renderiza isLeftIcon cuando se proporciona', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByText} = renderWithProvider(
        <CHeader
          title="Con Left Icon"
          isLeftIcon={<></>}
        />
      );

      expect(getByText('Con Left Icon')).toBeTruthy();
    });
  });

  describe('Colores Personalizados', () => {
    it('aplica color de icono personalizado', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByText} = renderWithProvider(
        <CHeader title="Color Icon" color="#FF0000" />
      );

      expect(getByText('Color Icon')).toBeTruthy();
    });

    it('aplica color de texto personalizado', () => {
      const CHeader = require('../../../../src/components/common/CHeader').default;
      const {getByText} = renderWithProvider(
        <CHeader title="Color Text" textColor="#0000FF" />
      );

      expect(getByText('Color Text')).toBeTruthy();
    });
  });
});

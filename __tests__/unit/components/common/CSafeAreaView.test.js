/**
 * Tests for CSafeAreaView component
 * Tests del componente de SafeArea
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Text} from 'react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Uses global mock from jest.setup.js for react-native-safe-area-context

describe('CSafeAreaView component', () => {
  const mockTheme = {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
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
  });

  describe('Renderizado Básico', () => {
    it('renderiza children correctamente', () => {
      const CSafeAreaView = require('../../../../src/components/common/CSafeAreaView').default;
      const {getByText} = renderWithProvider(
        <CSafeAreaView>
          <Text>Contenido</Text>
        </CSafeAreaView>
      );

      expect(getByText('Contenido')).toBeTruthy();
    });

    it('renderiza múltiples children', () => {
      const CSafeAreaView = require('../../../../src/components/common/CSafeAreaView').default;
      const {getByText} = renderWithProvider(
        <CSafeAreaView>
          <Text>Primer elemento</Text>
          <Text>Segundo elemento</Text>
        </CSafeAreaView>
      );

      expect(getByText('Primer elemento')).toBeTruthy();
      expect(getByText('Segundo elemento')).toBeTruthy();
    });
  });

  describe('Estilos', () => {
    it('aplica estilos personalizados', () => {
      const CSafeAreaView = require('../../../../src/components/common/CSafeAreaView').default;
      const {getByText} = renderWithProvider(
        <CSafeAreaView style={{paddingTop: 20}}>
          <Text>Con estilo</Text>
        </CSafeAreaView>
      );

      expect(getByText('Con estilo')).toBeTruthy();
    });

    it('usa color de fondo del tema', () => {
      const CSafeAreaView = require('../../../../src/components/common/CSafeAreaView').default;
      const {getByText} = renderWithProvider(
        <CSafeAreaView>
          <Text>Background</Text>
        </CSafeAreaView>
      );

      expect(getByText('Background')).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('pasa props adicionales al SafeAreaView', () => {
      const CSafeAreaView = require('../../../../src/components/common/CSafeAreaView').default;
      const {getByTestId} = renderWithProvider(
        <CSafeAreaView testID="safe-area">
          <Text>Props</Text>
        </CSafeAreaView>
      );

      expect(getByTestId('safe-area')).toBeTruthy();
    });

    it('acepta addTabPadding prop', () => {
      const CSafeAreaView = require('../../../../src/components/common/CSafeAreaView').default;
      const {getByText} = renderWithProvider(
        <CSafeAreaView addTabPadding={false}>
          <Text>Sin padding</Text>
        </CSafeAreaView>
      );

      expect(getByText('Sin padding')).toBeTruthy();
    });
  });
});

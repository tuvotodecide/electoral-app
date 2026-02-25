/**
 * Tests for CAlert component
 * Tests del componente de alerta
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

describe('CAlert component', () => {
  const createWrapper = (isDark = false) => {
    const mockTheme = {
      dark: isDark,
      textColor: isDark ? '#FFFFFF' : '#000000',
    };

    const store = configureStore({
      reducer: {
        theme: (state = {theme: mockTheme}) => state,
      },
    });
    return ({children}) =>
      React.createElement(Provider, {store}, children);
  };

  const renderWithProvider = (component, isDark = false) => {
    return render(component, {wrapper: createWrapper(isDark)});
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado Básico', () => {
    it('renderiza el mensaje correctamente', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert message="Este es un mensaje de prueba" />
      );

      expect(getByText('Este es un mensaje de prueba')).toBeTruthy();
    });

    it('renderiza con testID', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByTestId} = renderWithProvider(
        <CAlert testID="test-alert" message="Test" />
      );

      expect(getByTestId('test-alert')).toBeTruthy();
    });

    it('renderiza testID para icono y texto', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByTestId} = renderWithProvider(
        <CAlert testID="alert" message="Mensaje" />
      );

      expect(getByTestId('alertIcon')).toBeTruthy();
      expect(getByTestId('alertText')).toBeTruthy();
    });
  });

  describe('Tipos de Alerta', () => {
    it('renderiza alerta de tipo success', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert status="success" message="Operación exitosa" />
      );

      expect(getByText('Operación exitosa')).toBeTruthy();
    });

    it('renderiza alerta de tipo error', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert status="error" message="Ha ocurrido un error" />
      );

      expect(getByText('Ha ocurrido un error')).toBeTruthy();
    });

    it('renderiza alerta de tipo warning', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert status="warning" message="Advertencia importante" />
      );

      expect(getByText('Advertencia importante')).toBeTruthy();
    });

    it('renderiza alerta de tipo info por defecto', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert message="Información" />
      );

      expect(getByText('Información')).toBeTruthy();
    });

    it('usa info para tipo desconocido', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert status="unknown" message="Default info" />
      );

      expect(getByText('Default info')).toBeTruthy();
    });
  });

  describe('Tema Oscuro', () => {
    it('aplica colores de tema oscuro', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert status="success" message="Dark mode" />,
        true // isDark
      );

      expect(getByText('Dark mode')).toBeTruthy();
    });

    it('usa colores de fondo oscuros en tema oscuro', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert status="error" message="Error dark" />,
        true
      );

      expect(getByText('Error dark')).toBeTruthy();
    });
  });

  describe('Tema Claro', () => {
    it('aplica colores de tema claro', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByText} = renderWithProvider(
        <CAlert status="warning" message="Light mode" />,
        false
      );

      expect(getByText('Light mode')).toBeTruthy();
    });
  });

  describe('Mensaje Vacío', () => {
    it('renderiza con mensaje vacío por defecto', () => {
      const CAlert = require('../../../../src/components/common/CAlert').default;
      const {getByTestId} = renderWithProvider(
        <CAlert testID="empty-alert" />
      );

      expect(getByTestId('empty-alert')).toBeTruthy();
    });
  });
});

/**
 * Tests for Icono component
 * Tests del componente de icono
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock Icon
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const {View} = require('react-native');
  return ({name, size, color, style, testID}) =>
    React.createElement(View, {
      testID: testID || `icon-${name}`,
      accessibilityLabel: `icon-${name}`,
    });
});

describe('Icono component', () => {
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
  });

  describe('Renderizado Básico', () => {
    it('renderiza icono correctamente', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="home" />
      );

      expect(getByLabelText('icon-home')).toBeTruthy();
    });

    it('renderiza con nombre diferente', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="settings" />
      );

      expect(getByLabelText('icon-settings')).toBeTruthy();
    });
  });

  describe('Tamaño', () => {
    it('usa tamaño 24 por defecto', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="check" />
      );

      expect(getByLabelText('icon-check')).toBeTruthy();
    });

    it('acepta tamaño personalizado', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="star" size={32} />
      );

      expect(getByLabelText('icon-star')).toBeTruthy();
    });

    it('acepta tamaño pequeño', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="heart" size={16} />
      );

      expect(getByLabelText('icon-heart')).toBeTruthy();
    });
  });

  describe('Color', () => {
    it('usa color del tema por defecto', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="bell" />
      );

      expect(getByLabelText('icon-bell')).toBeTruthy();
    });

    it('acepta color personalizado', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="alert" color="#FF0000" />
      );

      expect(getByLabelText('icon-alert')).toBeTruthy();
    });
  });

  describe('Estilos', () => {
    it('acepta estilos adicionales', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="menu" style={{marginRight: 10}} />
      );

      expect(getByLabelText('icon-menu')).toBeTruthy();
    });

    it('usa objeto vacío por defecto para estilos', () => {
      const Icono = require('../../../../src/components/common/Icono').default;
      const {getByLabelText} = renderWithProvider(
        <Icono name="close" />
      );

      expect(getByLabelText('icon-close')).toBeTruthy();
    });
  });

  describe('Iconos Comunes', () => {
    const iconNames = [
      'account',
      'lock',
      'email',
      'phone',
      'camera',
      'image',
      'document',
      'folder',
    ];

    iconNames.forEach(name => {
      it(`renderiza icono ${name}`, () => {
        const Icono = require('../../../../src/components/common/Icono').default;
        const {getByLabelText} = renderWithProvider(
          <Icono name={name} />
        );

        expect(getByLabelText(`icon-${name}`)).toBeTruthy();
      });
    });
  });
});

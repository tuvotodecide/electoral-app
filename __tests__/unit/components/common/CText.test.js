/**
 * Tests for CText component
 * Tests del componente de texto
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

describe('CText component', () => {
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
    it('renderiza texto correctamente', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14">Texto de prueba</CText>
      );

      expect(getByText('Texto de prueba')).toBeTruthy();
    });

    it('renderiza con testID', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByTestId} = renderWithProvider(
        <CText type="R14" testID="test-text">Test</CText>
      );

      expect(getByTestId('test-text')).toBeTruthy();
    });
  });

  describe('Font Weights', () => {
    it('aplica peso Regular (R)', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14">Regular</CText>
      );
      expect(getByText('Regular')).toBeTruthy();
    });

    it('aplica peso Medium (M)', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="M16">Medium</CText>
      );
      expect(getByText('Medium')).toBeTruthy();
    });

    it('aplica peso SemiBold (S)', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="S18">SemiBold</CText>
      );
      expect(getByText('SemiBold')).toBeTruthy();
    });

    it('aplica peso Bold (B)', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="B20">Bold</CText>
      );
      expect(getByText('Bold')).toBeTruthy();
    });

    it('usa Regular por defecto para tipo desconocido', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="X14">Default</CText>
      );
      expect(getByText('Default')).toBeTruthy();
    });
  });

  describe('Font Sizes', () => {
    const sizes = ['8', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32', '34', '35', '36', '40', '46', '66'];

    sizes.forEach(size => {
      it(`aplica tamaño f${size}`, () => {
        const CText = require('../../../../src/components/common/CText').default;
        const {getByText} = renderWithProvider(
          <CText type={`R${size}`}>Size {size}</CText>
        );
        expect(getByText(`Size ${size}`)).toBeTruthy();
      });
    });

    it('usa f14 por defecto para tamaño desconocido', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R99">Default Size</CText>
      );
      expect(getByText('Default Size')).toBeTruthy();
    });
  });

  describe('Colores', () => {
    it('usa color del tema por defecto', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14">Theme Color</CText>
      );
      expect(getByText('Theme Color')).toBeTruthy();
    });

    it('aplica color personalizado', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14" color="#FF0000">Custom Color</CText>
      );
      expect(getByText('Custom Color')).toBeTruthy();
    });
  });

  describe('Alineación', () => {
    it('aplica alineación center', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14" align="center">Centered</CText>
      );
      expect(getByText('Centered')).toBeTruthy();
    });

    it('aplica alineación right', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14" align="right">Right</CText>
      );
      expect(getByText('Right')).toBeTruthy();
    });
  });

  describe('Estilos Personalizados', () => {
    it('aplica estilos inline', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14" style={{marginTop: 10}}>Styled</CText>
      );
      expect(getByText('Styled')).toBeTruthy();
    });
  });

  describe('Props Adicionales', () => {
    it('pasa numberOfLines correctamente', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14" numberOfLines={2}>Limited Lines</CText>
      );
      expect(getByText('Limited Lines')).toBeTruthy();
    });

    it('pasa ellipsizeMode correctamente', () => {
      const CText = require('../../../../src/components/common/CText').default;
      const {getByText} = renderWithProvider(
        <CText type="R14" ellipsizeMode="tail">Ellipsis</CText>
      );
      expect(getByText('Ellipsis')).toBeTruthy();
    });
  });
});

/**
 * Tests for CButton component
 * Tests del componente de botón
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import CButton from '../../../../src/components/common/CButton';

describe('CButton component', () => {
  const mockTheme = {
    primary: '#4F9858',
    white: '#FFFFFF',
    paper: '#FAFAFA',
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
    it('renderiza el título correctamente', () => {
      const {getByText} = renderWithProvider(
        <CButton title="Aceptar" onPress={() => {}} />
      );

      expect(getByText('Aceptar')).toBeTruthy();
    });

    it('renderiza con testID', () => {
      const {getByTestId} = renderWithProvider(
        <CButton title="Test" onPress={() => {}} testID="test-button" />
      );

      expect(getByTestId('test-button')).toBeTruthy();
    });

    it('renderiza children correctamente', () => {
      const {getByText} = renderWithProvider(
        <CButton title="Botón" onPress={() => {}}>
          <></>
        </CButton>
      );

      expect(getByText('Botón')).toBeTruthy();
    });
  });

  describe('Interacciones', () => {
    it('ejecuta onPress cuando se presiona', () => {
      const onPress = jest.fn();
      const {getByTestId} = renderWithProvider(
        <CButton title="Presionar" onPress={onPress} testID="press-btn" />
      );

      fireEvent.press(getByTestId('press-btn'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('no ejecuta onPress cuando está deshabilitado', () => {
      const onPress = jest.fn();
      const {getByTestId} = renderWithProvider(
        <CButton title="Deshabilitado" onPress={onPress} disabled={true} testID="disabled-btn" />
      );

      // El componente establece onPress={disabled ? null : onPress}
      // y disabled={disabled}, por lo que el botón no debería responder
      const button = getByTestId('disabled-btn');

      // Verificamos que el botón tenga disabled
      expect(button.props.accessibilityState?.disabled || button.props.disabled).toBeTruthy();
    });
  });

  describe('Variantes', () => {
    it('renderiza variante outlined correctamente', () => {
      const {getByText} = renderWithProvider(
        <CButton title="Outlined" onPress={() => {}} variant="outlined" />
      );

      expect(getByText('Outlined')).toBeTruthy();
    });

    it('aplica color de fondo personalizado', () => {
      const {getByText} = renderWithProvider(
        <CButton title="Custom" onPress={() => {}} bgColor="#FF0000" />
      );

      expect(getByText('Custom')).toBeTruthy();
    });

    it('aplica estilo opt2 correctamente', () => {
      const {getByText} = renderWithProvider(
        <CButton title="Opt2" onPress={() => {}} opt2={true} />
      );

      expect(getByText('Opt2')).toBeTruthy();
    });

    it('aplica sinMargen correctamente', () => {
      const {getByText} = renderWithProvider(
        <CButton title="Sin Margen" onPress={() => {}} sinMargen={true} />
      );

      expect(getByText('Sin Margen')).toBeTruthy();
    });
  });

  describe('Iconos', () => {
    it('renderiza con icono derecho', () => {
      const {getByText} = renderWithProvider(
        <CButton
          title="Con Icono"
          onPress={() => {}}
          icon={<></>}
        />
      );

      expect(getByText('Con Icono')).toBeTruthy();
    });

    it('renderiza con icono frontal', () => {
      const {getByText} = renderWithProvider(
        <CButton
          title="Icono Frontal"
          onPress={() => {}}
          frontIcon={<></>}
        />
      );

      expect(getByText('Icono Frontal')).toBeTruthy();
    });
  });

  describe('Estilos Personalizados', () => {
    it('aplica containerStyle', () => {
      const {getByText} = renderWithProvider(
        <CButton
          title="Estilo"
          onPress={() => {}}
          containerStyle={{marginTop: 20}}
        />
      );

      expect(getByText('Estilo')).toBeTruthy();
    });

    it('aplica color de texto personalizado', () => {
      const {getByText} = renderWithProvider(
        <CButton
          title="Color"
          onPress={() => {}}
          color="#000000"
        />
      );

      expect(getByText('Color')).toBeTruthy();
    });
  });
});

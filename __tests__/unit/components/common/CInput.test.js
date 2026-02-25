/**
 * Tests for CInput component
 * Tests del componente de input
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

describe('CInput component', () => {
  const mockTheme = {
    textColor: '#000000',
    grayScale400: '#9E9E9E',
    grayScale500: '#757575',
    inputBackground: '#F5F5F5',
    alertColor: '#F44336',
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
    it('renderiza input correctamente', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Escribe aquí"
          toGetTextFieldValue={() => {}}
        />
      );

      expect(getByPlaceholderText('Escribe aquí')).toBeTruthy();
    });

    it('renderiza con testID', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByTestId} = renderWithProvider(
        <CInput
          testID="test-input"
          placeHolder="Test"
          toGetTextFieldValue={() => {}}
        />
      );

      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('renderiza label correctamente', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByText} = renderWithProvider(
        <CInput
          label="Nombre"
          placeHolder="Ingresa tu nombre"
          toGetTextFieldValue={() => {}}
        />
      );

      expect(getByText('Nombre')).toBeTruthy();
    });

    it('muestra asterisco cuando es requerido', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByText} = renderWithProvider(
        <CInput
          label="Email"
          required={true}
          placeHolder="Email"
          toGetTextFieldValue={() => {}}
        />
      );

      expect(getByText(' *')).toBeTruthy();
    });
  });

  describe('Cambio de Valor', () => {
    it('llama toGetTextFieldValue cuando cambia el texto', () => {
      const onChangeText = jest.fn();
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Escribe"
          toGetTextFieldValue={onChangeText}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Escribe'), 'Nuevo texto');
      expect(onChangeText).toHaveBeenCalledWith('Nuevo texto');
    });

    it('muestra valor inicial', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByDisplayValue} = renderWithProvider(
        <CInput
          _value="Valor inicial"
          placeHolder="Placeholder"
          toGetTextFieldValue={() => {}}
        />
      );

      expect(getByDisplayValue('Valor inicial')).toBeTruthy();
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra mensaje de error', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByText} = renderWithProvider(
        <CInput
          placeHolder="Input"
          toGetTextFieldValue={() => {}}
          _errorText="Campo requerido"
        />
      );

      expect(getByText('Campo requerido')).toBeTruthy();
    });

    it('no muestra error cuando está vacío', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {queryByText} = renderWithProvider(
        <CInput
          placeHolder="Input"
          toGetTextFieldValue={() => {}}
          _errorText=""
        />
      );

      expect(queryByText('Campo requerido')).toBeNull();
    });
  });

  describe('Contraseña Segura', () => {
    it('oculta contraseña por defecto cuando isSecure es true', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Contraseña"
          toGetTextFieldValue={() => {}}
          isSecure={true}
          testID="password-input"
        />
      );

      const input = getByPlaceholderText('Contraseña');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('alterna visibilidad de contraseña', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText, getByTestId} = renderWithProvider(
        <CInput
          placeHolder="Contraseña"
          toGetTextFieldValue={() => {}}
          isSecure={true}
          testID="password-input"
        />
      );

      // Inicialmente oculto
      expect(getByPlaceholderText('Contraseña').props.secureTextEntry).toBe(true);

      // Toggle visibility
      fireEvent.press(getByTestId('password-input_togglePassword'));
      expect(getByPlaceholderText('Contraseña').props.secureTextEntry).toBe(false);
    });
  });

  describe('Estados', () => {
    it('deshabilita edición cuando _editable es false', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="No editable"
          toGetTextFieldValue={() => {}}
          _editable={false}
        />
      );

      expect(getByPlaceholderText('No editable').props.editable).toBe(false);
    });

    it('aplica maxLength correctamente', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Limited"
          toGetTextFieldValue={() => {}}
          _maxLength={10}
        />
      );

      expect(getByPlaceholderText('Limited').props.maxLength).toBe(10);
    });

    it('muestra error de maxLength excedido', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByText} = renderWithProvider(
        <CInput
          placeHolder="Limited"
          _value="Este texto es muy largo"
          toGetTextFieldValue={() => {}}
          _maxLength={10}
          showError={true}
        />
      );

      expect(getByText('It should be maximum 10 character')).toBeTruthy();
    });
  });

  describe('Multiline', () => {
    it('renderiza como multiline', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Descripción"
          toGetTextFieldValue={() => {}}
          multiline={true}
        />
      );

      expect(getByPlaceholderText('Descripción').props.multiline).toBe(true);
    });
  });

  describe('Callbacks', () => {
    it('llama _onFocus cuando recibe foco', () => {
      const onFocus = jest.fn();
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Focus"
          toGetTextFieldValue={() => {}}
          _onFocus={onFocus}
        />
      );

      fireEvent(getByPlaceholderText('Focus'), 'focus');
      expect(onFocus).toHaveBeenCalled();
    });

    it('llama _onBlur cuando pierde foco', () => {
      const onBlur = jest.fn();
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Blur"
          toGetTextFieldValue={() => {}}
          _onBlur={onBlur}
        />
      );

      fireEvent(getByPlaceholderText('Blur'), 'blur');
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Accesorios', () => {
    it('renderiza insideLeftIcon', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Con icono"
          toGetTextFieldValue={() => {}}
          insideLeftIcon={() => <></>}
        />
      );

      expect(getByPlaceholderText('Con icono')).toBeTruthy();
    });

    it('renderiza rightAccessory', () => {
      const CInput = require('../../../../src/components/common/CInput').default;
      const {getByPlaceholderText} = renderWithProvider(
        <CInput
          placeHolder="Con accesorio"
          toGetTextFieldValue={() => {}}
          rightAccessory={() => <></>}
        />
      );

      expect(getByPlaceholderText('Con accesorio')).toBeTruthy();
    });
  });
});

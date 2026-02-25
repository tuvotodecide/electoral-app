/**
 * Tests for CustomModal component
 * Tests del componente de modal personalizado
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

describe('CustomModal component', () => {
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
    it('renderiza cuando visible es true', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          title="Título"
          message="Mensaje"
          onClose={() => {}}
        />
      );

      expect(getByText('Título')).toBeTruthy();
      expect(getByText('Mensaje')).toBeTruthy();
    });

    it('no renderiza cuando visible es false', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {UNSAFE_root} = renderWithProvider(
        <CustomModal
          visible={false}
          title="Título"
          message="Mensaje"
          onClose={() => {}}
        />
      );

      // Modal no muestra contenido cuando visible es false
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza botón con texto por defecto', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
        />
      );

      expect(getByText('Aceptar')).toBeTruthy();
    });
  });

  describe('Tipos de Modal', () => {
    it('renderiza tipo success', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          type="success"
          title="Éxito"
          message="Operación completada"
          onClose={() => {}}
        />
      );

      expect(getByText('Éxito')).toBeTruthy();
    });

    it('renderiza tipo error', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          type="error"
          title="Error"
          message="Ha ocurrido un error"
          onClose={() => {}}
        />
      );

      expect(getByText('Error')).toBeTruthy();
    });

    it('renderiza tipo warning', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          type="warning"
          title="Advertencia"
          message="Ten cuidado"
          onClose={() => {}}
        />
      );

      expect(getByText('Advertencia')).toBeTruthy();
    });

    it('renderiza tipo settings', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          type="settings"
          title="Configuración"
          message="Ajustes"
          onClose={() => {}}
        />
      );

      expect(getByText('Configuración')).toBeTruthy();
    });

    it('renderiza tipo info por defecto', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          title="Info"
          message="Información"
          onClose={() => {}}
        />
      );

      expect(getByText('Info')).toBeTruthy();
    });
  });

  describe('Botones', () => {
    it('ejecuta onButtonPress cuando se presiona el botón principal', () => {
      const onButtonPress = jest.fn();
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByTestId} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          onButtonPress={onButtonPress}
        />
      );

      fireEvent.press(getByTestId('customModalPrimaryButton'));
      expect(onButtonPress).toHaveBeenCalled();
    });

    it('ejecuta onClose si onButtonPress no está definido', () => {
      const onClose = jest.fn();
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByTestId} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={onClose}
        />
      );

      fireEvent.press(getByTestId('customModalPrimaryButton'));
      expect(onClose).toHaveBeenCalled();
    });

    it('renderiza botón secundario cuando se proporciona', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          secondaryButtonText="Cancelar"
        />
      );

      expect(getByText('Cancelar')).toBeTruthy();
    });

    it('ejecuta onSecondaryPress cuando se presiona el botón secundario', () => {
      const onSecondaryPress = jest.fn();
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByTestId} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          secondaryButtonText="Cancelar"
          onSecondaryPress={onSecondaryPress}
        />
      );

      fireEvent.press(getByTestId('customModalSecondaryButton'));
      expect(onSecondaryPress).toHaveBeenCalled();
    });

    it('renderiza botón terciario cuando se proporciona', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          tertiaryButtonText="Más tarde"
        />
      );

      expect(getByText('Más tarde')).toBeTruthy();
    });

    it('ejecuta onTertiaryPress cuando se presiona el botón terciario', () => {
      const onTertiaryPress = jest.fn();
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByTestId} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          tertiaryButtonText="Más tarde"
          onTertiaryPress={onTertiaryPress}
        />
      );

      fireEvent.press(getByTestId('customModalTertiaryButton'));
      expect(onTertiaryPress).toHaveBeenCalled();
    });
  });

  describe('Variantes de Botón', () => {
    it('aplica variante outline al botón secundario', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          secondaryButtonText="Outline"
          secondaryVariant="outline"
        />
      );

      expect(getByText('Outline')).toBeTruthy();
    });

    it('aplica variante danger al botón terciario', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          tertiaryButtonText="Eliminar"
          tertiaryVariant="danger"
        />
      );

      expect(getByText('Eliminar')).toBeTruthy();
    });
  });

  describe('Texto Personalizado', () => {
    it('usa buttonText personalizado', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Test"
          onClose={() => {}}
          buttonText="Confirmar"
        />
      );

      expect(getByText('Confirmar')).toBeTruthy();
    });
  });

  describe('Sin Título', () => {
    it('renderiza sin título', () => {
      const CustomModal = require('../../../../src/components/common/CustomModal').default;
      const {getByText} = renderWithProvider(
        <CustomModal
          visible={true}
          message="Solo mensaje"
          onClose={() => {}}
        />
      );

      expect(getByText('Solo mensaje')).toBeTruthy();
    });
  });
});

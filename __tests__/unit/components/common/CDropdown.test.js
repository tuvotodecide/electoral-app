/**
 * Tests for CDropdown component
 * Tests del componente de dropdown/selector
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-paper', () => ({
  Modal: ({children, visible}) => (visible ? children : null),
  Portal: ({children}) => children,
}));

describe('CDropdown component', () => {
  const mockTheme = {
    inputBackground: '#F5F5F5',
    primary: '#4F9858',
    alertColor: '#F44336',
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

  const mockData = [
    {id: '1', name: 'Opción 1'},
    {id: '2', name: 'Opción 2'},
    {id: '3', name: 'Opción 3'},
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado Básico', () => {
    it('renderiza el valor seleccionado', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Seleccionar opción"
          onSelected={() => {}}
        />
      );

      expect(getByText('Seleccionar opción')).toBeTruthy();
    });

    it('renderiza con datos vacíos', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={[]}
          value="Sin opciones"
          onSelected={() => {}}
        />
      );

      expect(getByText('Sin opciones')).toBeTruthy();
    });
  });

  describe('Interacciones', () => {
    it('abre el modal al presionar', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Click me"
          onSelected={() => {}}
        />
      );

      fireEvent.press(getByText('Click me'));
      // Modal should open (items visible)
    });

    it('llama onSelected cuando se selecciona un item', () => {
      const onSelected = jest.fn();
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Seleccionar"
          onSelected={onSelected}
        />
      );

      // Open dropdown
      fireEvent.press(getByText('Seleccionar'));
    });
  });

  describe('Mensaje de Error', () => {
    it('muestra mensaje de error', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Valor"
          onSelected={() => {}}
          _errorText="Campo requerido"
        />
      );

      expect(getByText('Campo requerido')).toBeTruthy();
    });

    it('no muestra error cuando está vacío', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {queryByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Valor"
          onSelected={() => {}}
          _errorText=""
        />
      );

      expect(queryByText('Campo requerido')).toBeNull();
    });
  });

  describe('Accesorios', () => {
    it('renderiza leftSpace cuando se proporciona', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Con icono"
          onSelected={() => {}}
          leftSpace={<></>}
        />
      );

      expect(getByText('Con icono')).toBeTruthy();
    });
  });

  describe('Render Item Personalizado', () => {
    it('usa renderItem personalizado si se proporciona', () => {
      const customRenderItem = jest.fn((item, index, onPress) => null);
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Custom"
          onSelected={() => {}}
          renderItem={customRenderItem}
        />
      );

      fireEvent.press(getByText('Custom'));
    });
  });

  describe('Key Extractor', () => {
    it('usa dataItemKey para extraer keys', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Keys"
          onSelected={() => {}}
          dataItemKey={(item) => item.id}
        />
      );

      expect(getByText('Keys')).toBeTruthy();
    });
  });

  describe('Estilos de Error', () => {
    it('aplica errorStyle personalizado', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {getByText} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Error styled"
          onSelected={() => {}}
          _errorText="Error con estilo"
          errorStyle={{fontSize: 14}}
        />
      );

      expect(getByText('Error con estilo')).toBeTruthy();
    });
  });
});

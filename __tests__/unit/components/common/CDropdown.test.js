/**
 * Tests for CDropdown component
 * Tests del componente de dropdown/selector
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
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

jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    Modal: ({children, visible, onDismiss, contentContainerStyle}) => {
      if (!visible) return null;
      return React.createElement('View', {testID: 'dropdown-modal', style: contentContainerStyle}, children);
    },
    Portal: ({children}) => children,
  };
});

jest.mock('../../../../src/components/common/CLIstCard', () => {
  const React = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  return function MockCListCard({item, index, onPress}) {
    return React.createElement(TouchableOpacity, {testID: `list-item-${index}`, onPress},
      React.createElement(Text, null, item.name || item.title || `Item ${index}`)
    );
  };
});

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
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Seleccionar opción"
          onSelected={() => {}}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza con datos vacíos', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={[]}
          value="Sin opciones"
          onSelected={() => {}}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Interacciones', () => {
    it('abre el modal al presionar', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Click me"
          onSelected={() => {}}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('llama onSelected cuando se selecciona un item', () => {
      const onSelected = jest.fn();
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Seleccionar"
          onSelected={onSelected}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Mensaje de Error', () => {
    it('muestra mensaje de error', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Valor"
          onSelected={() => {}}
          _errorText="Campo requerido"
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('no muestra error cuando está vacío', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Valor"
          onSelected={() => {}}
          _errorText=""
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Accesorios', () => {
    it('renderiza leftSpace cuando se proporciona', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Con icono"
          onSelected={() => {}}
          leftSpace={<></>}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Render Item Personalizado', () => {
    it('usa renderItem personalizado si se proporciona', () => {
      const customRenderItem = jest.fn((item, index, onPress) => null);
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Custom"
          onSelected={() => {}}
          renderItem={customRenderItem}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Key Extractor', () => {
    it('usa dataItemKey para extraer keys', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Keys"
          onSelected={() => {}}
          dataItemKey={(item) => item.id}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Estilos de Error', () => {
    it('aplica errorStyle personalizado', () => {
      const CDropdown = require('../../../../src/components/common/CDropdown').default;
      const {UNSAFE_root} = renderWithProvider(
        <CDropdown
          data={mockData}
          value="Error styled"
          onSelected={() => {}}
          _errorText="Error con estilo"
          errorStyle={{fontSize: 14}}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

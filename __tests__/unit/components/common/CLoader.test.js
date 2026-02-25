/**
 * Tests for CLoader component
 * Tests del componente de loader/spinner
 */

import React from 'react';
import {render} from '@testing-library/react-native';

// Mock useIsFocused
const mockIsFocused = jest.fn(() => true);

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockIsFocused(),
}));

describe('CLoader component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused.mockReturnValue(true);
  });

  describe('Renderizado', () => {
    it('renderiza cuando la pantalla está enfocada', () => {
      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {UNSAFE_root} = render(<CLoader />);

      // Verify the component renders with Modal
      expect(UNSAFE_root).toBeTruthy();
    });

    it('no renderiza contenido cuando la pantalla no está enfocada', () => {
      mockIsFocused.mockReturnValue(false);

      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {UNSAFE_root} = render(<CLoader />);

      // Should render an empty View
      expect(UNSAFE_root.type).toBe('View');
    });
  });

  describe('Estado de Focus', () => {
    it('muestra el loader cuando isFocused es true', () => {
      mockIsFocused.mockReturnValue(true);

      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {UNSAFE_root} = render(<CLoader />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('oculta el loader cuando isFocused es false', () => {
      mockIsFocused.mockReturnValue(false);

      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {UNSAFE_root} = render(<CLoader />);

      // When not focused, renders an empty View
      expect(UNSAFE_root.type).toBe('View');
      expect(UNSAFE_root.children).toBeNull();
    });
  });

  describe('Memoization', () => {
    it('está memoizado con React.memo', () => {
      const CLoader = require('../../../../src/components/common/CLoader').default;

      // React.memo wraps the component
      expect(CLoader.$$typeof).toBeDefined();
    });
  });
});

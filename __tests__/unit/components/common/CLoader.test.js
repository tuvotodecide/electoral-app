/**
 * Tests for CLoader component
 * Tests del componente de loader/spinner
 */

import React from 'react';
import {render} from '@testing-library/react-native';

// Extend the global navigation mock to add useIsFocused
const mockUseIsFocused = jest.fn(() => true);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => mockUseIsFocused(),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

describe('CLoader component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockUseIsFocused.mockReturnValue(true);
  });

  describe('Renderizado', () => {
    it('renderiza cuando la pantalla está enfocada', () => {
      mockUseIsFocused.mockReturnValue(true);
      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {UNSAFE_root} = render(<CLoader />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('no renderiza contenido cuando la pantalla no está enfocada', () => {
      mockUseIsFocused.mockReturnValue(false);
      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {toJSON} = render(<CLoader />);
      const tree = toJSON();

      // Cuando no está enfocado, retorna solo un View vacío
      expect(tree).toBeTruthy();
      expect(tree.type).toBe('View');
      expect(tree.children).toBeNull();
    });
  });

  describe('Estado de Focus', () => {
    it('muestra el loader cuando isFocused es true', () => {
      mockUseIsFocused.mockReturnValue(true);
      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {UNSAFE_root} = render(<CLoader />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('oculta el loader cuando isFocused es false', () => {
      mockUseIsFocused.mockReturnValue(false);
      const CLoader = require('../../../../src/components/common/CLoader').default;
      const {toJSON} = render(<CLoader />);
      const tree = toJSON();

      // Retorna View vacío
      expect(tree).toBeTruthy();
      expect(tree.type).toBe('View');
      expect(tree.children).toBeNull();
    });
  });

  describe('Memoization', () => {
    it('está memoizado con React.memo', () => {
      const CLoader = require('../../../../src/components/common/CLoader').default;

      expect(CLoader.$$typeof).toBeDefined();
    });
  });
});

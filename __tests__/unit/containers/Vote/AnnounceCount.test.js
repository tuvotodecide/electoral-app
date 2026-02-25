/**
 * Tests for AnnounceCount screen
 * Tests de pantalla de anuncio de conteo
 */

import React from 'react';
import {render} from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
  }),
}));

describe('AnnounceCount screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Navegación', () => {
    it('navega a SearchCountTable inmediatamente con locationId', () => {
      const AnnounceCount = require('../../../../src/container/Vote/AnnounceCount/AnnounceCount').default;

      render(
        <AnnounceCount
          navigation={{replace: mockReplace}}
          route={{
            params: {
              locationId: 'loc123',
              locationData: {name: 'Test Location'},
            },
          }}
        />
      );

      expect(mockReplace).toHaveBeenCalledWith('SearchCountTable', {
        locationId: 'loc123',
        locationData: {name: 'Test Location'},
      });
    });

    it('navega a SearchCountTable sin parámetros cuando no hay locationId', () => {
      const AnnounceCount = require('../../../../src/container/Vote/AnnounceCount/AnnounceCount').default;

      render(
        <AnnounceCount
          navigation={{replace: mockReplace}}
          route={{params: {}}}
        />
      );

      expect(mockReplace).toHaveBeenCalledWith('SearchCountTable');
    });

    it('navega a SearchCountTable cuando route.params es undefined', () => {
      const AnnounceCount = require('../../../../src/container/Vote/AnnounceCount/AnnounceCount').default;

      render(
        <AnnounceCount
          navigation={{replace: mockReplace}}
          route={{}}
        />
      );

      expect(mockReplace).toHaveBeenCalledWith('SearchCountTable');
    });
  });

  describe('Renderizado', () => {
    it('retorna null (no renderiza nada)', () => {
      const AnnounceCount = require('../../../../src/container/Vote/AnnounceCount/AnnounceCount').default;

      const {toJSON} = render(
        <AnnounceCount
          navigation={{replace: mockReplace}}
          route={{params: {}}}
        />
      );

      expect(toJSON()).toBeNull();
    });
  });
});

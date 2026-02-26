import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import InstructionsContainer from '../../../../src/components/common/InstructionsContainer';
import NavigationDebugOverlay from '../../../../src/components/common/NavigationDebugOverlay';
import {FirebaseDebugInfo} from '../../../../src/components/common/FirebaseDebugInfo';
import NearbyTablesList from '../../../../src/components/common/NearbyTablesList';
import {renderWithProviders} from '../../../setup/test-utils';

jest.mock('@react-navigation/native', () => ({
  useNavigationState: (selector) =>
    selector({
      routes: [{name: 'Home', params: {}}],
      index: 0,
    }),
  NavigationContainer: ({children}) => children,
  createNavigationContainerRef: () => ({
    current: null,
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

describe('componentes comunes varios', () => {
  it('InstructionsContainer muestra texto', () => {
    const {getByText} = renderWithProviders(
      <InstructionsContainer text="Instrucciones" />,
    );
    expect(getByText('Instrucciones')).toBeTruthy();
  });

  it('NavigationDebugOverlay muestra ruta actual', () => {
    const {getByText} = renderWithProviders(
      <NavigationDebugOverlay position="top-left" />,
    );
    expect(getByText(/Home/)).toBeTruthy();
  });

  it('FirebaseDebugInfo muestra estado sin usuario', () => {
    const {getByText} = renderWithProviders(<FirebaseDebugInfo />, {
      initialState: {wallet: {payload: {}}},
    });
    expect(getByText('No hay usuario autenticado')).toBeTruthy();
  });

  it('NearbyTablesList filtra y selecciona', () => {
    const onSelect = jest.fn();
    const {getByText} = renderWithProviders(
      <NearbyTablesList
        visible={true}
        loading={false}
        tables={[{id: 1, numero: '10', codigo: 'A', colegio: 'Colegio'}]}
        onSelect={onSelect}
        onClose={jest.fn()}
        colors={{
          backgroundColor: '#fff',
          textColor: '#111',
          grayScale500: '#666',
          primary: '#0f0',
        }}
      />,
    );
    fireEvent.press(getByText('10 - Colegio'));
    expect(onSelect).toHaveBeenCalled();
  });
});

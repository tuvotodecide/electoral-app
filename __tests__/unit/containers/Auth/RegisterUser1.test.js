import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser1 from '../../../../src/container/Auth/RegisterUser1';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({testID, ...props}) => React.createElement('Ionicons', {testID, ...props});
});

describe('RegisterUser1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza y mantiene deshabilitado continuar antes de aceptar términos', () => {
    const {getByTestId} = renderWithProviders(
      <RegisterUser1 navigation={mockNavigation} route={{}} />,
    );

    expect(getByTestId('registerUser1Container')).toBeTruthy();
    expect(getByTestId('registerUser1ContinueButton').props.disabled).toBe(true);
    expect(getByTestId('termsCheckboxIcon').props.name).toBe('square-outline');
  });

  it('habilita continuar después de marcar términos', () => {
    const {getByTestId} = renderWithProviders(
      <RegisterUser1 navigation={mockNavigation} route={{}} />,
    );

    fireEvent.press(getByTestId('termsCheckbox'));

    expect(getByTestId('termsCheckboxIcon').props.name).toBe('checkbox');
    expect(getByTestId('registerUser1ContinueButton').props.disabled).toBe(false);
  });

  it('abre la pantalla de términos desde el enlace', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser1 navigation={localNavigation} route={{}} />,
    );

    fireEvent.press(getByTestId('termsLink'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(StackNav.TermsAndCondition);
  });

  it('navega a RegisterUser2 cuando el usuario acepta términos', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser1 navigation={localNavigation} route={{}} />,
    );

    fireEvent.press(getByTestId('termsCheckbox'));
    fireEvent.press(getByTestId('registerUser1ContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser2);
  });

  it('conserva parámetros de recuperación al navegar a RegisterUser2', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {isRecovery: true, dni: '12345678'}};
    const {getByTestId} = renderWithProviders(
      <RegisterUser1 navigation={localNavigation} route={route} />,
    );

    expect(getByTestId('registerUser1Step3Icon')).toBeTruthy();

    fireEvent.press(getByTestId('termsCheckbox'));
    fireEvent.press(getByTestId('registerUser1ContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser2, route.params);
  });
});

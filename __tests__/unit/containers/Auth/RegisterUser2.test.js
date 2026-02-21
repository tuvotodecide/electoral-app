import React from 'react';
import {fireEvent, waitFor, act} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser2 from '../../../../src/container/Auth/RegisterUser2';
import {REVIEW_DNI} from '../../../../src/config/review';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RegisterUser2', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('renderiza la pantalla base y el boton de continuar', () => {
    const {getByTestId} = renderWithProviders(
      <RegisterUser2 navigation={mockNavigation} route={{params: {}}} />,
    );

    expect(getByTestId('registerUser2Container')).toBeTruthy();
    expect(getByTestId('continueVerificationButton')).toBeTruthy();
  });

  it('habilita continuar solo cuando hay DNI y ambas imagenes cargadas', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser2 navigation={localNavigation} route={{params: {}}} />,
    );

    expect(getByTestId('continueVerificationButton').props.disabled).toBe(true);

    fireEvent.changeText(getByTestId('idNumberInput'), '12345678');
    fireEvent.press(getByTestId('frontCardUpload_imageBox'));
    fireEvent.press(getByTestId('backCardUpload_imageBox'));

    await waitFor(() => {
      expect(getByTestId('continueVerificationButton').props.disabled).toBe(false);
    });
  });

  it('navega a RegisterUser3 cuando el formulario es valido', async () => {
    jest.useFakeTimers();
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser2 navigation={localNavigation} route={{params: {}}} />,
    );

    fireEvent.changeText(getByTestId('idNumberInput'), '12345678');
    fireEvent.press(getByTestId('frontCardUpload_imageBox'));
    fireEvent.press(getByTestId('backCardUpload_imageBox'));

    await waitFor(() => {
      expect(getByTestId('continueVerificationButton').props.disabled).toBe(false);
    });

    fireEvent.press(getByTestId('continueVerificationButton'));
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(
        AuthNav.RegisterUser3,
        expect.objectContaining({
          dni: '12345678',
          frontImage: expect.any(Object),
          backImage: expect.any(Object),
          isRecovery: false,
        }),
      );
    });

    jest.useRealTimers();
  });

  it('si ingresa el DNI de revision redirige a TabNavigation', async () => {
    const localNavigation = {...mockNavigation, reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser2 navigation={localNavigation} route={{params: {}}} />,
    );

    fireEvent.changeText(getByTestId('idNumberInput'), REVIEW_DNI);

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    });
  });
});

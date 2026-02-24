import React from 'react';
import {Alert} from 'react-native';
import {fireEvent, waitFor, act} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser2 from '../../../../src/container/Auth/RegisterUser2';
import {REVIEW_DNI} from '../../../../src/config/review';
import String from '../../../../src/i18n/String';
import wira from 'wira-sdk';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RegisterUser2', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('si el DNI ya existe en registro muestra modal y redirige a SelectRecuperation', async () => {
    jest.useFakeTimers();
    new wira.RegistryApi().registryCheckByDni.mockResolvedValueOnce({exists: true});
    const localNavigation = {...mockNavigation, reset: jest.fn()};
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
      expect(getByTestId('simpleModalOkBtn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('simpleModalOkBtn'));

    expect(localNavigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [{name: AuthNav.Connect}, {name: AuthNav.SelectRecuperation}],
    });
  });

  it('si es recovery y no existe DNI muestra modal y redirige a RegisterUser1', async () => {
    jest.useFakeTimers();
    new wira.RegistryApi().registryCheckByDni.mockResolvedValueOnce({exists: false});
    const localNavigation = {...mockNavigation, reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser2 navigation={localNavigation} route={{params: {isRecovery: true}}} />,
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
      expect(getByTestId('simpleModalOkBtn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('simpleModalOkBtn'));

    expect(localNavigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [{name: AuthNav.Connect}, {name: AuthNav.RegisterUser1}],
    });
  });

  it('si registryCheckByDni falla con Network Error muestra alerta de red', async () => {
    jest.useFakeTimers();
    new wira.RegistryApi().registryCheckByDni.mockRejectedValueOnce(new Error('Network Error'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const {getByTestId} = renderWithProviders(
      <RegisterUser2 navigation={mockNavigation} route={{params: {}}} />,
    );

    fireEvent.changeText(getByTestId('idNumberInput'), '12345678');
    fireEvent(getByTestId('idNumberInput'), 'onEndEditing');

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(String.error, String.networkError);
    });

    alertSpy.mockRestore();
  });
});

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import String from '../../../../src/i18n/String';
import Login from '../../../../src/container/Auth/Login';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import {setAuthToken} from '../../../../src/utils/AsyncStorage';

jest.mock('../../../../src/utils/Validation', () => ({
  validateEmail: jest.fn(() => ({msg: ''})),
  validPassword: jest.fn(() => ({msg: ''})),
}));

jest.mock('../../../../src/utils/AsyncStorage', () => ({
  setAuthToken: jest.fn(async () => undefined),
}));

jest.mock('../../../../src/api/constant', () => ({
  socialIcon: [
    {name: 'Google', icon: null},
    {name: 'Apple', icon: null},
  ],
}));

jest.mock('../../../../src/assets/svg', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');
  return {
    Splash_Dark: ({testID}) => ReactLib.createElement(View, {testID}),
    Splash_Light: ({testID}) => ReactLib.createElement(View, {testID}),
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const ReactLib = require('react');
  return ({testID, ...props}) =>
    ReactLib.createElement('Ionicons', {
      testID,
      ...props,
    });
});

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza pantalla de login con elementos principales', () => {
    const {getByTestId} = renderWithProviders(<Login navigation={mockNavigation} />);

    expect(getByTestId('loginContainer')).toBeTruthy();
    expect(getByTestId('welcomeBackTitle')).toBeTruthy();
    expect(getByTestId('loginEmailInput')).toBeTruthy();
    expect(getByTestId('loginPasswordInput')).toBeTruthy();
  });

  it('permite editar email y password', () => {
    const {getByTestId} = renderWithProviders(<Login navigation={mockNavigation} />);

    fireEvent.changeText(getByTestId('loginEmailInput'), ' test@example.com ');
    fireEvent.changeText(getByTestId('loginPasswordInput'), '123456');

    expect(getByTestId('loginEmailInput').props.value).toBe('test@example.com');
    expect(getByTestId('loginPasswordInput').props.value).toBe('123456');
  });

  it('cambia el estado de recordarme al presionar el checkbox', () => {
    const {getByTestId} = renderWithProviders(<Login navigation={mockNavigation} />);

    expect(getByTestId('loginRememberMeIcon').props.name).toBe('square-outline');

    fireEvent.press(getByTestId('loginRememberMeCheckbox'));

    expect(getByTestId('loginRememberMeIcon').props.name).toBe('checkbox');
  });

  it('navega a recuperacion desde el enlace olvide mi contrasena', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<Login navigation={localNavigation} />);

    fireEvent.press(getByTestId('loginForgotPasswordLink'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(
      AuthNav.SignUpWithMobileNumber,
      {
        title: String.forgotPassWord,
      },
    );
  });

  it('navega a SignUp desde el enlace de registro', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<Login navigation={localNavigation} />);

    fireEvent.press(getByTestId('loginSignUpLink'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SignUp);
  });

  it('al iniciar sesion guarda token y hace reset a TabNavigation', async () => {
    const localNavigation = {...mockNavigation, reset: jest.fn()};
    const {getByTestId} = renderWithProviders(<Login navigation={localNavigation} />);

    fireEvent.press(getByTestId('loginSignInButton'));

    await waitFor(() => {
      expect(setAuthToken).toHaveBeenCalledWith(true);
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    });
  });
});

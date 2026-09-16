import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';

import AccountAccess from '../../../../src/container/Auth/AccountAccess';
import {
  DEMO_DNI,
  DEMO_PIN,
} from '../../../../src/features/demo/demoConfig';
import {activateDemoSession} from '../../../../src/features/demo/demoLifecycle';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

// El mock global de jest.setup se traga handleTextChange.
jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');
  const MockOTPTextInput = React.forwardRef(
    function MockOTPTextInput({handleTextChange, testID, ...props}, ref) {
      React.useImperativeHandle(ref, () => ({clear: jest.fn()}));
      return (
        <TextInput
          testID={testID}
          onChangeText={handleTextChange}
          {...props}
        />
      );
    },
  );
  MockOTPTextInput.displayName = 'MockOTPTextInput';
  return MockOTPTextInput;
});

jest.mock('../../../../src/features/demo/demoLifecycle', () => ({
  activateDemoSession: jest.fn(() => Promise.resolve()),
}));

const renderScreen = (params = {}) => {
  const navigation = {...mockNavigation, navigate: jest.fn()};
  const utils = renderWithProviders(
    <AccountAccess navigation={navigation} route={{params}} />,
  );
  return {navigation, ...utils};
};

const llenarFormulario = (getByTestId, dni, pin) => {
  fireEvent.changeText(getByTestId('accountAccessDniInput'), dni);
  fireEvent.changeText(getByTestId('accountAccessPinInput'), pin);
};

describe('AccountAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza la pantalla con cédula y PIN', () => {
    const {getByTestId} = renderScreen();

    expect(getByTestId('accountAccessDniInput')).toBeTruthy();
    expect(getByTestId('accountAccessPinInput')).toBeTruthy();
  });

  it('deshabilita el envío hasta tener cédula y PIN de 4 dígitos', () => {
    const {getByTestId} = renderScreen();

    expect(getByTestId('accountAccessSubmitButton').props.disabled).toBe(true);

    fireEvent.changeText(getByTestId('accountAccessDniInput'), DEMO_DNI);
    expect(getByTestId('accountAccessSubmitButton').props.disabled).toBe(true);

    fireEvent.changeText(getByTestId('accountAccessPinInput'), '12');
    expect(getByTestId('accountAccessSubmitButton').props.disabled).toBe(true);

    fireEvent.changeText(getByTestId('accountAccessPinInput'), DEMO_PIN);
    expect(getByTestId('accountAccessSubmitButton').props.disabled).toBe(false);
  });

  it('activa el modo demostración con las credenciales correctas', async () => {
    const {getByTestId} = renderScreen();

    llenarFormulario(getByTestId, DEMO_DNI, DEMO_PIN);
    fireEvent.press(getByTestId('accountAccessSubmitButton'));

    await waitFor(() => {
      expect(activateDemoSession).toHaveBeenCalledTimes(1);
    });
  });

  it('no activa la demo con el DNI correcto y PIN incorrecto', async () => {
    const {getByTestId} = renderScreen();

    llenarFormulario(getByTestId, DEMO_DNI, '0000');
    fireEvent.press(getByTestId('accountAccessSubmitButton'));

    await waitFor(() => {
      expect(getByTestId('accountAccessNotFoundModal')).toBeTruthy();
    });
    expect(activateDemoSession).not.toHaveBeenCalled();
  });

  it('no activa la demo con otro DNI aunque el PIN coincida', async () => {
    const {getByTestId} = renderScreen();

    llenarFormulario(getByTestId, '1234567', DEMO_PIN);
    fireEvent.press(getByTestId('accountAccessSubmitButton'));

    await waitFor(() => {
      expect(getByTestId('accountAccessNotFoundModal')).toBeTruthy();
    });
    expect(activateDemoSession).not.toHaveBeenCalled();
  });

  it('deriva a recuperación al cerrar el modal de cuenta no encontrada', async () => {
    const {getByTestId, navigation} = renderScreen();

    llenarFormulario(getByTestId, '1234567', '1111');
    fireEvent.press(getByTestId('accountAccessSubmitButton'));

    await waitFor(() => {
      expect(getByTestId('accountAccessNotFoundModalButton')).toBeTruthy();
    });
    fireEvent.press(getByTestId('accountAccessNotFoundModalButton'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      AuthNav.SelectRecuperation,
    );
  });

  it('muestra el aviso de sesión demo en curso al retomarla', () => {
    const {getByTestId} = renderScreen({resumeDemo: true});

    expect(getByTestId('accountAccessResumeAlert')).toBeTruthy();
  });

  it('no muestra el aviso de retomar en un acceso normal', () => {
    const {queryByTestId} = renderScreen();

    expect(queryByTestId('accountAccessResumeAlert')).toBeNull();
  });
});

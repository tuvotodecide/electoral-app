import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import FindSession from '../../../../src/container/TabBar/SignIn/FindSession';
import {renderWithProviders} from '../../../setup/test-utils';
import String from '../../../../src/i18n/String';

var mockCheckRegisteredOnThisDevice;
var mockOpenFirstAppFound;

jest.mock('@env', () => ({
  BACKEND_IDENTITY: 'https://mock.identity',
  PROVIDER_NAME: 'mock-provider',
}), {virtual: true});

jest.mock('wira-sdk', () => {
  mockCheckRegisteredOnThisDevice = jest.fn();
  mockOpenFirstAppFound = jest.fn();

  class SharedSession {
    constructor() {
      this.checkRegisteredOnThisDevice = mockCheckRegisteredOnThisDevice;
      this.openFirstAppFound = mockOpenFirstAppFound;
    }
  }

  return {
    __esModule: true,
    default: {
      SharedSession,
    },
    SharedSession,
  };
});

describe('FindSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRegisteredOnThisDevice.mockResolvedValue([]);
    mockOpenFirstAppFound.mockResolvedValue(undefined);
  });

  it('mantiene el boton deshabilitado cuando no hay DNI', () => {
    const {UNSAFE_getAllByType} = renderWithProviders(<FindSession />);
    const touchables = UNSAFE_getAllByType('TouchableOpacity');
    const continueButton = touchables[touchables.length - 1];

    expect(continueButton.props.disabled).toBe(true);
  });

  it('consulta aplicaciones por DNI y abre la primera encontrada', async () => {
    const apps = [{packageName: 'app.mock'}];
    mockCheckRegisteredOnThisDevice.mockResolvedValueOnce(apps);

    const {getByPlaceholderText, getByText} = renderWithProviders(<FindSession />);

    fireEvent.changeText(getByPlaceholderText(String.enterDni), '12345678');
    fireEvent.press(getByText(String.continueButton));

    await waitFor(() => {
      expect(mockCheckRegisteredOnThisDevice).toHaveBeenCalledWith('12345678');
      expect(mockOpenFirstAppFound).toHaveBeenCalledWith(apps);
    });
  });

  it('muestra mensaje de dispositivo no encontrado para errores conocidos', async () => {
    mockCheckRegisteredOnThisDevice.mockRejectedValueOnce(
      new Error('Device not found for provided dni'),
    );

    const {getByPlaceholderText, getByText, findByText} = renderWithProviders(<FindSession />);

    fireEvent.changeText(getByPlaceholderText(String.enterDni), '99999999');
    fireEvent.press(getByText(String.continueButton));

    expect(await findByText(String.deviceNotFound)).toBeTruthy();
    expect(mockOpenFirstAppFound).not.toHaveBeenCalled();
  });

  it('muestra el mensaje original cuando ocurre un error generico', async () => {
    mockCheckRegisteredOnThisDevice.mockRejectedValueOnce(
      new Error('Error inesperado al buscar sesion'),
    );

    const {getByPlaceholderText, getByText, findByText} = renderWithProviders(<FindSession />);

    fireEvent.changeText(getByPlaceholderText(String.enterDni), '77777777');
    fireEvent.press(getByText(String.continueButton));

    expect(await findByText('Error inesperado al buscar sesion')).toBeTruthy();
  });
});

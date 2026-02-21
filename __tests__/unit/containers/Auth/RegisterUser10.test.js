import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser10 from '../../../../src/container/Auth/RegisterUser10';
import {saveDraft, clearDraft} from '../../../../src/utils/RegisterDraft';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

const baseRouteParams = {
  ocrData: {numeroDoc: '00000000'},
  dni: '00000000',
  originalPin: '1234',
  useBiometry: false,
};

describe('RegisterUser10', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('completa el proceso y reemplaza hacia RegisterUser11', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};

    renderWithProviders(
      <RegisterUser10
        navigation={localNavigation}
        route={{
          params: baseRouteParams,
        }}
      />,
    );

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalled();
      expect(clearDraft).toHaveBeenCalled();
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.RegisterUser11,
        expect.objectContaining({account: '0xmock'}),
      );
    });
  });

  it('si falla el registro muestra modal y reintenta en RegisterUser10', async () => {
    saveDraft.mockRejectedValueOnce(new Error('Error de red al registrar'));
    const localNavigation = {...mockNavigation, replace: jest.fn()};

    const {getByTestId, getByText} = renderWithProviders(
      <RegisterUser10
        navigation={localNavigation}
        route={{
          params: baseRouteParams,
        }}
      />,
    );

    await waitFor(() => {
      expect(getByTestId('infoModalButton')).toBeTruthy();
    });

    fireEvent.press(getByTestId('infoModalButton'));

    expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser10, {
      ocrData: baseRouteParams.ocrData,
      dni: baseRouteParams.dni,
      originalPin: baseRouteParams.originalPin,
      useBiometry: baseRouteParams.useBiometry,
    });
  });

  it('si falla por PIN no disponible redirige a RegisterUser8 para recrearlo', async () => {
    saveDraft.mockRejectedValueOnce(new Error('PIN no disponible'));
    const localNavigation = {...mockNavigation, replace: jest.fn()};

    const {getByTestId, getByText} = renderWithProviders(
      <RegisterUser10
        navigation={localNavigation}
        route={{
          params: baseRouteParams,
        }}
      />,
    );

    await waitFor(() => {
      expect(getByTestId('infoModalButton')).toBeTruthy();
    });
    await waitFor(() => {
      expect(getByText('PIN no disponible')).toBeTruthy();
    });

    fireEvent.press(getByTestId('infoModalButton'));

    expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser8, {
      ocrData: baseRouteParams.ocrData,
      useBiometry: baseRouteParams.useBiometry,
      dni: baseRouteParams.dni,
    });
  });
});

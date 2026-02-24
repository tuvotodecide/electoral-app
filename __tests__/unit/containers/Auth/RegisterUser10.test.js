import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser10 from '../../../../src/container/Auth/RegisterUser10';
import wira from 'wira-sdk';
import {saveDraft, clearDraft, getDraft} from '../../../../src/utils/RegisterDraft';
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
  let originalRegisterer;

  beforeEach(() => {
    configurarMocksRegistro();
    originalRegisterer = wira.Registerer;
  });

  afterEach(() => {
    wira.Registerer = originalRegisterer;
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

  it('si existe draft previo reinicia el flujo con fromDraft', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    const savedDraft = {
      step: 'issueVC',
      dni: '11111111',
      originalPin: '9999',
      useBiometry: true,
      ocrData: {numeroDoc: '11111111'},
    };
    getDraft.mockResolvedValueOnce(savedDraft);

    renderWithProviders(
      <RegisterUser10
        navigation={localNavigation}
        route={{
          params: baseRouteParams,
        }}
      />,
    );

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.RegisterUser10,
        expect.objectContaining({
          ...savedDraft,
          fromDraft: true,
        }),
      );
    });
  });

  it('al volver de background reintenta con el draft guardado', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    const resumeDraft = {
      step: 'issueVC',
      dni: '22222222',
      originalPin: '1234',
      useBiometry: false,
      ocrData: {numeroDoc: '22222222'},
    };
    getDraft
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(resumeDraft);
    saveDraft.mockImplementationOnce(() => new Promise(() => {}));

    const ReactNative = require('react-native');
    let appStateListener;
    ReactNative.AppState.addEventListener.mockImplementationOnce((_evt, callback) => {
      appStateListener = callback;
      return {remove: jest.fn()};
    });

    renderWithProviders(
      <RegisterUser10
        navigation={localNavigation}
        route={{
          params: baseRouteParams,
        }}
      />,
    );

    await waitFor(() => {
      expect(typeof appStateListener).toBe('function');
    });

    appStateListener('background');
    appStateListener('active');

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.RegisterUser10,
        expect.objectContaining({
          ...resumeDraft,
          fromDraft: true,
        }),
      );
    });
  });

  it('si createWallet falla por timeout muestra modal de error y permite reintento', async () => {
    class TimeoutRegisterer {
      constructor() {
        this.walletData = {address: '0xmock'};
        this.createVC = jest.fn(async () => undefined);
        this.createWallet = jest.fn(async () => {
          throw new Error('registerStreamAndGuardian timeout (90000ms)');
        });
        this.storeOnDevice = jest.fn(async () => undefined);
        this.storeDataOnServer = jest.fn(async () => ({ok: true}));
      }
    }
    wira.Registerer = TimeoutRegisterer;

    const localNavigation = {...mockNavigation, replace: jest.fn()};
    const {getByTestId} = renderWithProviders(
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
    expect(getByTestId('infoModalMessageLine_0')).toBeTruthy();

    fireEvent.press(getByTestId('infoModalButton'));

    expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser10, {
      ocrData: baseRouteParams.ocrData,
      dni: baseRouteParams.dni,
      originalPin: baseRouteParams.originalPin,
      useBiometry: baseRouteParams.useBiometry,
    });
  });

  it('cuando isMigration es true guarda el draft con etapa migrate', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    renderWithProviders(
      <RegisterUser10
        navigation={localNavigation}
        route={{
          params: {
            ...baseRouteParams,
            isMigration: true,
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 'migrate',
          dni: baseRouteParams.dni,
          originalPin: baseRouteParams.originalPin,
        }),
      );
    });
  });
});

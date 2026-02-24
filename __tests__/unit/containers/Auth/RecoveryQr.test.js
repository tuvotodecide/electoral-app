import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RecoveryQr from '../../../../src/container/TabBar/Recovery/RecoveryQR';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import wira from 'wira-sdk';
import String from '../../../../src/i18n/String';
import {getLegacyData} from '../../../../src/utils/migrateLegacy';

describe('RecoveryQr', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
    new wira.RecoveryService().recoveryFromBackup.mockResolvedValue({
      identity: true,
      dni: '00000000',
    });
    new wira.RegistryApi().registryCheckByDni.mockResolvedValue({exists: false});
  });

  it('carga respaldo y navega a RecoveryUserQrpin', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<RecoveryQr navigation={localNavigation} />);

    fireEvent.press(getByTestId('recoveryFileUploadCard'));

    await waitFor(() => {
      expect(getByTestId('recoveryFileContinueButton').props.disabled).toBe(false);
    });

    fireEvent.press(getByTestId('recoveryFileContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(
      AuthNav.RecoveryUserQrpin,
      expect.objectContaining({payload: expect.any(Object)}),
    );
  });

  it('no navega si se presiona continuar sin haber cargado archivo', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<RecoveryQr navigation={localNavigation} />);

    fireEvent.press(getByTestId('recoveryFileContinueButton'));

    expect(localNavigation.navigate).not.toHaveBeenCalledWith(
      AuthNav.RecoveryUserQrpin,
      expect.anything(),
    );
  });

  it('muestra error cuando el respaldo legacy no tiene datos suficientes', async () => {
    new wira.RecoveryService().recoveryFromBackup.mockResolvedValueOnce({
      identity: false,
      dni: '12345678',
    });

    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId, findByText} = renderWithProviders(
      <RecoveryQr navigation={localNavigation} />,
    );

    fireEvent.press(getByTestId('recoveryFileUploadCard'));

    expect(await findByText(String.notEnoughLegacyData)).toBeTruthy();
    expect(getByTestId('recoveryFileContinueButton').props.disabled).toBe(true);
    expect(localNavigation.navigate).not.toHaveBeenCalledWith(
      AuthNav.RecoveryUserQrpin,
      expect.anything(),
    );
  });

  it('muestra error cuando el usuario legacy ya fue migrado', async () => {
    new wira.RecoveryService().recoveryFromBackup.mockResolvedValueOnce({
      identity: false,
      dni: '87654321',
      streamId: 'stream-1',
      privKey: 'priv-1',
    });
    new wira.RegistryApi().registryCheckByDni.mockResolvedValueOnce({exists: true});
    getLegacyData.mockResolvedValueOnce({streamId: 'stream-1', privKey: 'priv-1'});

    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId, findByText} = renderWithProviders(
      <RecoveryQr navigation={localNavigation} />,
    );

    fireEvent.press(getByTestId('recoveryFileUploadCard'));

    expect(await findByText(String.alreadyMigrated)).toBeTruthy();
    expect(getByTestId('recoveryFileContinueButton').props.disabled).toBe(true);
    expect(localNavigation.navigate).not.toHaveBeenCalledWith(
      AuthNav.RecoveryUserQrpin,
      expect.anything(),
    );
  });
});

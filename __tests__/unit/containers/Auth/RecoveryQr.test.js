import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RecoveryQr from '../../../../src/container/TabBar/Recovery/RecoveryQR';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import wira from 'wira-sdk';

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
});

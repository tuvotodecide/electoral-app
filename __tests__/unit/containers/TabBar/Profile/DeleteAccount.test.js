import React from 'react';
import {act, fireEvent, waitFor} from '@testing-library/react-native';
import {VaultError, createMockSession} from '@privado-id/expo-sdk';
import DeleteAccount from '../../../../../src/container/TabBar/Profile/DeleteAccount';
import {mockNavigation, renderWithProviders} from '../../../../setup/test-utils';
import {getPrivadoSession} from '../../../../../src/services/privado/privadoSession';
import {loadIdentityPayload} from '../../../../../src/services/privado/identityPayload';
import {
  clearAppLocalData,
  requestAccountDeletion,
} from '../../../../../src/utils/deleteAccount';
import {captureError} from '../../../../../src/config/sentry';

jest.mock('../../../../../src/services/privado/privadoSession', () => ({
  getPrivadoSession: jest.fn(),
}));
jest.mock('../../../../../src/services/privado/identityPayload', () => ({
  loadIdentityPayload: jest.fn(),
}));
jest.mock('../../../../../src/utils/deleteAccount', () => ({
  clearAppLocalData: jest.fn(async () => undefined),
  requestAccountDeletion: jest.fn(async () => undefined),
}));
jest.mock('../../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));
jest.mock('../../../../../src/components/common/CInput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');
  const MockCIntput = ({testID, _value, toGetTextFieldValue}) =>
    React.createElement(TextInput, {testID, value: _value, onChangeText: toGetTextFieldValue});
  return MockCIntput;
});

describe('DeleteAccount', () => {
  let session;
  let order;

  const fillAndSubmit = async (utils, {email = 'ana@example.com', pin = '4821'} = {}) => {
    fireEvent.changeText(utils.getByTestId('deleteAccountEmailInput'), email);
    act(() => {
      utils.getByTestId('deleteAccountPinInput').props.handleTextChange(pin);
    });
    await act(async () => {
      fireEvent.press(utils.getByTestId('deleteAccountSubmitButton'));
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    order = [];
    session = createMockSession();
    getPrivadoSession.mockResolvedValue(session);
    session.vault.unlock.mockImplementation(async () => order.push('unlock'));
    loadIdentityPayload.mockImplementation(async () => {
      order.push('loadIdentity');
      return {did: 'did:iden3:holder', dni: '1234567'};
    });
    requestAccountDeletion.mockImplementation(async () => order.push('requestDelete'));
    clearAppLocalData.mockImplementation(async () => order.push('clearAppData'));
    session.client.deleteLocalData.mockImplementation(async () => order.push('deleteLocalData'));
  });

  it('pide el borrado con el DNI de la credencial y borra los datos locales y del SDK', async () => {
    const utils = renderWithProviders(<DeleteAccount navigation={mockNavigation} />);

    await fillAndSubmit(utils);

    await waitFor(() => expect(utils.getByTestId('deleteAccountSuccessModal').props.visible).toBe(true));
    expect(session.vault.unlock).toHaveBeenCalledWith({type: 'pin', pin: '4821'});
    expect(requestAccountDeletion).toHaveBeenCalledWith({dni: '1234567', email: 'ana@example.com'});
    expect(order).toEqual(['unlock', 'loadIdentity', 'requestDelete', 'clearAppData', 'deleteLocalData']);
  });

  it('con un PIN incorrecto no borra nada', async () => {
    session.vault.unlock.mockRejectedValueOnce(new VaultError('INVALID_PIN', 'wrong'));
    const utils = renderWithProviders(<DeleteAccount navigation={mockNavigation} />);

    await fillAndSubmit(utils);

    await waitFor(() =>
      expect(utils.getByTestId('deleteAccountErrorModal').props.visible).toBe(true),
    );
    expect(requestAccountDeletion).not.toHaveBeenCalled();
    expect(clearAppLocalData).not.toHaveBeenCalled();
    expect(session.client.deleteLocalData).not.toHaveBeenCalled();
    expect(captureError).not.toHaveBeenCalled();
  });

  it('si el backend rechaza la solicitud no borra los datos del dispositivo', async () => {
    requestAccountDeletion.mockRejectedValueOnce(new Error('HTTP 500'));
    const utils = renderWithProviders(<DeleteAccount navigation={mockNavigation} />);

    await fillAndSubmit(utils);

    await waitFor(() =>
      expect(utils.getByTestId('deleteAccountErrorModal').props.visible).toBe(true),
    );
    expect(clearAppLocalData).not.toHaveBeenCalled();
    expect(session.client.deleteLocalData).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({flow: 'DeleteAccount', step: 'requestDelete'}),
    );
  });

  it('sin credencial de identidad no envía la solicitud', async () => {
    loadIdentityPayload.mockRejectedValueOnce(new Error('No se encontró la credencial PersonCredential'));
    const utils = renderWithProviders(<DeleteAccount navigation={mockNavigation} />);

    await fillAndSubmit(utils);

    await waitFor(() =>
      expect(utils.getByTestId('deleteAccountErrorModal').props.visible).toBe(true),
    );
    expect(requestAccountDeletion).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({step: 'loadIdentity'}),
    );
  });
});

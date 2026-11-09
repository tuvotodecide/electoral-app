import {availableNetworks, getReadRpcUrl} from '../../../src/api/params';

jest.mock('react-native', () => ({
  Image: {resolveAssetSource: jest.fn(() => ({uri: 'mock://asset'}))},
}));

describe('getReadRpcUrl', () => {
  it('usa PRIVADO_RPC_URL para la red del SDK (PRIVADO_CHAIN_ID)', () => {
    expect(getReadRpcUrl(availableNetworks['base-sepolia'].chain)).toBe('https://rpc.example');
  });

  it('para otras redes deja el RPC público de viem', () => {
    expect(getReadRpcUrl(availableNetworks.base.chain)).toBeUndefined();
    expect(getReadRpcUrl(availableNetworks['arbitrum-sepolia'].chain)).toBeUndefined();
    expect(getReadRpcUrl(undefined)).toBeUndefined();
  });

  it('las redes ya no llevan bundler ni parámetros de paymaster', () => {
    for (const network of Object.values(availableNetworks)) {
      expect(network).not.toHaveProperty('bundler');
      expect(network).not.toHaveProperty('getCustomPaymasterParams');
    }
  });
});

import {
  AMOY_FACTORY_ADDRESS,
  SEPOLIA_FACTORY_ADDRESS,
  OP_SEPOLIA_FACTORY_ADDRESS,
  AMOY_BUNDLER,
  SEPOLIA_BUNDLER,
  OP_SEPOLIA_BUNDLER,
  walletConfig,
} from '../../../src/utils/constants';

describe('wallet constants', () => {
  it('exporta direcciones y bundlers', () => {
    expect(AMOY_FACTORY_ADDRESS).toMatch(/^0x/);
    expect(SEPOLIA_FACTORY_ADDRESS).toMatch(/^0x/);
    expect(OP_SEPOLIA_FACTORY_ADDRESS).toMatch(/^0x/);
    expect(AMOY_BUNDLER).toContain('http');
    expect(SEPOLIA_BUNDLER).toContain('http');
    expect(OP_SEPOLIA_BUNDLER).toContain('http');
  });

  it('incluye configuraciÃ³n de redes', () => {
    expect(walletConfig.amoy).toBeDefined();
    expect(walletConfig.sepolia).toBeDefined();
    expect(walletConfig.opSepolia).toBeDefined();
    expect(walletConfig.amoy.factory).toBe(AMOY_FACTORY_ADDRESS);
    expect(walletConfig.sepolia.factory).toBe(SEPOLIA_FACTORY_ADDRESS);
    expect(walletConfig.opSepolia.factory).toBe(OP_SEPOLIA_FACTORY_ADDRESS);
  });
});

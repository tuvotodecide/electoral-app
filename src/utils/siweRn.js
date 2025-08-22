import {Wallet} from 'ethers';
import {SiweMessage} from 'siwe';
import {APP_DOMAIN, APP_URI} from '@env';

export async function buildSiweAuthSig(privKey, dataHash) {
  const wallet = new Wallet(privKey);
  const address = wallet.address;

  const domain = APP_DOMAIN || 'localhost';
  const origin = APP_URI || 'http://localhost';
  const nonce = dataHash.slice(0, 16);

  const issuedAt = new Date().toISOString();
  const expTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const siwe = new SiweMessage({
    domain,
    address,
    statement: 'Accede a tu VC cifrada',
    uri: origin,
    version: '1',
    chainId: 137,
    nonce,
    issuedAt,
    expirationTime: expTime,
  });
  const msg = siwe.prepareMessage();
  const sig = await wallet.signMessage(msg);

  return {
    sig,
    signedMessage: msg,
    derivedVia: 'ethers.signMessage',
    address,
  };
}

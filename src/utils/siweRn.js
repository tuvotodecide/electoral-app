import { Wallet } from 'ethers';
import { SiweMessage } from 'siwe';


export async function buildSiweAuthSig(privKey, dataHash) {
  const wallet   = new Wallet(privKey);
  const address  = wallet.address;

  const domain   = 'dbackbilletera.blockchainconsultora.com';      
  const origin   = 'https://dbackbilletera.blockchainconsultora.com';
  const nonce    = dataHash.slice(0, 16);   
  const issuedAt = new Date().toISOString();
  const expTime  = new Date(Date.now() + 60 * 60 * 1000).toISOString();

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

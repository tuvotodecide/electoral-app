// accounts.js

import { computeAccountAddress } from 'viem/account-abstraction';
import { privateKeyToAccount }     from 'viem/accounts';
import { walletConfig }            from './constants'; 

export function predictSmartAccount(chain, privateKey, salt) {
  // si te llega undefined salt, crea uno aleatorio
  const index = salt ?? crypto.getRandomValues(new Uint8Array(32)).reduce(
    (acc, v) => (acc << 8n) + BigInt(v),
    0n
  );

  const owner = privateKeyToAccount(privateKey).address;

  const address = computeAccountAddress({
    factoryAddress: walletConfig[chain].factory,
    entryPointAddress: walletConfig[chain].entryPoint,
    owner,
    index,
  });

  return { address, salt: index };
}

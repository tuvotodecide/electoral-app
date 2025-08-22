/* -----------------------------------------------------------------------
 *  Guardian helpers (solo Front-End) – usa viem + bundler
 *  Todas las tx gastan la misma llave “GAS_KEY” gracias a tu paymaster.
 * -------------------------------------------------------------------- */
import {
  createPublicClient, createWalletClient, createBundlerClient,
  encodeFunctionData, http
} from 'viem';
import { entryPoint07Address }      from 'viem/account-abstraction';
import { privateKeyToAccount }      from 'viem/accounts';
import { toSimpleSmartAccount }     from 'permissionless/accounts';
import { keccak_256 as keccak256 }  from '@noble/hashes/sha3';

import guardianAbi                  from '../abi/Guardian.json';
import { walletConfig, gasParams }  from './constants';
import { availableNetworks } from '../api/params';



function guardianHash(addr) {
  return `0x${keccak256(Uint8Array.from(Buffer.from(addr.slice(2), 'hex'))).toString('hex')}` ;
}

function getClients(chainKey) {
  const pub  = createPublicClient({ chain: walletConfig[chainKey].chain, transport: http() });
  const bund = createBundlerClient({ client: pub, transport: http(walletConfig[chainKey].bundler) });
  return { pub, bund };
}
                                   
export async function inviteGuardianOnchain(
  chainKey        ,
  smartAccount  ,
  ownerPrivKey  ,
  guardianAddress,             
){
  const { pub, bund } = getClients(chainKey);

  const owner    = privateKeyToAccount(ownerPrivKey);
  const sca      = await toSimpleSmartAccount({
    client: pub,
    address: smartAccount,
    owner,
    entryPoint: { address: entryPoint07Address, version: '0.7' },
  });

  const data = encodeFunctionData({
    abi:  guardianAbi,
    functionName: 'invite',
    args: [ guardianHash(guardianAddress) ],
  });

  const uoHash = await bund.sendUserOperation({
    account: sca,
    calls: [ { to: walletConfig[chainKey].guardianOf[smartAccount], data, value: 0n } ],
    ...gasParams,
        paymaster: availableNetworks[chainKey].tokenPaymaster,
        ...gasParams,
        verificationGasLimit: BigInt(90000),
  });
  await bund.waitForUserOperationReceipt({ hash: uoHash });
}


export async function acceptInvitation(
  chainKey         ,
  guardianPrivKey  ,
  guardianContract ,            
){
  const guardian = privateKeyToAccount(guardianPrivKey);
  const wc       = createWalletClient({ account: guardian, chain: walletConfig[chainKey].chain, transport: http() });

  const data = encodeFunctionData({
    abi: guardianAbi,
    functionName: 'accept',
    args: [ guardianHash(guardian.address) ],
  });
  await wc.sendTransaction({ account: guardian, to: guardianContract, data });
}

export async function approveRecovery(
  chainKey       ,
  guardianPrivKey  ,
  guardianContract ,
  newOwnerEOA    ,
){
  const guardian = privateKeyToAccount(guardianPrivKey);
  const wc       = createWalletClient({ account: guardian, chain: walletConfig[chainKey].chain, transport: http() });

  const data = encodeFunctionData({
    abi: guardianAbi,
    functionName: 'approveRecovery',
    args: [ newOwnerEOA ],
  });
  await wc.sendTransaction({ account: guardian, to: guardianContract, data });
}

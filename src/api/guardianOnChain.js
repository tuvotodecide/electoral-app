import {
  createPublicClient,
  encodeFunctionData,
  getContract,
  http,
  keccak256,
  encodePacked,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createBundlerClient, entryPoint07Address } from 'viem/account-abstraction';
import { toSimpleSmartAccount } from 'permissionless/accounts';

import guardianAbi from '../abi/Guardians.json';
import factoryAbi from '../abi/SimpleAccountFactory.json';
import { availableNetworks, FACTORY_ADDRESS, gasParams, PAYMASTER_ADDRESS } from './params';
import { buildApproveIfNeeded } from '../utils/allowance';
import { getAccount } from './account';
import { signUserOpAsService } from '../utils/walletRegister';

/* ---------- Enhanced error handling ---------------------------------- */
function fmt(err) {
  console.error('Full error object:', err);
  
  // Extract specific AA error codes
  if (err?.details?.includes('AA33')) {
    return 'Insufficient gas for paymaster validation. Try increasing gas limits.';
  }
  if (err?.details?.includes('AA21')) {
    return 'Paymaster validation failed. Check paymaster configuration.';
  }
  if (err?.details?.includes('AA23')) {
    return 'Paymaster validation reverted. Check token balance or approval.';
  }
  
  return err?.shortMessage || err?.cause?.shortMessage ||
         err?.details || err?.message || 'Bundler error';
}

/* ---------- Enhanced send function with retry logic ----------------- */
async function send(chain, acc, calls, customGasLimits = {}) {
  const publicClient = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(),
  });

  const bundler = createBundlerClient({
    client: acc.client ?? acc.publicClient,
    transport: http(availableNetworks[chain].bundler),
  });

  // Merge custom gas limits with defaults
  const finalGasParams = {
    ...gasParams,
    verificationGasLimit: BigInt(50000),
    //...customGasLimits
  };

  console.log('Sending UserOp with gas params:', finalGasParams);
  console.log('Calls:', calls);
  console.log('Paymaster:', availableNetworks[chain].tokenPaymaster);

  try {
    const userOp = await bundler.prepareUserOperation({
      account: acc,
      calls,
      ...finalGasParams,
    });

    const { factory, factoryData } = await acc.getFactoryArgs();
    const initCode = factory && factoryData ? concat([factory, factoryData]) : undefined;
    // Get the paymaster data (signature from the verifying signer)
    const packedUserOp = await signUserOpAsService(userOp, initCode, publicClient);

    // Remove signature for sendUserOperation
    const {signature, ...noSignedUserOp} = userOp;

    const hash = await bundler.sendUserOperation({
      ...noSignedUserOp,
      paymaster: PAYMASTER_ADDRESS,
      paymasterData: packedUserOp.paymasterAndData,
      ...finalGasParams,
    });

    console.log('UserOp hash:', hash);
    const receipt = await bundler.waitForUserOperationReceipt({ hash });
    
    if (!receipt.success) {
      throw new Error(receipt.returnReason || 'UserOp reverted');
    }
    
    return receipt;
  } catch (error) {
    console.error('Send error:', error);
    throw new Error(fmt(error));
  }
}

/* ---------- Enhanced gas estimation ---------------------------------- */
async function estimateGasForInvitation(chain, account, guardianCt, guardianHash) {
  try {
    const bundler = createBundlerClient({
      client: account.client ?? account.publicClient,
      transport: http(availableNetworks[chain].bundler),
    });

    const approve = await buildApproveIfNeeded(chain, account);
    const calls = [
      ...(approve ? [approve] : []),
      {
        to: guardianCt,
        data: encodeFunctionData({
          abi: guardianAbi,
          functionName: 'invite',
          args: [guardianHash],
        }),
        value: 0n,
      },
    ];

    // Estimate gas for the operation
    const gasEstimate = await bundler.estimateUserOperationGas({
      account,
      calls,
      paymaster: PAYMASTER_ADDRESS,
      ...gasParams,
    });

    console.log('Gas estimation:', gasEstimate);
    return gasEstimate;
  } catch (error) {
    console.warn('Gas estimation failed, using default values:', error);
    return null;
  }
}

/* ---------- helpers -------------------------------------------------- */
export const guardianHashFrom = eoa =>
  keccak256(encodePacked(['address'], [eoa]));

/* ---------- 1) Enhanced invite guardian function -------------------- */
export async function inviteGuardianOnChain(
  chain,        
  ownerPrivKey, 
  ownerAccount,
  guardianCt,   
  guardianHash, 
) {
  try {
    const { account } = await getAccount(ownerPrivKey, ownerAccount, chain); 
    console.log('Account created:', account.address);
    
    
    const gasEstimate = await estimateGasForInvitation(chain, account, guardianCt, guardianHash);
    console.log('gas:', gasEstimate);
    
    // Use estimated gas if available, otherwise use increased defaults
    const customGasLimits = gasEstimate ? {
      callGasLimit: BigInt(Math.ceil(Number(gasEstimate.callGasLimit) * 1.2)), // 20% buffer
      verificationGasLimit: BigInt(Math.ceil(Number(gasEstimate.verificationGasLimit) * 1.2)),
      preVerificationGas: BigInt(Math.ceil(Number(gasEstimate.preVerificationGas) * 1.2)),
    } : {
      callGasLimit: BigInt(5500000), // Even higher for complex operations
      verificationGasLimit: BigInt(5500000),
      preVerificationGas: BigInt(20000000),
      paymasterVerificationGasLimit: BigInt(30000000), // Significantly increased
    };

    const approve = await buildApproveIfNeeded(chain, account);
    console.log('Approval needed:', !!approve);

    const calls = [
      ...(approve ? [approve] : []),
      {
        to: guardianCt,
        data: encodeFunctionData({
          abi: guardianAbi,
          functionName: 'invite',
          args: [guardianHash],
        }),
        value: 0n,
      },
    ];

    return await send(chain, account, calls, customGasLimits);
  } catch (error) {
    console.error('inviteGuardianOnChain error:', error);
    throw error;
  }
}

/* ---------- 2) Enhanced accept guardian function -------------------- */
export async function acceptGuardianOnChain(
  chain,
  guardianPrivKey,
  guardianCt,
  guardianHash,
) {
  try {
    const publicClient = createPublicClient({
      chain: availableNetworks[chain].chain,
      transport: http(),
    });
    
    const account = await toSimpleSmartAccount({
      client: publicClient,
      factoryAddress: FACTORY_ADDRESS,
      owner: privateKeyToAccount(guardianPrivKey),
      entryPoint: { address: entryPoint07Address, version: '0.7' },
    });

    const approve = await buildApproveIfNeeded(chain, account);
    const calls = [
      ...(approve ? [approve] : []),
      {
        to: guardianCt,
        data: encodeFunctionData({
          abi: guardianAbi,
          functionName: 'accept',
          args: [guardianHash],
        }),
        value: 0n,
      },
    ];

    const customGasLimits = {
      callGasLimit: BigInt(2500000),
      verificationGasLimit: BigInt(1200000),
      preVerificationGas: BigInt(1800000),
      paymasterVerificationGasLimit: BigInt(2500000),
    };

    return await send(chain, account, calls, customGasLimits);
  } catch (error) {
    console.error('acceptGuardianOnChain error:', error);
    throw error;
  }
}

/* ---------- 3) Enhanced approve recovery function ------------------- */
export async function approveRecoveryOnChain(
  chain,
  guardianPrivKey,
  guardianCt,
  newOwner,
) {
  try {
    const publicClient = createPublicClient({
      chain: availableNetworks[chain].chain,
      transport: http(),
    });
    
    const account = await toSimpleSmartAccount({
      client: publicClient,
      factoryAddress: FACTORY_ADDRESS,
      owner: privateKeyToAccount(guardianPrivKey),
      entryPoint: { address: entryPoint07Address, version: '0.7' },
    });

    const approve = await buildApproveIfNeeded(chain, account);
    const calls = [
      ...(approve ? [approve] : []),
      {
        to: guardianCt,
        data: encodeFunctionData({
          abi: guardianAbi,
          functionName: 'approveRecovery',
          args: [newOwner],
        }),
        value: 0n,
      },
    ];

    const customGasLimits = {
      callGasLimit: BigInt(3000000),
      verificationGasLimit: BigInt(1500000),
      preVerificationGas: BigInt(2000000),
      paymasterVerificationGasLimit: BigInt(3000000),
    };

    return await send(chain, account, calls, customGasLimits);
  } catch (error) {
    console.error('approveRecoveryOnChain error:', error);
    throw error;
  }
}
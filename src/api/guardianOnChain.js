import {
  createPublicClient,
  encodeFunctionData,
  getContract,
  http,
  keccak256,
  encodePacked,
  toBytes,
} from 'viem';

import guardianAbi from '../abi/Guardians.json';
import {
  availableNetworks,
} from './params';
import {executeOperation} from './account';
import { getDeviceId } from '../utils/device-id';

export const guardianHashFrom = eoa =>
  keccak256(encodePacked(['address'], [eoa]));

export function calcReqHash(ownerAccount, deviceId) {
  const deviceHash = keccak256(encodePacked(['bytes'], [toBytes(deviceId)]));
  return keccak256(
    encodePacked(['address', 'bytes32'], [ownerAccount, deviceHash]),
  );
}

/* ---------- 1) Enhanced invite guardian function -------------------- */
export async function inviteGuardianOnChain(
  chain,
  ownerPrivKey,
  ownerAccount,
  guardianCt,
  guardianHash,
) {
  try {
    const call = {
      to: guardianCt,
      data: encodeFunctionData({
        abi: guardianAbi,
        functionName: 'invite',
        args: [guardianHash],
      }),
      value: 0n,
    };

    return executeOperation(ownerPrivKey, ownerAccount, chain, call);
  } catch (error) {
    console.error('inviteGuardianOnChain error:', error);
    throw error;
  }
}

export async function acceptGuardianOnChain(
  chain,
  guardianPrivKey,
  guardianAccount,
  ownerGuardianCt,
) {
  // Tu ABI: accept(bytes32 guardianHash)
  const guardianHash = guardianHashFrom(guardianAccount);

  const call = {
    to: ownerGuardianCt,
    data: encodeFunctionData({
      abi: guardianAbi,
      functionName: 'accept',
      args: [guardianHash],
    }),
    value: 0n,
  };

  return executeOperation(guardianPrivKey, guardianAccount, chain, call);
}

export async function removeGuardianOnChain(
  chain,
  ownerPrivKey,
  ownerAccount,
  ownerGuardianCt,
  guardianHash,
) {
  const call ={
    to: ownerGuardianCt,
    data: encodeFunctionData({
      abi: guardianAbi,
      functionName: 'remove',
      args: [guardianHash],
    }),
    value: 0n,
  };

  return executeOperation(ownerPrivKey, ownerAccount, chain, call);
}

export async function approveRecoveryOnChain(
  chain,
  guardianPrivKey,
  guardianEoa,
  ownerGuardianCt,
  newOwnerAddress, // <- IMPORTANTE: address del dueño a recuperar (no reqHash)
) {
  const call = {
    to: ownerGuardianCt,
    data: encodeFunctionData({
      abi: guardianAbi,
      functionName: 'approveRecovery',
      args: [newOwnerAddress],
    }),
    value: 0n,
  };

  return executeOperation(guardianPrivKey, guardianEoa, chain, call);
}

// export async function readOnChainApprovals(
//   chain,
//   ownerGuardianCt,
//   ownerAccount,
// ) {
//   const publicClient = createPublicClient({
//     chain: availableNetworks[chain].chain,
//     transport: http(),
//   });

//   const ct = getContract({
//     address: ownerGuardianCt,
//     abi: guardianAbi,
//     client: publicClient,
//   });

//   // requiredApprovals() -> uint8
//   const requiredBn = await ct.read.requiredApprovals();
//   // getRecoveryStatus(address newOwner) -> (uint8 approvals, bool executed, uint256 deadline, bool expired)
//   const [approvals, executed, deadline, expired] =
//     await ct.read.getRecoveryStatus([ownerAccount]);

//   return {
//     required: Number(requiredBn),
//     current: Number(approvals),
//     executed,
//     expired,
//     deadline, // BigInt (timestamp)
//   };
// }
export async function readOnChainApprovals(
  chain,
  guardianCt,
  ownerAccount,
  deviceIdOpt,
) {
  const client = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(),
  });

  // reqHash = keccak(ownerAccount, hash(deviceId))
  const deviceId = deviceIdOpt || (await getDeviceId());
  const reqHash = calcReqHash(ownerAccount, deviceId);

  // public mapping recoveries(bytes32) → (address newOwner, uint8 approvals, bool executed, uint256 proposedAt)
  const [newOwner, approvals, executed, proposedAt] = await client.readContract({
    address: guardianCt,
    abi: guardianAbi,
    functionName: 'recoveries',
    args: [reqHash],
  });

  // requiredApprovals (uint8)
  const required = await client.readContract({
    address: guardianCt,
    abi: guardianAbi,
    functionName: 'requiredApprovals',
    args: [],
  });

  // Expiración aprox 3 días (si tu contrato usa otra ventana, expón una view y léela aquí)
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const RECOVERY_PERIOD = 3n * 24n * 60n * 60n;
  const expired =
    proposedAt === 0n ? false : nowSec > (proposedAt + RECOVERY_PERIOD);

  return {
    required: Number(required),
    current: Number(approvals),
    executed,
    expired,
    reqHash,
    newOwner,
    proposedAt: Number(proposedAt),
  };
}

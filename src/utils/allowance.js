// NUEVO  ─────────────────────────────────────────────────────────────────
import { createPublicClient, encodeFunctionData, erc20Abi, http } from 'viem';
import { availableNetworks } from '../api/params';
import { TOKEN_ADDRESS} from '@env';

const MAX_UINT =
  BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

/**
 * Devuelve una llamada approve() si el allowance es 0.
 *
 * @param chain    'opt-sepolia' | 'eth-sepolia' | …
 * @param account  SimpleAccount (owner o guardián)  ➜  account.address
 */
export async function buildApproveIfNeeded(chain, account) {
  const client = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(),
  });

  const allowance = await client.readContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, availableNetworks[chain].tokenPaymaster],
  });

  if (allowance === 0n) {
    return {
      to: TOKEN_ADDRESS,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [availableNetworks[chain].tokenPaymaster, MAX_UINT],
      }),
    };
  }
  return null;
}

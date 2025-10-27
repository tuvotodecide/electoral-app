import {createPublicClient, encodeFunctionData, http, parseEther} from 'viem';
import {entryPoint07Address} from 'viem/account-abstraction';
import {privateKeyToAccount} from 'viem/accounts';
import {availableNetworks, gasParams} from '../api/params';


const MIN_DEPOSIT = parseEther('0.0005'); 
const SAFETY_MARGIN = parseEther('0.00002'); 

export async function ensureDeposit(chainKey, ownerPrivKey, smartAccount) {

  const client = createPublicClient({
    chain: availableNetworks[chainKey].chain,
    transport: http(),
  });

 
  const current = await client.readContract({
    address: entryPoint07Address,
    abi: [

      {
        name: 'balanceOf',
        stateMutability: 'view',
        type: 'function',
        inputs: [{name: 'account', type: 'address'}],
        outputs: [{name: 'amount', type: 'uint256'}],
      },
    ],
    functionName: 'balanceOf',
    args: [smartAccount], 
  });

  if (current >= MIN_DEPOSIT) return; 


  const missing = MIN_DEPOSIT - current;

  const eoa = privateKeyToAccount(ownerPrivKey);
  const data = encodeFunctionData({
    abi: [
      {
        name: 'depositTo',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{name: 'account', type: 'address'}],
        outputs: [],
      },
    ],
    functionName: 'depositTo',
    args: [smartAccount],
  });

  const gasLimit = await client.estimateGas({
    account: eoa.address,
    to: entryPoint07Address,
    data,
    value: missing,
  });

  const gasPrice = await client.getGasPrice();
  const txCost = missing + gasLimit * gasPrice;


  const balance = await client.getBalance({address: eoa.address});
  if (balance < txCost + SAFETY_MARGIN) {
    throw new Error(
      `Saldo insuficiente en tu EO​A. Necesitas ~${Number(txCost) / 1e18} ETH`,
    );
  }


  const hash = await client.sendTransaction({
    account: eoa,
    to: entryPoint07Address,
    data,
    value: missing,
    maxFeePerGas: (gasPrice * 12n) / 10n, // +20 %
    maxPriorityFeePerGas: gasPrice / 2n,
    gas: gasLimit + 5_000n, // ligero buffer
  });

  await client.waitForTransactionReceipt({hash});
}

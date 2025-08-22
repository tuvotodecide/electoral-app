import {createPublicClient, encodeFunctionData, http, parseEther} from 'viem';
import {entryPoint07Address} from 'viem/account-abstraction';
import {privateKeyToAccount} from 'viem/accounts';
import {availableNetworks, gasParams} from '../api/params';

/** Depósito mínimo que quieres mantener en el EntryPoint */
const MIN_DEPOSIT = parseEther('0.0005'); // 5e-4 ETH
const SAFETY_MARGIN = parseEther('0.00002'); // 2e-5 ETH (~2 $cts)

export async function ensureDeposit(chainKey, ownerPrivKey, smartAccount) {
  /* 1. Conectamos al nodo */
  const client = createPublicClient({
    chain: availableNetworks[chainKey].chain,
    transport: http(),
  });

  /* 2. ¿Cuánto depósito hay ya? */
  const current = await client.readContract({
    address: entryPoint07Address,
    abi: [
      // En v0.7 la función pública es balanceOf(address)
      {
        name: 'balanceOf',
        stateMutability: 'view',
        type: 'function',
        inputs: [{name: 'account', type: 'address'}],
        outputs: [{name: 'amount', type: 'uint256'}],
      },
    ],
    functionName: 'balanceOf',
    args: [smartAccount], // la smart-account, no tu EOA
  });

  if (current >= MIN_DEPOSIT) return; // nada que hacer

  /* 3. Diferencia que debemos cubrir */
  const missing = MIN_DEPOSIT - current;

  /* 4. Estimamos el gas de depositTo() */
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

  /* 5. Comprobamos si hay saldo */
  const balance = await client.getBalance({address: eoa.address});
  if (balance < txCost + SAFETY_MARGIN) {
    throw new Error(
      `Saldo insuficiente en tu EO​A. Necesitas ~${Number(txCost) / 1e18} ETH`,
    );
  }

  /* 6. Ejecutamos la transacción */
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

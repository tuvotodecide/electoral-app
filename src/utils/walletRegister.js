import {privateKeyToAccount} from 'viem/accounts';
import {walletConfig} from './constants';
import {toSimpleSmartAccount} from 'permissionless/accounts';
import factoryAbi from '../abi/SimpleAccountFactory.json';

import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
  bytesToHex,
} from 'viem';
import {
  entryPoint07Address,
} from 'viem/account-abstraction';
import {hashIdentifier} from './Cifrate';
import {randomBytes} from 'react-native-quick-crypto';
import {
  availableNetworks,
  FACTORY_ADDRESS,
  sponsorshipPolicyId,
} from '../api/params';
import { getPredictedGuardian } from './getGuardian';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { createSmartAccountClient } from 'permissionless';

export async function predictAccount(client, factoryAddress, ownerKey, salt) {
  const account = await toSimpleSmartAccount({
    client,
    factoryAddress: factoryAddress,
    owner: privateKeyToAccount(ownerKey),
    entryPoint: {address: entryPoint07Address, version: '0.7'},
    index: salt,
  });
  return account;
}

export const predictWalletAddress = async (chain, privateKey, salt) => {
  const newSalt = salt ?? BigInt('0x' + randomBytes(32).toString('hex'));

  const client = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(),
  });

  const account = await toSimpleSmartAccount({
    client,
    factoryAddress: FACTORY_ADDRESS,
    owner: privateKeyToAccount(privateKey),
    entryPoint: {address: entryPoint07Address, version: '0.7'},
    index: salt ?? newSalt,
  });

  return {address: account.address, salt: salt ?? newSalt};
};

export const fundSmartAccount = async (
  chain,
  smartAccountAddress,
  privateKey,
  amount,
) => {
  const eoaAccount = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account: eoaAccount,
    chain: walletConfig[chain].chain,
    transport: http(),
  });

  const hash = await client.sendTransaction({
    account: eoaAccount,
    to: smartAccountAddress,
    value: parseEther(amount),
    chain: walletConfig[chain].chain,
  });

  return hash;
};

export const depositToEntryPoint = async (
  chain,
  gasPayerKey,
  accountAddress,
  amount = '0.006',
) => {
  const eoa = privateKeyToAccount(gasPayerKey);

  const wc = createWalletClient({
    account: eoa,
    chain: walletConfig[chain].chain,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: walletConfig[chain].chain,
    transport: http(),
  });
  const gasPrice = await publicClient.getGasPrice();

  return wc.sendTransaction({
    account: eoa,
    chain: walletConfig[chain].chain,
    to: entryPoint07Address,
    value: parseEther(amount),
    data: encodeFunctionData({
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
      args: [accountAddress],
    }),
    maxFeePerGas: (gasPrice * BigInt(12)) / BigInt(10),
    maxPriorityFeePerGas: gasPrice / BigInt(2),
  });
};

export async function registerStreamAndGuardian(
  chainId,
  salt,
  privateKey,
  dni,
  streamId,
) {
  try {
    if (!availableNetworks[chainId]) {
      throw new Error(`Configuración no encontrada para chain: ${chainId}`);
    }

    const {chain, bundler} = availableNetworks[chainId];

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const account = await toSimpleSmartAccount({
      client: publicClient,
      factoryAddress: FACTORY_ADDRESS,
      owner: privateKeyToAccount(privateKey),
      entryPoint: {address: entryPoint07Address, version: '0.7'},
      index: salt,
    });

    const pimlicoClient = createPimlicoClient({
      chain,
      transport: http(bundler),
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
      },
    });

    const smartAccountClient = createSmartAccountClient({
      account,
      chain,
      bundlerTransport: http(bundler),
      paymaster: pimlicoClient,
      paymasterContext: { sponsorshipPolicyId },
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await pimlicoClient.getUserOperationGasPrice()).standard;
        },
      },
    });

    const idHash = bytesToHex(hashIdentifier(dni, salt.toString()));

    const data = encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'registerStream',
          stateMutability: 'nonpayable',
          inputs: [
            {name: 'idHash', type: 'bytes32'},
            {name: 'streamId', type: 'string'},
          ],
        },
      ],
      functionName: 'registerStream',
      args: [idHash, streamId],
    });

    const dataGuardian = encodeFunctionData({
      abi: factoryAbi,
      functionName: 'createGuardianForAccount',
      args: [account.address, salt],
    });

    const hash = await smartAccountClient.sendTransaction({
      calls: [
        {
          to: account.address,
          value: BigInt(0),
          data
        },
        {
          to: FACTORY_ADDRESS,
          value: BigInt(0),
          data: dataGuardian
        },
      ]
    });
    const guardianReceipt = await publicClient.waitForTransactionReceipt({hash});
    console.log(guardianReceipt);

    const guardianAddress = await getPredictedGuardian(
      chainId,
      account.address,
      salt,
    );
   
    return {guardianReceipt, guardianAddress};   
  } catch (error) {
    console.log(error);
    if (error.message.includes('instanceof')) {
      throw new Error(
        'Error de tipo en registerStreamOnChain - verifica las importaciones de viem',
      );
    } else {
      throw new Error(`registerStreamOnChain failed: ${error.message}`);
    }
  }
}
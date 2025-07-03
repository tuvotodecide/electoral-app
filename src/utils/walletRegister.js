import {privateKeyToAccount} from 'viem/accounts';
import {walletConfig} from './constants';
import {toSimpleSmartAccount} from 'permissionless/accounts';
import {TOKEN_NETWORK, TOKEN_ADDRESS, TOKEN_DECIMALS} from '@env';
import factoryAbi from '../abi/SimpleAccountFactory.json';

import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  http,
  keccak256,
  parseEther,
  bytesToHex,
  parseUnits,
} from 'viem';
import {
  createBundlerClient,
  entryPoint07Address,
} from 'viem/account-abstraction';
import {hashIdentifier} from './Cifrate';
import {randomBytes} from 'react-native-quick-crypto';
import {
  availableNetworks,
  gasParams,
  TOKEN_PAYMASTER_ADDRESS,
} from '../api/params';
import { getGuardian, getPredictedGuardian } from './getGuardian';

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
    chain: walletConfig[chain].chain,
    transport: http(),
  });

  const account = await predictAccount(
    client,
    walletConfig[chain].factory,
    privateKey,
    salt ?? newSalt,
  );
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
  chain,
  salt,
  privateKey,
  dni,
  streamId,
) {
  try {
    if (!walletConfig[chain]) {
      throw new Error(`Configuración no encontrada para chain: ${chain}`);
    }

    const publicClient = createPublicClient({
      chain: walletConfig[chain].chain,
      transport: http(),
    });

    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(walletConfig[chain].bundler),
    });

    const account = await toSimpleSmartAccount({
      client: publicClient,
      factoryAddress: walletConfig[chain].factory,
      owner: privateKeyToAccount(privateKey),
      entryPoint: {address: entryPoint07Address, version: '0.7'},
      index: salt,
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

    const regHash = await bundlerClient.sendUserOperation({
      account,
      calls: [
        {
          to: account.address,
          value: BigInt(0),
          data,
        },
      ],
      maxFeePerGas: BigInt(3000000000),
      maxPriorityFeePerGas: BigInt(100000000),
    });

    await bundlerClient.waitForUserOperationReceipt({
      hash: regHash,
    });

    const dataGuardian = encodeFunctionData({
      abi: factoryAbi,
      functionName: 'createGuardianForAccount',
      args: [account.address, salt],
    });

    const guardianHash = await bundlerClient.sendUserOperation({
      account,
      calls: [
        {
          to: walletConfig[chain].factory,
          value: BigInt(0),
          data: dataGuardian,
        },
      ],
      maxFeePerGas: BigInt(3_000_000_000),
      maxPriorityFeePerGas: BigInt(100_000_000),
    });

    const guardianReceipt = await bundlerClient.waitForUserOperationReceipt({
      hash: guardianHash,
    });
    const guardianAddress = await getPredictedGuardian(
      chain,
      account.address,
      salt,
    );

    const code = await publicClient.getCode({ address: guardianAddress });
    if (code === '0x') {
     console.log('Guardian aún no desplegado – esperando bloque…')

    }
    return {guardianReceipt, guardianAddress};
  } catch (error) {
    if (error.message.includes('instanceof')) {
      throw new Error(
        'Error de tipo en registerStreamOnChain - verifica las importaciones de viem',
      );
    } else {
      throw new Error(`registerStreamOnChain failed: ${error.message}`);
    }
  }
}

export async function approveGasToPaymaster(address, privateKey) {
  try {
    const publicClient = createPublicClient({
      chain: availableNetworks[TOKEN_NETWORK].chain,
      transport: http(),
    });

    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(availableNetworks[TOKEN_NETWORK].bundler),
    });

    const account = await toSimpleSmartAccount({
      client: publicClient,
      address,
      owner: privateKeyToAccount(privateKey),
      entryPoint: {address: entryPoint07Address, version: '0.7'},
    });

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [availableNetworks[TOKEN_NETWORK].tokenPaymaster, parseUnits('1000', TOKEN_DECIMALS)],
    });

    const userOpHash = await bundlerClient.sendUserOperation({
      account,
      calls: [
        {
          to: TOKEN_ADDRESS,
          value: BigInt(0),
          data,
        },
      ],
      ...gasParams,
    });

    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    return receipt;
  } catch (error) {
    console.error(error);
  }
}

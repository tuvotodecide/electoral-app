import {privateKeyToAccount} from 'viem/accounts';
import {walletConfig} from './constants';
import {toSimpleSmartAccount} from 'permissionless/accounts';
import {TOKEN_ADDRESS, SIGNER_PRIVATE_KEY} from '@env';
import factoryAbi from '../abi/SimpleAccountFactory.json';

import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  http,
  parseEther,
  bytesToHex,
  concat,
  numberToHex,
  encodeAbiParameters,
  getContract,
} from 'viem';
import {
  createBundlerClient,
  entryPoint07Address,
} from 'viem/account-abstraction';
import {hashIdentifier} from './Cifrate';
import {randomBytes} from 'react-native-quick-crypto';
import {
  availableNetworks,
  FACTORY_ADDRESS,
  gasParams,
  PAYMASTER_ADDRESS,
} from '../api/params';
import { getPredictedGuardian } from './getGuardian';

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
  chain,
  salt,
  privateKey,
  dni,
  streamId,
) {
  try {
    if (!availableNetworks[chain]) {
      throw new Error(`Configuración no encontrada para chain: ${chain}`);
    }

    const publicClient = createPublicClient({
      chain: availableNetworks[chain].chain,
      transport: http(),
    });

    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(availableNetworks[chain].bundler),
    });

    const account = await toSimpleSmartAccount({
      client: publicClient,
      factoryAddress: FACTORY_ADDRESS,
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

    const dataGuardian = encodeFunctionData({
      abi: factoryAbi,
      functionName: 'createGuardianForAccount',
      args: [account.address, salt],
    });
    
    //prepare userOp to sign
    const userOp = await bundlerClient.prepareUserOperation({
      account,
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
      ],
      ...gasParams,
      verificationGasLimit: BigInt(400000),
    });

    const { factory, factoryData } = await account.getFactoryArgs();
    const initCode = factory && factoryData ? concat([factory, factoryData]) : undefined;
    // Get the paymaster data (signature from the verifying signer)
    const packedUserOp = await signUserOpAsService(userOp, initCode, publicClient);

    // Remove signature for sendUserOperation
    const {signature, ...noSignedUserOp} = userOp;

    // Send the user operation with paymaster data
    const hash = await bundlerClient.sendUserOperation({
      ...noSignedUserOp,
      paymaster: PAYMASTER_ADDRESS,
      paymasterData: packedUserOp.paymasterAndData,
      ...gasParams,
      verificationGasLimit: BigInt(400000),
    });

    const guardianReceipt = await bundlerClient.waitForUserOperationReceipt({
      hash,
    });

    const guardianAddress = await getPredictedGuardian(
      chain,
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

export async function signUserOpAsService(userOp, initCode, client) {
  const signerAccount = privateKeyToAccount(SIGNER_PRIVATE_KEY);

  // Prepare validity timestamps (valid for 1 hour)
  const now = Math.floor(Date.now() / 1000);
  const validUntil = now + 3600; // Valid for 1 hour
  const validAfter = now - 60; // Valid from 1 minute ago (to account for clock differences)

  const paymasterContract = getContract({
    abi: [{
      "type": "function",
      "name": "getHash",
      "inputs": [
        {
          "name": "userOp",
          "type": "tuple",
          "internalType": "struct PackedUserOperation",
          "components": [
            {
              "name": "sender",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "nonce",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "initCode",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "callData",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "accountGasLimits",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "preVerificationGas",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "gasFees",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "paymasterAndData",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "validUntil",
          "type": "uint48",
          "internalType": "uint48"
        },
        {
          "name": "validAfter",
          "type": "uint48",
          "internalType": "uint48"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    }],
    address: PAYMASTER_ADDRESS,
    client
  });

  // Format accountGasLimits and gasFees as required by the contract
  const accountGasLimits = concat([
    numberToHex(userOp.callGasLimit, { size: 16 }),
    numberToHex(userOp.verificationGasLimit, { size: 16 })
  ]);
    
  const gasFees = concat([
    numberToHex(userOp.maxFeePerGas, { size: 16 }),
    numberToHex(userOp.maxPriorityFeePerGas, { size: 16 })
  ]);

  // Create temporary paymasterAndData with just the paymaster address and timestamps
  // This is used to get the hash that needs to be signed
  const tempPaymasterAndData = concat([
    PAYMASTER_ADDRESS,
    encodeAbiParameters(
      [{ type: 'uint48' }, { type: 'uint48' }],
      [validUntil, validAfter]
    )
  ]);

  const packedUserOp = {
    sender: userOp.sender,
    nonce: userOp.nonce,
    callData: userOp.callData,
    initCode: initCode ?? '0x',
    accountGasLimits,
    preVerificationGas: userOp.preVerificationGas,
    gasFees,
    paymasterAndData: tempPaymasterAndData,
    signature: '0x',
  };

  // Get the hash to sign from the paymaster contract
  const userOpHash = await paymasterContract.read.getHash([
    packedUserOp,
    validUntil,
    validAfter
  ]);

  // Sign the hash
  const signature = await signerAccount.signMessage({
    message: { raw: userOpHash }
  });

  // Format the final paymasterAndData according to the contract's requirements:
  // 1. The timestamps (validUntil, validAfter)
  // 2. The signature
  const paymasterAndData = concat([
    encodeAbiParameters(
      [{ type: 'uint48' }, { type: 'uint48' }],
      [validUntil, validAfter]
    ),
    signature
  ]);

  packedUserOp.paymasterAndData = paymasterAndData;

  return packedUserOp;
}
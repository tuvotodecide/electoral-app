import { createPublicClient, getContract, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { availableNetworkNames, availableNetworks, gasParams, FACTORY_ADDRESS, PAYMASTER_ADDRESS, sponsorshipPolicyId } from "./params";
import { createBundlerClient, entryPoint07Address } from "viem/account-abstraction";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { CHAIN } from '@env';
import walletAbi from './contracts/SimpleAccount.json';
import { signUserOpAsService } from "../utils/walletRegister";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createSmartAccountClient } from "permissionless";

export function getReadAccountContract(chain, address) {
	const client = createPublicClient({
		chain: availableNetworks[chain].chain,
		transport: http(),
	});

	return getContract({
		address,
		abi: walletAbi,
		client: { public: client }
	});
}

export async function getAccount(privateKey, address, chain, includeBundler = false) {
	const owner = privateKeyToAccount(privateKey);

	const publicClient = createPublicClient({
		chain: availableNetworks[chain].chain,
		transport: http(),
	});

	const account = await toSimpleSmartAccount({
		client: publicClient,
		address,
		factoryAddress: FACTORY_ADDRESS,
		owner,
		entryPoint: { address: entryPoint07Address, version: '0.7' },
	});

	let bundlerClient;
	if (includeBundler) {
		bundlerClient = createBundlerClient({
			client: publicClient,
			transport: http(availableNetworks[chain].bundler),
		});
	}

	return { account, publicClient, bundlerClient };
}

export async function getWalletBalances(address) {
	const url = 'https://api.g.alchemy.com/data/v1/-3kPQX60UVLDZWONGLNGEEAn89cn0C8g/assets/tokens/by-address';
	const headers = {
		'Accept': 'application/json',
	};
	const body = JSON.stringify({
		addresses: [
			{
				address: address,
				networks: availableNetworkNames
			}
		]
	});

	try {
		const response = await fetch(url, { method: 'POST', headers, body });
		return response.json();
	} catch (error) {
		console.error('Error fetching balance:' + error);
	}
}

export async function getWalletCreateTotalDebt(address) {
	const promises = [];
	for (const chain of availableNetworkNames) {
		promises.push(getWalletCreateDebt(chain, address));
	}

	const responses = (await Promise.all(promises)).map((value, index) => ({
		debt: value,
		chain: availableNetworkNames[index],
	}));
	return responses;
}

export async function getWalletCreateDebt(chain, address) {
	const wallet = getReadAccountContract(chain, address);
	try {
		const debt = await wallet.read.createDebt();
		return debt;
	} catch (error) {
		return BigInt('0');
	}
}

/*
export async function executeOperation(privateKey, address, chain, callData) {
	const {account, publicClient} = await getAccount(privateKey, address, chain);

	const pimlicoClient = createPimlicoClient({
    chain: availableNetworks[chain].chain,
    transport: http(
      availableNetworks[chain].bundler,
    ),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });

	const smartAccountClient = createSmartAccountClient({
    account,
    chain: availableNetworks[chain].chain,
    bundlerTransport: http(
      availableNetworks[chain].bundler,
    ),
    paymaster: pimlicoClient,
    paymasterContext: { sponsorshipPolicyId },
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  });

	const txHash = await smartAccountClient.sendTransaction(callData);
  const receipt = await publicClient.waitForTransactionReceipt({hash: txHash});
  console.log(receipt);
  return receipt;
}*/


export async function executeOperation(privateKey, address, chain, callData, waitEvent, eventName) {
	const {account, publicClient: client} = await getAccount(privateKey, address, chain);

	const bundlerClient = createBundlerClient({
		client,
		transport: http(availableNetworks[chain].bundler),
	});

	const userOp = await bundlerClient.prepareUserOperation({
    account,
    calls: [callData],
		...gasParams,
		verificationGasLimit: BigInt(70000),
		paymasterVerificationGasLimit: BigInt(80000)
	});

	const { factory, factoryData } = await account.getFactoryArgs();
	const initCode = factory && factoryData ? concat([factory, factoryData]) : undefined;
	const packedUserOp = await signUserOpAsService(userOp, initCode, client);
	const {signature, ...noSignedUserOp} = userOp;

	const hash = await bundlerClient.sendUserOperation({
		...noSignedUserOp,
		paymaster: PAYMASTER_ADDRESS,
		paymasterData: packedUserOp.paymasterAndData,
	});

	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
	console.log("Receipt en account", receipt)

	if (!receipt.success) {
		throw Error('Transaction failed, try again later');
	}

	let returnData;
	if(waitEvent && eventName) {
		returnData = await expectReturn(chain, eventName, receipt.receipt.blockNumber);
	}

	const block = await client.getBlock({ blockNumber: receipt.receipt.blockNumber });
	const date = new Date(Number(block.timestamp) * 1000);
	return { returnData, receipt, date: date.toLocaleString() };
}

export async function isWallet(address) {
	const client = createPublicClient({
		chain: availableNetworks[CHAIN].chain,
		transport: http(),
	});

	const wallet = getContract({
		address,
		abi: walletAbi,
		client: { public: client }
	});

	try {
		const response = await wallet.read.isThisASimpleAccountContract();
		return response;
	} catch (error) {
		return false;
	}
}

// Fetch user attestations from API
export async function fetchUserAttestations(userId) {
	const API_BASE_URL = 'http://192.168.1.16:3000/api/v1';

	try {
		console.log(`Fetching attestations for user ${userId}...`);
		const response = await fetch(`${API_BASE_URL}/user/${userId}/attestations`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Attestations fetched successfully:', data);

		return {
			success: true,
			data: data,
		};
	} catch (error) {
		console.error('Error fetching user attestations:', error);
		return {
			success: false,
			message: error.message || 'Error al cargar los atestiguamientos',
		};
	}
}
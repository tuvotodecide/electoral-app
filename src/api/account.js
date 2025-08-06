import { createPublicClient, encodeFunctionData, erc20Abi, getContract, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { availableNetworkNames, availableNetworks, FACTORY_ADDRESS, gasParams } from "./params";
import { createBundlerClient, entryPoint07Address } from "viem/account-abstraction";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { CHAIN } from '@env';
import walletAbi from './contracts/SimpleAccount.json';

export function getReadAccountContract(chain, address) {
	const client = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(),
  });

	return getContract({
    address,
    abi: walletAbi,
    client: {public: client}
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
		entryPoint: {address: entryPoint07Address, version: '0.7'},
	});

	let bundlerClient;
	if(includeBundler) {
		bundlerClient = createBundlerClient({
			client: publicClient,
			transport: http(availableNetworks[chain].bundler),
		});
	}

	return {account, publicClient, bundlerClient};
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
		const response = await fetch(url, {method: 'POST', headers, body});
		return response.json();
	} catch (error) {
		console.error('Error fetching balance:' + error);
	}
}

export async function getWalletCreateTotalDebt(address) {
	const promises = [];
	for(const chain of availableNetworkNames) {
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

export async function send(privateKey, address, chain, targetAddress, token, decimals, amount) {
	const {account, publicClient: client} = await getAccount(privateKey, address, chain);

	const bundlerClient = createBundlerClient({
    client,
    transport: http(availableNetworks[chain].bundler),
  });

	const hash = await bundlerClient.sendUserOperation({
    account,
    calls: [{
      to: token, //direccion del oraculo 0xfEBBd59dcE9e1E9C5F1431Aa99C1f9e52193da7f
      value: BigInt(0),
      data: getSendTokenCall(targetAddress),
    }],
    //paymaster: availableNetworks[chain].tokenPaymaster,
		...gasParams,
		verificationGasLimit: BigInt(90000),
  });

	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
  
	if(!receipt.success) {
		throw Error('Transaction failed, try again later');
	}

	const block = await client.getBlock({blockNumber: receipt.receipt.blockNumber});
	const date = new Date(Number(block.timestamp) * 1000);
  return {receipt, date: date.toLocaleString()};
}

function getSendTokenCall(to) {
	return encodeFunctionData({
		abi: erc20Abi, //json del oraculo
		functionName: 'requestRegister',
		args: [to] //URI del json de IPFS
	});
}

function getSendTokenCall2(to) {
	return encodeFunctionData({
		abi: erc20Abi, //json del oraculo
		functionName: 'createAttestation',
		args: [to] //URI del json de IPFS
	});

	//receipt deberia retornar (id (mesa), recordId (nft de acta))
}

function getSendTokenCall3(to) {
	return encodeFunctionData({
		abi: erc20Abi, //json del oraculo
		functionName: 'attest',
		args: [
			id, //id de atestiguamiento (mesa)
			recordId, //recordId del nft del acta
			true,
			"" //vacio si eligio un acta, sino la URI de IPFS
		]
	});
	//return recordId de nuevo nft
}

export async function isWallet(address) {
	const client = createPublicClient({
    chain: availableNetworks[CHAIN].chain,
    transport: http(),
  });

	const wallet = getContract({
    address,
    abi: walletAbi,
    client: {public: client}
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
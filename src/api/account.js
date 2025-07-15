import { createPublicClient, encodeFunctionData, erc20Abi, getContract, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { availableNetworkNames, availableNetworks, FACTORY_ADDRESS, gasParams } from "./params";
import { createBundlerClient, entryPoint07Address } from "viem/account-abstraction";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { MAIN_NETWORK } from '@env';
import walletAbi from './contracts/SimpleAccount.json';
import { checkTokenAvailibility } from "./wormhole";

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
      to: token,
      value: BigInt(0),
      data: getSendTokenCall(targetAddress, parseUnits(amount, decimals)),
    }],
    paymaster: availableNetworks[chain].tokenPaymaster,
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

export async function sendCrossChain(privateKey, address, chain, targetChain, targetAddress, token, decimals, amount) {
	await checkTokenAvailibility(chain, targetChain, token);
	const {account, publicClient: client, bundlerClient} = await getAccount(privateKey, address, chain, true);

	const functionCall = encodeFunctionData({
		abi: [
			{
				"type": "function",
				"name": "sendCrossChainDeposit",
				"inputs": [
					{"name": "targetChain",    "type": "uint16",  "internalType": "uint16" },
					{"name": "targetReceiver", "type": "address", "internalType": "address"},
					{"name": "sender",         "type": "address", "internalType": "address"},
					{"name": "recipient",      "type": "address", "internalType": "address"},
					{"name": "amount",         "type": "uint256", "internalType": "uint256"},
					{"name": "transferToken",  "type": "address", "internalType": "address"}
				],
				"outputs": [],
				"stateMutability": "nonpayable"
			}
		],
		functionName: 'sendCrossChainDeposit',
		args: [
			availableNetworks[targetChain].wormholeChainId,
			availableNetworks[targetChain].crossChainReveiver,
			account.address,
			targetAddress,
			parseUnits(amount, decimals),
			token
		]
	});

	console.log(availableNetworks[targetChain].wormholeChainId);
	console.log(availableNetworks[targetChain].crossChainReveiver);
	console.log(account.address);
	console.log(targetAddress);
	console.log(parseUnits(amount, decimals));
	console.log(token);


	console.log(availableNetworks[chain].tokenPaymaster);

	const hash = await bundlerClient.sendUserOperation({
    account,
    calls: [{
      to: availableNetworks[chain].tokenPaymaster,
      value: BigInt(0),
      data: functionCall,
    }],
    paymaster: availableNetworks[chain].tokenPaymaster,
		...gasParams,
		verificationGasLimit: BigInt(90000),
  });

	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
  console.log("Transaction receipt:", receipt);
	if(!receipt.success) {
		throw Error('Transaction failed, try again later');
	}

	const block = await client.getBlock({blockNumber: receipt.receipt.blockNumber});
	const date = new Date(Number(block.timestamp) * 1000);
  return {receipt, date: date.toLocaleString()};
}

function getSendTokenCall(to, amount) {
	return encodeFunctionData({
		abi: erc20Abi,
		functionName: 'transfer',
		args: [to, amount]
	});
}

export async function isWallet(address) {
	const client = createPublicClient({
    chain: availableNetworks[MAIN_NETWORK].chain,
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
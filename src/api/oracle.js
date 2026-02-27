import { createPublicClient, encodeFunctionData, getContract, http } from "viem";
import oracleAbi from '../abi/OracleAbi.json';
import { availableNetworks } from "./params";

function requestRegister(chain, imageUri) {
  return {
    to: availableNetworks[chain].oracle,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: oracleAbi,
      functionName: 'requestRegister',
      args: [imageUri]
    })
  }
}

function createAttestation(chain, tableId, jsonUri) {
  return {
    to: availableNetworks[chain].oracle,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: oracleAbi,
      functionName: 'createAttestation',
      args: [tableId, jsonUri]
    })
  }
}

function attest(chain, tableId, recordId, newJsonUri = "") {
  return {
    to: availableNetworks[chain].oracle,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: oracleAbi,
      functionName: 'attest',
      args: [tableId, recordId, true, newJsonUri]
    })
  }
}

async function isRegistered(chainId, accountAddress, attemps = 3) {
  const {chain, oracle, userRole, juryRole, bundler} = availableNetworks[chainId];

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
  const publicClient = createPublicClient({
    chain,
    transport: http(bundler),
  });

  const oracleContract = getContract({
    address: oracle,
    abi: oracleAbi,
    client: {public: publicClient},
  });

  for(let i = 0; i < attemps; i++) {
    const isUser = await oracleContract.read.hasRole([
      userRole,
      accountAddress
    ]);

    if(isUser) {
      return true;
    }

    const isJury = await oracleContract.read.hasRole([
      juryRole,
      accountAddress
    ]);

    if(isJury) {
      return true;
    }

    await sleep(2000);
  }

  return false;
}

async function isUserJury(chainId, address) {
  const {chain, oracle, juryRole, bundler} = availableNetworks[chainId];

  const publicClient = createPublicClient({
    chain: chain,
    transport: http(bundler),
  });

  const oracleContract = getContract({
		address: oracle,
		abi: oracleAbi,
		client: { public: publicClient }
	});

  const response = await oracleContract.read.hasRole([
    juryRole,
    address
  ]);
	return response;
}

async function waitForOracleEvent(chain, eventName, txBlock, attemps = 3) {
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
  const {chain: chainConfig, bundler} = availableNetworks[chain];

  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(bundler),
  });

  const normalizeBlockNumber = value => {
    try {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'number' && Number.isFinite(value)) {
        return BigInt(Math.max(0, Math.trunc(value)));
      }
      const raw = String(value ?? '').trim();
      if (!raw) return BigInt(0);
      return raw.startsWith('0x') ? BigInt(raw) : BigInt(raw);
    } catch {
      return BigInt(0);
    }
  };

  const isInvalidBlockRangeError = error => {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('invalid block range') ||
      message.includes('missing or invalid parameters')
    );
  };

  const targetBlock = normalizeBlockNumber(txBlock);

  for(let i = 0; i < attemps; i++) {
    try {
      // Base RPC is load-balanced; some nodes can lag a few blocks.
      const latestBlock = await publicClient.getBlockNumber();
      if (latestBlock < targetBlock) {
        await sleep(2000);
        continue;
      }

      const logs = await publicClient.getContractEvents({
        address: availableNetworks[chain].oracle,
        abi: oracleAbi,
        eventName,
        fromBlock: targetBlock,
        toBlock: targetBlock
      });

      if(logs.length > 0) {
        return logs[0].args;
      }
    } catch (error) {
      if (!isInvalidBlockRangeError(error) || i === attemps - 1) {
        throw error;
      }
    }

    await sleep(2000);
  }

  return false;
}

export const oracleCalls = {
  requestRegister,
  createAttestation,
  attest,
}

export const oracleReads = {
  isRegistered,
  isUserJury,
  waitForOracleEvent,
}

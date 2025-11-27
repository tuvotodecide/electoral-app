import { createPublicClient, encodeFunctionData, getContract, http } from "viem";
import { availableNetworks } from "./params";
import oracleAbi from '../abi/OracleAbi.json'

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
  const {chain, oracle, userRole, juryRole} = availableNetworks[chainId];

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
  const publicClient = createPublicClient({
    chain,
    transport: http(),
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
  const {chain, oracle, juryRole} = availableNetworks[chainId];

  const publicClient = createPublicClient({
    chain: chain,
    transport: http(),
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

  const publicClient = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(),
  });

  for(let i = 0; i < attemps; i++) {

    const logs = await publicClient.getContractEvents({
      address: availableNetworks[chain].oracle,
      abi: oracleAbi,
      eventName,
      fromBlock: txBlock,
      toBlock: txBlock
    });


    if(logs.length > 0) {
      return logs[0].args;
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
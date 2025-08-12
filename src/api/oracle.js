import { createPublicClient, encodeFunctionData, http } from "viem";
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
      args: [tableId, jsonUri, ""]
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
      args: [tableId, recordId, true, newJsonUri, ""]
    })
  }
}

async function isRegistered(chain, accountAddress, attemps = 3) {
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));   

  const publicClient = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(),
  });

  for(let i = 0; i < attemps; i++) {
    const logs = await publicClient.getContractEvents({
      address: availableNetworks[chain].oracle,
      abi: oracleAbi,
      eventName: 'RoleGranted',
      args: {
        account: accountAddress,
      },
      fromBlock: BigInt(183325055)
    });

    if(logs.length > 0) {
      return true;
    }
    await sleep(4000);
  }

  return false;
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
    console.log("event logs:")
    console.log(logs);

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
  waitForOracleEvent,
}
import { createPublicClient, defineChain, encodeFunctionData, getContract, http } from "viem";
import voteAbi from '../abi/VoteAbi.json';
import { availableNetworks } from "./params";
import { CHAIN } from "@env";

const bundler = 'https://0bb12tnp-8545.brs.devtunnels.ms';

function getVoteReadContract() {
  const { voteContract } = availableNetworks[CHAIN];

  const publicClient = createPublicClient({
    chain: defineChain({
      id: 2,
      name: 'Localhost',
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: { http: [bundler] },
      },
    }),
    transport: http(bundler),
  });

  const vote = getContract({
    address: voteContract,
    abi: voteAbi,
    client: {public: publicClient},
  });

  return vote;
}

export async function getZKPRequest(requestId) {
  const vote = getVoteReadContract();
  const request = await vote.read.getZKPRequest([requestId]);
  return request;
}


function submitZKPresponse(requestId, ) {
  return {
    to: '',
    value: BigInt(0),
    data: encodeFunctionData({
      abi: voteAbi,
      functionName: 'submitZKPResponse',
      args: [tableId, jsonUri]
    })
  }
}
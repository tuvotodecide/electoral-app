import { createPublicClient, encodeFunctionData, getContract, http } from "viem";
import voteAbi from '../abi/VoteAbi.json';
import { availableNetworks } from "./params";
import { CHAIN } from "@env";

function getVoteReadContract() {
  const { voteContract, bundler, chain } = availableNetworks[CHAIN];

  const publicClient = createPublicClient({
    chain,
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

export async function getOwnVoteInfo(voteId, nullifier) {
  const vote = getVoteReadContract();
  const ownVote = await vote.read.getOwnVoteInfo([voteId, nullifier]);
  return ownVote;
}

export function castVote(voteId, optionId, nullifier) {
  return {
    to: availableNetworks[CHAIN].voteContract,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: voteAbi,
      functionName: 'castVote',
      args: [voteId, optionId, nullifier]
    })
  };
}
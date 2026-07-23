import { createPublicClient, getContract, http } from "viem";
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

function voteIdToHex(voteId) {
  return BigInt(`0x${voteId}`);
}

export async function getOwnVoteInfo(voteId, nullifier) {
  const vote = getVoteReadContract();
  const ownVote = await vote.read.getOwnVoteInfo([voteIdToHex(voteId), nullifier]);
  return ownVote;
}

export async function getVoteInfo(voteId) {
  const vote = getVoteReadContract();
  const voteInfo = await vote.read.getVoteInfo([voteIdToHex(voteId)]);
  return {
    name: voteInfo[0],
    startDate: voteInfo[1],
    endDate: voteInfo[2],
    resultsDate: voteInfo[3],
    totalVoters: voteInfo[4],
    totalVotersMkRoot: voteInfo[5],
    registeredVoters: voteInfo[6],
    options: voteInfo[7],
  };
}
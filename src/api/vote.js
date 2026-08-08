import { createPublicClient, formatEther, getContract, http } from "viem";
import voteAbi from '../abi/VoteAbi.json';
import { availableNetworks } from "./params";
import { CHAIN } from "@env";
import { poseidon2 } from "poseidon-lite";

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

export function getRewardHash(electionId, secret) {
  const voteClaimIdHex = voteIdToHex(electionId + '2D526577617264'); // + 'reward' in hex
  const secretInt = BigInt(secret);
  return poseidon2([secretInt, voteClaimIdHex]);
}

export async function getVoteInfo(voteId) {
  const vote = getVoteReadContract();
  const voteInfo = await vote.read.getVoteInfo([voteIdToHex(voteId)]);
  return {
    name: voteInfo[0],
    startDate: voteInfo[1],
    endDate: voteInfo[2],
    resultsDate: voteInfo[3],
  };
}


export async function getOwnVoteInfo(voteId, nullifier) {
  const vote = getVoteReadContract();
  const ownVote = await vote.read.getOwnVoteInfo([voteIdToHex(voteId), nullifier]);
  return ownVote;
}

export async function getVoteReward() {
  const vote = getVoteReadContract();
  const rewardAmount = await vote.read.tvdPerVote();
  return { raw: rewardAmount, formatted: formatEther(rewardAmount)};
}

export async function hasReceivedReward(voteId, rewardHash) {
  const vote = getVoteReadContract();
  const hasReceived = await vote.read.hasReceivedReward([voteIdToHex(voteId), rewardHash]);
  return hasReceived;
}
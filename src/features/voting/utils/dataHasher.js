import { poseidon2 } from "poseidon-lite";

export function hashVoteNullifier(electionId, nullifier) {
  const voteIdHex = BigInt('0x' + electionId);
  return poseidon2([voteIdHex, nullifier]);
}

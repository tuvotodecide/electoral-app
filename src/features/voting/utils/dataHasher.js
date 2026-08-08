import { poseidon2 } from "poseidon-lite";

export function hashVoteNullifier(electionId, nullifier) {
  const voteIdHex = BigInt('0x' + electionId);
  const secretInt = BigInt(nullifier)
  return poseidon2([secretInt, voteIdHex]);
}

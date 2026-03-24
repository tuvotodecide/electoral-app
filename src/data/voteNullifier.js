import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export async function generateNullifierForVote() {
  const rawnullifier = await Crypto.getRandomBytesAsync(32);
  const nullifier = Array.from(rawnullifier)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return nullifier;
}

export async function saveNullifierForVote(voteId, nullifier) {
  try {
    const nullifiers = await AsyncStorage.getItem(`vote_ids`);
    let voteIds = nullifiers ? JSON.parse(nullifiers): {};

    voteIds[voteId] = nullifier;
    await AsyncStorage.setItem(`vote_ids`, JSON.stringify(voteIds));
  } catch (error) {
    console.error('Error saving nullifier:', error);
  }
}

export async function getNullifierForVote(voteId) {
  try {
    const nullifiers = await AsyncStorage.getItem(`vote_ids`);
    const voteIds = nullifiers ? JSON.parse(nullifiers) : {};
    return voteIds[voteId] || null;
  } catch (error) {
    console.error('Error retrieving nullifier:', error);
    return null;
  }
}

export async function hasNullifierForVote(voteId) {
  const nullifier = await getNullifierForVote(voteId);
  return nullifier !== null;
}
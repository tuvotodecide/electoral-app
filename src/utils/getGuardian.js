import {
  createPublicClient,
  http,
} from 'viem';
import { walletConfig }          from './constants';
import factoryAbi                from '../abi/SimpleAccountFactory.json';


export async function getPredictedGuardian(
  chainKey,
  account,
  salt
){
  const client = createPublicClient({
    chain: walletConfig[chainKey].chain,
    transport: http(),
  });

  try {
    
    const guardian = await client.readContract({
      address: walletConfig[chainKey].factory,
      abi: factoryAbi,
      functionName: 'getGuardianAddress',      
      args: [account,salt],
    });
    return guardian ;
  } catch (err) {
    console.warn('[getGuardianAddress] readContract error →', err);
    return null;
  }
}
import {
  createPublicClient,
  http,
} from 'viem';
import factoryAbi                from '../abi/SimpleAccountFactory.json';
import { availableNetworks, FACTORY_ADDRESS } from '../api/params';


export async function getPredictedGuardian(
  chainKey,
  account,
  salt
){
  const client = createPublicClient({
    chain: availableNetworks[chainKey].chain,
    transport: http(),
  });

  try {
    
    const guardian = await client.readContract({
      address: FACTORY_ADDRESS,
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
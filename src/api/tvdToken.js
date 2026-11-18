import { TVD_TOKEN_ADDRESS, CHAIN } from '@env';
import { availableNetworks, getReadRpcUrl } from "./params";
import { createPublicClient, erc20Abi, formatEther, getContract, http } from 'viem';


function getReadContract() {
  const { chain } = availableNetworks[CHAIN];

  const publicClient = createPublicClient({
    chain,
    transport: http(getReadRpcUrl(chain)),
  });

  const contract = getContract({
    address: TVD_TOKEN_ADDRESS,
    abi: erc20Abi,
    client: {public: publicClient},
  });

  return contract;
}

async function balanceOf(address) {
  const contract = getReadContract();
  const balance = await contract.read.balanceOf([address]);
  return { rawBalance: balance, formatted: formatEther(balance)};
}

export const TvdTokenCalls = {
  balanceOf
}
import { createPublicClient, getContract, http } from "viem";
import { availableNetworks } from "./params";
import { getAddress, ZeroAddress, zeroPadValue } from "ethers";

export async function checkTokenAvailibility(sourceChain, targetChain, token) {
  const tokenBridgeAbi = [
    {
      "type": "function",
      "name": "wrappedAsset",
      "inputs": [
        {
          "name": "tokenChainId",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "tokenAddress",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
  ];

  const client = createPublicClient({
    chain: availableNetworks[targetChain].chain,
    transport: http(),
  });

  const tokenBridge = getContract({
    address: availableNetworks[targetChain].wormholeBridge,
    abi: tokenBridgeAbi,
    client: {public: client},
  });

  // Convert the 20-byte token address to a 32-byte address padded with leading zeros
  const paddedToken = zeroPadValue(getAddress(token), 32);
  // Check if the token is attested on the target chain
  const wrappedTokenAddress = await tokenBridge.read.wrappedAsset([availableNetworks[sourceChain].wormholeChainId, paddedToken]);

  if (wrappedTokenAddress === ZeroAddress) {
    throw Error('Not available');
  } else {
    return wrappedTokenAddress;
  }
}
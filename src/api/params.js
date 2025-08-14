import { arbitrumSepolia } from "viem/chains";
import images from "../assets/images";
import { Image } from "react-native";
import {SPONSORSHIP_POLICY, FACTORY, BUNDLER} from "@env";

export const sponsorshipPolicyId = SPONSORSHIP_POLICY;
export const FACTORY_ADDRESS = FACTORY;

export const availableNetworks = {
	'arbitrum-sepolia': {
    chain: arbitrumSepolia,
    bundler: BUNDLER,
    explorer: 'https://sepolia.arbiscan.io/',
    nftExplorer: 'https://testnet.routescan.io/nft',
    oracle: '0x824CBE7b7C69e67D3E2A4757Aedb9D3E8eB63C80',
    attestationNft: '0xdCa6d6E8f4E69C3Cf86B656f0bBf9b460727Bed9',
  },
};

export const availableNetworkNames = ['arbitrum-sepolia'];
export const nativeTokens = {
  'arbitrum-sepolia': {
    networkName: 'Arbitrum Sepolia',
    symbol: 'ETH',
    name: 'Ethereum', 
    decimals: 18, 
    logo: Image.resolveAssetSource(images.EthImage).uri
  },
}

export const gasParams = {
  maxFeePerGas: BigInt(3000000000), // 3 Gwei
  maxPriorityFeePerGas: BigInt(100000000), // 0.1 Gwei (minimum required)
  callGasLimit: BigInt(1000000),
  verificationGasLimit: BigInt(110000),
  preVerificationGas: BigInt(100000),
	paymasterPostOpGasLimit: BigInt(90000),
	paymasterVerificationGasLimit: BigInt(100000)
};
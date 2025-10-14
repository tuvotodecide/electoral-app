import { arbitrum, arbitrumSepolia, base, baseSepolia } from "viem/chains";
import images from "../assets/images";
import { Image } from "react-native";
import {SPONSORSHIP_POLICY, FACTORY, BUNDLER, BUNDLER_MAIN} from "@env";

export const sponsorshipPolicyId = SPONSORSHIP_POLICY;
export const FACTORY_ADDRESS = FACTORY;

export const availableNetworks = {
	'arbitrum-sepolia': {
    chain: arbitrumSepolia,
    bundler: BUNDLER,
    explorer: 'https://sepolia.arbiscan.io/',
    nftExplorer: 'https://testnet.routescan.io/nft',
    oracle: '0x824CBE7b7C69e67D3E2A4757Aedb9D3E8eB63C80',
    juryRole: '0x9f70476b4563c57c3056cc4e8dffc8025828c99ea7a458e33c1502f84b53cc94',
    attestationNft: '0xdCa6d6E8f4E69C3Cf86B656f0bBf9b460727Bed9',
  },
  'arbitrum': {
    chain: arbitrum,
    bundler: BUNDLER_MAIN,
    explorer: 'https://arbiscan.io/',
    nftExplorer: 'https://routescan.io/nft',
    oracle: '0x349E50230C48F245D1707A9250aae97639e2f046',
    juryRole: '0x9f70476b4563c57c3056cc4e8dffc8025828c99ea7a458e33c1502f84b53cc94',
    attestationNft: '0x1FEEF5E4302AdE8Ac70Beff5F8bB7270c6a9aba1',
  },
  'base-sepolia': {
    chain: baseSepolia,
    bundler: BUNDLER,
    explorer: 'https://sepolia.basescan.org/',
    nftExplorer: 'https://testnet.routescan.io/nft',
    oracle: '0x91DB352d9836832364fDa5fFc6d7c8CF6FD78c38',
    userRole: '0x2db9fd3d099848027c2383d0a083396f6c41510d7acfd92adc99b6cffcf31e96',
    juryRole: '0x9f70476b4563c57c3056cc4e8dffc8025828c99ea7a458e33c1502f84b53cc94',
    attestationNft: '0x5D4f9dBD942C8D37dA57F6Ffd64cC9bF45939b0e',
  },
  'base': {
    chain: base,
    bundler: BUNDLER_MAIN,
    explorer: 'https://basescan.org/',
    nftExplorer: 'https://routescan.io/nft',
    oracle: '',
    userRole: '',
    juryRole: '',
    attestationNft: '',
  }
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
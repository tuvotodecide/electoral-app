import { baseSepolia, optimismSepolia, sepolia } from "viem/chains";
import images from "../assets/images";
import { Image } from "react-native";

export const PAYMASTER_ADDRESS = "0x051C4407243b512bb78E4809093C5F539942ccfd";
//export const TOKEN_PAYMASTER_ADDRESS = "0x63f8cDcf7F4C8dbE64801D32412Cc474E4d19Ff4"; //"0x05876fd44C60b7fb4b24C973b38ED1607936DAf7";
export const FACTORY_ADDRESS = "0x5Cb82e667a4346346E71EcAa2a31Aaa94e6Ee0d1";

export const availableNetworks = {
	'eth-sepolia': {
    chain: sepolia,
    bundler: 'https://eth-sepolia.g.alchemy.com/v2/1HZ0spY7inRe8hCdLeLCqvUh6itMQA18',
    explorer: 'https://sepolia.etherscan.io',
    wormholeBridge: '0xDB5492265f6038831E89f495670FF909aDe94bd9',
    wormholeChainId: 10002,
    tokenPaymaster: null,
    crossChainReveiver: null,
  },
  'opt-sepolia': {
    chain: optimismSepolia,
    bundler: 'https://opt-sepolia.g.alchemy.com/v2/1HZ0spY7inRe8hCdLeLCqvUh6itMQA18',
    explorer: 'https://sepolia-optimism.etherscan.io',
    wormholeBridge: '0x99737Ec4B815d816c49A385943baf0380e75c0Ac',
    wormholeChainId: 10005,
    tokenPaymaster: '0x4Ea8B3aCF1019a8Cd1B726E67Eac9e2c43161376',
    crossChainReveiver: null,
  },
  'base-sepolia': {
    chain: baseSepolia,
    bundler: 'https://base-sepolia.g.alchemy.com/v2/1HZ0spY7inRe8hCdLeLCqvUh6itMQA18',
    explorer: 'https://sepolia.basescan.org',
    wormholeBridge: '0x86F55A04690fd7815A3D802bD587e83eA888B239',
    wormholeChainId: 10004,
    tokenPaymaster: null,
    crossChainReveiver: '0x74934a887162BB8B2ffe2acB9D73afC241620Ed2', //'0xC92eFfEc6732410b147Dea6e5562Ce59F0AAeAeC',
  }
};

export const availableNetworkNames = ['eth-sepolia', 'opt-sepolia', 'base-sepolia'];
export const nativeTokens = {
  'eth-sepolia': {
    networkName: 'Ethereum Sepolia',
    symbol: 'ETH',
    name: 'Ethereum', 
    decimals: 18, 
    logo: Image.resolveAssetSource(images.EthImage).uri
  },
  'opt-sepolia': {
    networkName: 'OP Sepolia',
    symbol: 'ETH', 
    name: 'Ethereum', 
    decimals: 18, 
    logo: Image.resolveAssetSource(images.EthImage).uri
  },
  'base-sepolia': {
    networkName: 'Base Sepolia',
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
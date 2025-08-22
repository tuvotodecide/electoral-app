
import { optimismSepolia, polygonAmoy, sepolia } from "viem/chains";
export const AMOY_FACTORY_ADDRESS = "0xFC7D71cc697d3F5f14fF5e86FEdD031414473204";
export const SEPOLIA_FACTORY_ADDRESS = "0xF8b3188795DBA68C55600A6d7445C8b90F698E42";
export const OP_SEPOLIA_FACTORY_ADDRESS = "0x6022a985d024F1052627b5b62DAC52Df24aa18a8";
export const AMOY_BUNDLER = 'https://polygon-amoy.g.alchemy.com/v2/1HZ0spY7inRe8hCdLeLCqvUh6itMQA18';
export const SEPOLIA_BUNDLER = 'https://eth-sepolia.g.alchemy.com/v2/1HZ0spY7inRe8hCdLeLCqvUh6itMQA18';
export const OP_SEPOLIA_BUNDLER = 'https://opt-sepolia.g.alchemy.com/v2/1HZ0spY7inRe8hCdLeLCqvUh6itMQA18';
export const walletConfig= {
  amoy: {
    chain: polygonAmoy,
    bundler: AMOY_BUNDLER,
    factory: AMOY_FACTORY_ADDRESS,
    chainSelector: BigInt('16281711391670634445'),
  },
  sepolia: {
    chain: sepolia,
    bundler: SEPOLIA_BUNDLER,
    factory: SEPOLIA_FACTORY_ADDRESS,
    chainSelector: BigInt('16015286601757825753'),
  },
  opSepolia: {
    chain: optimismSepolia,
    bundler: OP_SEPOLIA_BUNDLER,
    factory: OP_SEPOLIA_FACTORY_ADDRESS,
    chainSelector: BigInt('5224473277236331295'),
  },
}
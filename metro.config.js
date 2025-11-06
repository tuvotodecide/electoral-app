const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
const defaultConfig = getDefaultConfig(__dirname);
const {assetExts, sourceExts} = defaultConfig.resolver;

const extraNodeModules = {
  crypto: path.resolve(__dirname, 'node_modules/react-native-quick-crypto'),
  stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
  vm: path.resolve(__dirname, 'node_modules/vm-browserify'),
  util: path.resolve(__dirname, 'node_modules/util/'),
  process: path.resolve(__dirname, 'node_modules/process/browser.js'),
  path: path.resolve(__dirname, 'node_modules/path-browserify'),
  assert: path.resolve(__dirname, 'node_modules/assert/'),
  buffer: path.resolve(__dirname, 'node_modules/buffer/'),
  zlib: path.resolve(__dirname, 'node_modules/pako/'),
  http: path.resolve(__dirname, 'node_modules/stream-http/'),
  https: path.resolve(__dirname, 'node_modules/https-browserify/'),
  'react-native-fs': path.resolve(__dirname, 'node_modules/react-native-fs'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs', 'ts', 'tsx'],
    extraNodeModules,
    blockList: [ /wira-sdk[\/\\]node_modules[\/\\]react-native[\/\\]/, ],
  },
  watchFolders: [path.resolve(__dirname, '../wira-sdk')],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

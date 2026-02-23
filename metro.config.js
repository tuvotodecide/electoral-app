const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const { resolver } = config;

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
  url: path.resolve(__dirname, 'polyfills/url.js'),
  fs: path.resolve(__dirname, 'node_modules/react-native-level-fs'),
  'react-native-fs': path.resolve(__dirname, 'node_modules/react-native-fs'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg", "cjs", "ts", "tsx", "mjs"],
  extraNodeModules,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'jose' || moduleName.startsWith('jose/')) {
      // Redirect to browser build
      const browserPath = moduleName === 'jose' 
        ? 'jose/dist/browser/index.js'
        : moduleName.replace('jose/', 'jose/dist/browser/');
      return context.resolveRequest(context, browserPath, platform);
    }

    // Polyfill pino for React Native (used by pino-caller in wira-sdk)
    if (moduleName === 'pino' || moduleName.startsWith('pino/')) {
      return {
        filePath: path.resolve(__dirname, 'polyfills/pino.js'),
        type: 'sourceFile',
      };
    }

    // Mock node-localstorage for React Native
    if (moduleName === 'node-localstorage') {
      return {
        type: 'empty',
      };
    }

    // Patch asyncstorage-down to use @react-native-async-storage/async-storage
    if (moduleName === './default-opts' && context.originModulePath.includes('asyncstorage-down')) {
      return {
        filePath: path.resolve(__dirname, 'polyfills/asyncstorage-down-opts.js'),
        type: 'sourceFile',
      };
    }

    return context.resolveRequest(context, moduleName, platform);
  },
  blockList: [/wira-sdk[\/\\]node_modules[\/\\]react-native[\/\\]/],
};

config.watchFolders = [path.resolve(projectRoot, "../wira-sdk")];

module.exports = config;

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
// @privado-id/expo-sdk se instala con `link:../privado-sdk-expo` (symlink fuera
// del proyecto): Metro tiene que vigilar esa carpeta para poder empaquetarlo.
const privadoSdkRoot = path.resolve(projectRoot, '../privado-sdk-expo');
const config = getDefaultConfig(projectRoot);

const BROWSER_ESM_ONLY_PACKAGES = [
  '@iden3/js-crypto',
  '@iden3/js-iden3-core',
  '@iden3/js-jsonld-merklization',
  '@iden3/js-merkletree',
  '@iden3/js-jwz',
  '@0xpolygonid/js-sdk',
];

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
  assetExts: [
    ...resolver.assetExts.filter((ext) => ext !== "svg"),
    "wasm",
    "zkey",
    "txt",
  ],
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

    // Estos paquetes solo exponen "exports" con condiciones node/browser/umd
    // (sin "main" ni "react-native"/"default"), así que Metro en Android/iOS no
    // encuentra entrada. Se apunta directo al build browser ESM. Ruta directa:
    // require.resolve respeta "exports" y este subpath no está exportado.
    if (BROWSER_ESM_ONLY_PACKAGES.includes(moduleName)) {
      return {
        type: 'sourceFile',
        filePath: path.join(
          privadoSdkRoot,
          'node_modules',
          moduleName,
          'dist/browser/esm/index.js',
        ),
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
  // Las dependencias nativas que el SDK pide como peer (react-native, expo-*,
  // @iden3/react-native-*) solo están en node_modules de la app.
  nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
  // Una sola copia de React y React Native: nunca las del node_modules del SDK.
  blockList: [/privado-sdk-expo[\/\\]node_modules[\/\\](react|react-native)[\/\\]/],
};

config.watchFolders = [privadoSdkRoot];

module.exports = config;

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Replace import.meta with a plain object (works in release/Hermes)
    require('./babel/plugins/transformImportMetaToObject'),

    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
    ['@babel/plugin-transform-export-namespace-from', { allowNamespaces: true }],
    ['babel-plugin-transform-import-meta', { module: 'ES6' }],
    'react-native-reanimated/plugin', // SIEMPRE el último
  ],
  env: {
    production: {
      plugins: [
        'react-native-paper/babel',
        'react-native-reanimated/plugin', // SIEMPRE el último
      ],
    },
  },
};

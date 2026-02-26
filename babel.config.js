const path = require('path');

const envPath = path.resolve(__dirname, '.env');

module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);
  const dotenvPlugin = ['module:react-native-dotenv', { moduleName: '@env', path: envPath }];
  return {
    presets: [
      [
        'babel-preset-expo',
        {

          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      // Replace import.meta with a plain object (works in release/Hermes)
      require('./babel/plugins/transformImportMetaToObject'),
      ...(isTest ? [] : [dotenvPlugin]),
      ['@babel/plugin-transform-export-namespace-from', { allowNamespaces: true }],
      ['babel-plugin-transform-define', { '__filename': '""', '__dirname': '""' }],

      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  }
}

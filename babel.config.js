module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
    ['@babel/plugin-transform-export-namespace-from', { allowNamespaces: true }],
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

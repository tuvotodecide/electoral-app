// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    files: ['babel.config.js', 'metro.config.js', 'jest.config.js', 'react-native.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    plugins: {
      "unused-imports": require("eslint-plugin-unused-imports"),
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^@env$'] }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'import/no-unused-modules': [
        'warn',
        {
          unusedExports: true,
          missingExports: false,
          src: [
            'App.js',
            'index.js',
            'src/**/*.{js,jsx,ts,tsx}',
            '__tests__/**/*.{js,ts,tsx}'
          ]
        }
      ]
    }
  }
]);

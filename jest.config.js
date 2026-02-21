// module.exports = {
//   preset: 'react-native',
//   setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
//   transformIgnorePatterns: [
//     'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|@react-native-firebase|react-native-biometrics|react-native-keychain|@twotalltotems|react-redux|@reduxjs)/)',
//   ],
//   collectCoverageFrom: [
//     'src/**/*.{js,jsx,ts,tsx}',
//     '!src/**/*.test.{js,jsx,ts,tsx}',
//     '!src/assets/**',
//     '!src/**/__tests__/**',
//     '!**/__mocks__/**',
//   ],
//   testMatch: [
//     '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
//     '<rootDir>/__tests__/**/*.spec.{js,jsx,ts,tsx}',
//   ],
//   moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/src/$1',
//     '^~/(.*)$': '<rootDir>/$1',
//   },
// };


module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/__tests__/setup/jest.setup.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '<rootDir>/__tests__/__mocks__/',
    '<rootDir>/__tests__/setup/',
  ],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.spec.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^react-native-fs$': '<rootDir>/__tests__/__mocks__/react-native-fs.js',
    '^wira-sdk$': '<rootDir>/__tests__/__mocks__/wira-sdk.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
};

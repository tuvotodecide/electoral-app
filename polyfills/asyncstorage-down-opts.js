/**
 * Patched version of asyncstorage-down/default-opts.js
 * Uses @react-native-async-storage/async-storage instead of deprecated react-native AsyncStorage
 */
module.exports = {
  get AsyncStorage() {
    return require('@react-native-async-storage/async-storage').default;
  }
};

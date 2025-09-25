module.exports = {
  project: {ios: {}, android: {}},
  dependencies: {
    'react-native-vector-icons': {platforms: {ios: null}},

    // Desactivar Firebase y Notifee en iOS (solo se usarán en Android)
    '@react-native-firebase/app': {platforms: {ios: null}},
    '@react-native-firebase/auth': {platforms: {ios: null}},
    '@react-native-firebase/database': {platforms: {ios: null}},
    '@react-native-firebase/functions': {platforms: {ios: null}},
    '@react-native-firebase/messaging': {platforms: {ios: null}},
    '@notifee/react-native': {platforms: {ios: null}},
  },
  assets: ['./src/assets/fonts'],
};

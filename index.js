/**
 * @format
 */

// ============================================================================
// SENTRY - Inicializar ANTES de cualquier otro import
// ============================================================================
import { initSentry } from './src/config/sentry';
initSentry();
// ============================================================================

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';
import 'react-native-gesture-handler';

import crypto from 'react-native-quick-crypto';
import {Buffer} from 'buffer';
import process from 'process';
import { WebAssembly } from 'polywasm';

global.crypto = {
  ...global.crypto,
  ...crypto.webcrypto
};
global.Buffer = Buffer;
global.process = process;
globalThis.WebAssembly = WebAssembly;

if (__DEV__) {
  require('./ReactotronConfig');
}
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import {Provider} from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './src/redux/store';
import {PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {registerBackgroundHandler} from './src/services/notifications';
registerBackgroundHandler();

const RNRoot = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider>
            <App />
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};
AppRegistry.registerComponent(appName, () => RNRoot);

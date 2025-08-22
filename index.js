/**
 * @format
 */
if (__DEV__) {
  require('./ReactotronConfig');
}
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';
import 'react-native-quick-crypto';

import {Buffer} from 'buffer';
global.Buffer = Buffer;

import process from 'process';
global.process = process;

global.crypto = crypto.webcrypto;
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import {Provider} from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './src/redux/store';
import {PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';

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

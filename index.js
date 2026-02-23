import './polyfills';

if (__DEV__) {
  require('./ReactotronConfig');
}

import { initSentry } from './src/config/sentry';
initSentry();
const { registerRootComponent } = require('expo');
const Root = require('./App').default;

registerRootComponent(Root);

import './polyfills';

import { initSentry } from './src/config/sentry';

if (__DEV__) {
  require('./ReactotronConfig');
}
initSentry();
const { registerRootComponent } = require('expo');
const Root = require('./App').default;

registerRootComponent(Root);

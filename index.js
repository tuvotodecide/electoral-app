import './polyfills';
const { registerRootComponent } = require('expo');
const Root = require('./App').default;

registerRootComponent(Root);
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';
import './polyfills/importMeta';

import { Buffer } from 'buffer';
import { WebAssembly } from 'polywasm';
import process from 'process';
import crypto from 'react-native-quick-crypto';

global.crypto = {
  ...global.crypto,
  ...crypto.webcrypto
};
global.Buffer = Buffer;
global.process = process;
global.process.versions.node = 'v22.20.0'
globalThis.WebAssembly = WebAssembly;

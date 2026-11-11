import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';
import './polyfills/importMeta';

import { Buffer } from 'buffer';
import { WebAssembly } from 'polywasm';
import process from 'process';
import crypto from 'react-native-quick-crypto';

// react-native-quick-crypto 1.x ya no tiene `webcrypto`: `subtle` y `CryptoKey`
// están en la raíz del módulo. `getRandomValues` sigue viniendo de
// react-native-get-random-values (importado arriba).
global.crypto = {
  ...global.crypto,
  subtle: crypto.subtle,
  SubtleCrypto: crypto.Subtle,
  CryptoKey: crypto.CryptoKey,
};
global.Buffer = Buffer;
global.process = process;
global.process.versions.node = 'v22.20.0'
globalThis.WebAssembly = WebAssembly;

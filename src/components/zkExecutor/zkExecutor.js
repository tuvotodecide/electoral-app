import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

// Vendored browser (UMD) build of snarkjs, see assets/zkExecutor/vendor/README.md
// for how to generate it. Kept as a plain-text asset so Metro never tries to
// parse/bundle it as a JS module.
const SNARKJS_SOURCE_MODULE = require('../../../assets/zkExecutor/vendor/snarkjs.min.txt');

let requestSeq = 0;

const buildHtml = snarkjsSource => `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>${snarkjsSource}</script>
    <script>
      function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }

      function post(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }

      async function handleMessage(event) {
        var message;
        try {
          message = JSON.parse(event.data);
        } catch (error) {
          return;
        }
        if (!message || message.type !== 'GENERATE_PROOF') return;

        var requestId = message.requestId;
        try {
          var wasm = base64ToBytes(message.wasmBase64);
          var zkey = base64ToBytes(message.zkeyBase64);
          var result = await snarkjs.groth16.fullProve(message.input, wasm, zkey);
          post({
            requestId: requestId,
            ok: true,
            proof: result.proof,
            publicSignals: result.publicSignals,
          });
        } catch (error) {
          post({
            requestId: requestId,
            ok: false,
            error: String((error && error.message) || error),
          });
        }
      }

      document.addEventListener('message', handleMessage);
      window.addEventListener('message', handleMessage);
      post({ type: 'READY' });
    </script>
  </body>
</html>`;

/**
 * Resolves a bundled circuit asset (a require()'d .wasm/.zkey module) to a
 * base64 string, downloading it out of the app bundle onto disk first if
 * this is the first time it's read.
 */
export const loadCircuitAssetAsBase64 = async assetModule => {
  const asset = Asset.fromModule(assetModule);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  return new File(asset.localUri).base64();
};

/**
 * Hidden WebView that runs snarkjs (incompatible with Hermes) to produce
 * Groth16 proofs. Talks to the page purely over postMessage/base64 so it
 * never needs file:// access from inside the WebView.
 *
 * Usage:
 *   const zkRef = useRef(null);
 *   <ZkExecutor ref={zkRef} />
 *   const { proof, publicSignals } = await zkRef.current.generateProof({
 *     wasm: require('../../../assets/zkExecutor/circuits/vote/circuit.wasm'),
 *     zkey: require('../../../assets/zkExecutor/circuits/vote/circuit_final.zkey'),
 *     input: { ... },
 *   });
 */
const ZkExecutor = forwardRef((props, ref) => {
  const webViewRef = useRef(null);
  const pendingRequests = useRef(new Map());
  const readyRef = useRef(null);
  const [html, setHtml] = useState(null);

  if (!readyRef.current) {
    let resolveReady;
    const promise = new Promise(resolve => {
      resolveReady = resolve;
    });
    readyRef.current = { promise, resolve: resolveReady };
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const asset = Asset.fromModule(SNARKJS_SOURCE_MODULE);
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      const source = await new File(asset.localUri).text();
      if (!cancelled) {
        setHtml(buildHtml(source));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMessage = useCallback(event => {
    let message;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch (_error) {
      return;
    }

    if (message.type === 'READY') {
      readyRef.current.resolve();
      return;
    }

    const pending = pendingRequests.current.get(message.requestId);
    if (!pending) return;
    pendingRequests.current.delete(message.requestId);

    if (message.ok) {
      pending.resolve({ proof: message.proof, publicSignals: message.publicSignals });
    } else {
      pending.reject(new Error(message.error || 'ZK proof generation failed'));
    }
  }, []);

  const generateProof = useCallback(async ({ wasm, zkey, input }) => {
    const [wasmBase64, zkeyBase64] = await Promise.all([
      typeof wasm === 'string' ? wasm : loadCircuitAssetAsBase64(wasm),
      typeof zkey === 'string' ? zkey : loadCircuitAssetAsBase64(zkey),
    ]);

    await readyRef.current.promise;
    if (!webViewRef.current) {
      throw new Error('zkExecutor WebView is not mounted');
    }

    requestSeq += 1;
    const requestId = `zk_${Date.now()}_${requestSeq}`;

    return new Promise((resolve, reject) => {
      pendingRequests.current.set(requestId, { resolve, reject });
      webViewRef.current.postMessage(
        JSON.stringify({ type: 'GENERATE_PROOF', requestId, input, wasmBase64, zkeyBase64 }),
      );
    });
  }, []);

  useImperativeHandle(ref, () => ({ generateProof }), [generateProof]);

  if (!html) return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
});

ZkExecutor.displayName = 'ZkExecutor';

export default ZkExecutor;

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  webview: {
    width: 1,
    height: 1,
  },
});

# snarkjs browser build

`zkExecutor.js` inlines this file's contents as a `<script>` tag inside the
hidden WebView, so it must be the **browser (UMD) build** of snarkjs, saved
with a `.txt` extension (Metro is configured to treat `.txt`/`.wasm`/`.zkey`
as opaque binary assets — see `metro.config.js`).

Generate it from the `snarkjs` npm package:

```sh
npm install --save-dev snarkjs
cp node_modules/snarkjs/build/snarkjs.min.js assets/zkExecutor/vendor/snarkjs.min.txt
```

Re-run the copy whenever you bump the `snarkjs` version.

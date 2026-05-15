#!/usr/bin/env bash
set -euo pipefail

SDK_DIR="vendor/wira-sdk"

if [ ! -d "$SDK_DIR" ]; then
  echo "[build_wira_sdk] Missing $SDK_DIR"
  exit 1
fi

cd "$SDK_DIR"

echo "[build_wira_sdk] Cleaning wira-sdk local install..."
rm -rf node_modules package-lock.json lib

echo "[build_wira_sdk] Installing wira-sdk dev dependencies..."
npm install --legacy-peer-deps --include=dev --ignore-scripts

echo "[build_wira_sdk] Resolving react-native-builder-bob entry..."
BOB_ENTRY="$(node -e "const path=require('path'); const pkg=require.resolve('react-native-builder-bob/package.json'); console.log(path.join(path.dirname(pkg), 'lib', 'index.js'))")"

if [ ! -f "$BOB_ENTRY" ]; then
  echo "[build_wira_sdk] Bob entry not found: $BOB_ENTRY"
  exit 1
fi

echo "[build_wira_sdk] Building wira-sdk with bob..."
node "$BOB_ENTRY" build

cd ../..

if [ ! -f "vendor/wira-sdk/lib/module/index.js" ]; then
  echo "[build_wira_sdk] Missing vendor/wira-sdk/lib/module/index.js after build"
  exit 1
fi

if [ ! -f "vendor/wira-sdk/lib/typescript/src/index.d.ts" ]; then
  echo "[build_wira_sdk] Missing vendor/wira-sdk/lib/typescript/src/index.d.ts after build"
  exit 1
fi

echo "[build_wira_sdk] wira-sdk built successfully"
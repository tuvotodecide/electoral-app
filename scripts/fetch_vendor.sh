#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VENDOR_ZIP_URL:-}" ]]; then
  echo "VENDOR_ZIP_URL is not defined. Set it before running the vendor fetch step." >&2
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_PATH="$PROJECT_ROOT/vendor.zip"
TARGET_DIR="$PROJECT_ROOT/vendor"
TMP_DIR="$(mktemp -d)"
EXTRACT_DIR="$TMP_DIR/extracted"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

rm -f "$ZIP_PATH"

echo "Downloading vendor.zip from VENDOR_ZIP_URL"
curl -L "$VENDOR_ZIP_URL" -o "$ZIP_PATH"

HEADER_SAMPLE="$(head -c 2048 "$ZIP_PATH" | LC_ALL=C tr -d '\000' | LC_ALL=C tr '[:upper:]' '[:lower:]')"
if [[ "$HEADER_SAMPLE" == *"<!doctype html"* ]] || [[ "$HEADER_SAMPLE" == *"<html"* ]]; then
  echo "Downloaded file is HTML, not a ZIP. Verify VENDOR_ZIP_URL points to a direct ZIP download." >&2
  exit 1
fi

if ! unzip -tq "$ZIP_PATH" >/dev/null; then
  echo "Downloaded file is not a valid ZIP archive." >&2
  exit 1
fi

mkdir -p "$EXTRACT_DIR"
unzip -q "$ZIP_PATH" -d "$EXTRACT_DIR"

if [[ ! -d "$EXTRACT_DIR/vendor" ]]; then
  echo "The ZIP must contain a root vendor/ directory." >&2
  exit 1
fi

rm -rf "$TARGET_DIR"
mv "$EXTRACT_DIR/vendor" "$TARGET_DIR"

for required_dir in \
  "$TARGET_DIR/wira-sdk-flutter-component" \
  "$TARGET_DIR/wira-sdk" \
  "$TARGET_DIR/polygonid-flutter-sdk"
do
  if [[ ! -d "$required_dir" ]]; then
    echo "Missing required vendor directory: $required_dir" >&2
    exit 1
  fi
done

echo "Vendor ready."

#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_ROOT="$PROJECT_ROOT/.flutter"
FLUTTER_COMPONENT_DIR="$PROJECT_ROOT/vendor/wira-sdk-flutter-component"
PODHELPER_PATH="$FLUTTER_COMPONENT_DIR/.ios/Flutter/podhelper.rb"
FLUTTER_PODHELPER_PATH="$FLUTTER_ROOT/packages/flutter_tools/bin/podhelper.rb"
GENERATED_XCCONFIG="$FLUTTER_COMPONENT_DIR/.ios/Flutter/Generated.xcconfig"
FLUTTER_EXPORT_ENV="$FLUTTER_COMPONENT_DIR/.ios/Flutter/flutter_export_environment.sh"

if [[ ! -d "$FLUTTER_COMPONENT_DIR" ]]; then
  echo "[setup_flutter_vendor] Missing $FLUTTER_COMPONENT_DIR" >&2
  exit 1
fi

if [[ ! -d "$FLUTTER_ROOT" ]]; then
  echo "[setup_flutter_vendor] Cloning Flutter SDK into $FLUTTER_ROOT"
  git clone --depth 1 -b stable https://github.com/flutter/flutter.git "$FLUTTER_ROOT"
fi

export FLUTTER_ROOT="$FLUTTER_ROOT"
export PATH="$FLUTTER_ROOT/bin:$PATH"

flutter --version

echo "[setup_flutter_vendor] Precache Flutter iOS artifacts..."
flutter precache --ios

cd "$FLUTTER_COMPONENT_DIR"
flutter pub get

if [[ -f "$GENERATED_XCCONFIG" ]]; then
  python3 - "$GENERATED_XCCONFIG" "$PROJECT_ROOT/.flutter" <<'PY'
import sys
from pathlib import Path

file_path = Path(sys.argv[1])
flutter_root = sys.argv[2]

content = file_path.read_text()
lines = content.splitlines()

updated = []
replaced = False

for line in lines:
    if line.startswith("FLUTTER_ROOT="):
        updated.append(f"FLUTTER_ROOT={flutter_root}")
        replaced = True
    else:
        updated.append(line)

if not replaced:
    updated.append(f"FLUTTER_ROOT={flutter_root}")

file_path.write_text("\n".join(updated) + "\n")
PY
fi

if [[ -f "$FLUTTER_EXPORT_ENV" ]]; then
  python3 - "$FLUTTER_EXPORT_ENV" "$PROJECT_ROOT/.flutter" <<'PY'
import sys
from pathlib import Path

file_path = Path(sys.argv[1])
flutter_root = sys.argv[2]

content = file_path.read_text()
lines = content.splitlines()

updated = []
replaced = False

for line in lines:
    if line.startswith("export FLUTTER_ROOT="):
        updated.append(f'export FLUTTER_ROOT="{flutter_root}"')
        replaced = True
    else:
        updated.append(line)

if not replaced:
    updated.append(f'export FLUTTER_ROOT="{flutter_root}"')

file_path.write_text("\n".join(updated) + "\n")
PY
fi

if [[ ! -f "$PODHELPER_PATH" ]]; then
  echo "[setup_flutter_vendor] Missing $PODHELPER_PATH" >&2
  exit 1
fi

if [[ ! -f "$FLUTTER_PODHELPER_PATH" ]]; then
  echo "[setup_flutter_vendor] Missing $FLUTTER_PODHELPER_PATH" >&2
  exit 1
fi

echo "[setup_flutter_vendor] Flutter vendor ready"

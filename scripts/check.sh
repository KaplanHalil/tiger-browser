#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

printf '== rust ==\n'
cargo test --manifest-path native/Cargo.toml

printf '\n== javascript ==\n'
for file in \
  extension/tiger-tools/background.js \
  extension/tiger-tools/newtab.js \
  extension/tiger-theme/background.js \
  extension/tiger-theme/popup.js; do
  node --check "$file"
  printf '  ok %s\n' "$file"
done

printf '\n== manifests ==\n'
for file in extension/tiger-tools/manifest.json extension/tiger-theme/manifest.json; do
  python3 -m json.tool "$file" >/dev/null
  printf '  ok %s\n' "$file"
done

printf '\n== extensions ==\n'
./scripts/build-extensions.sh

printf '\n== web-ext lint ==\n'
for name in tiger-tools tiger-theme; do
  npx --yes web-ext@latest lint --source-dir "extension/$name" --output text
  printf '  ok %s\n' "$name"
done

printf '\nall checks passed\n'

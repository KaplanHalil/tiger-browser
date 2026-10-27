#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
mkdir -p "$DIST"

build_one() {
  local name="$1"
  local source="$ROOT/extension/$name"
  local output="$DIST/$name.xpi"

  if [[ ! -f "$source/manifest.json" ]]; then
    echo "missing manifest: $source/manifest.json" >&2
    exit 1
  fi

  rm -f "$output"
  (
    cd "$source"
    zip -qr "$output" . \
      -x '*.DS_Store' \
      -x '__MACOSX/*' \
      -x '*.xpi' \
      -x '*.zip'
  )
  printf '%s  %s\n' "$(sha256sum "$output" | cut -d' ' -f1)" "$output"
}

build_one tiger-tools
build_one tiger-theme

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

cargo build --release --manifest-path "$ROOT/native/Cargo.toml"
mkdir -p "$ROOT/dist"
install -m 755 "$ROOT/native/target/release/tiger-host" "$ROOT/dist/tiger-host"

printf 'tiger-host built: %s\n' "$ROOT/dist/tiger-host"

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert (librsvg) gerekli." >&2
  exit 1
fi

mkdir -p "$ROOT/branding/png" \
  "$ROOT/extension/tiger-tools/icons" \
  "$ROOT/extension/tiger-theme/icons"

for size in 16 24 32 48 64 96 128 256 512; do
  rsvg-convert -w "$size" -h "$size" "$ROOT/branding/tiger.svg" \
    -o "$ROOT/branding/png/tiger-$size.png"
  rsvg-convert -w "$size" -h "$size" "$ROOT/branding/tiger-mark.svg" \
    -o "$ROOT/branding/png/mark-$size.png"
done

for size in 16 32 48 96 128; do
  cp "$ROOT/branding/png/mark-$size.png" "$ROOT/extension/tiger-tools/icons/mark-$size.png"
  cp "$ROOT/branding/png/mark-$size.png" "$ROOT/extension/tiger-theme/icons/mark-$size.png"
done

for size in 16 32 48 96 128; do
  rsvg-convert -w "$size" -h "$size" "$ROOT/branding/terminal.svg" \
    -o "$ROOT/extension/tiger-tools/icons/terminal-$size.png"
  rsvg-convert -w "$size" -h "$size" "$ROOT/branding/theme.svg" \
    -o "$ROOT/extension/tiger-theme/icons/theme-$size.png"
done

printf 'icons rebuilt\n'

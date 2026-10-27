#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist/signed"

if [[ -z "${WEB_EXT_API_KEY:-}" || -z "${WEB_EXT_API_SECRET:-}" ]]; then
  cat >&2 <<'EOF'
AMO API anahtarları yok.

  1. https://addons.mozilla.org/developers/addon/api/key/
  2. export WEB_EXT_API_KEY="..."
     export WEB_EXT_API_SECRET="..."
  3. ./scripts/sign.sh

Not: "unlisted" kanalı ücretsizdir; XPI Mozilla tarafından imzalanır.
EOF
  exit 1
fi

mkdir -p "$DIST"

sign_one() {
  local name="$1"
  printf 'signing %s...\n' "$name"
  npx --yes web-ext@latest sign \
    --source-dir "$ROOT/extension/$name" \
    --artifacts-dir "$DIST" \
    --channel unlisted \
    --api-key "$WEB_EXT_API_KEY" \
    --api-secret "$WEB_EXT_API_SECRET"
}

sign_one tiger-tools
sign_one tiger-theme

printf '\nsigned artifacts:\n'
find "$DIST" -maxdepth 1 -type f -name '*.xpi' -printf '  %f\n'

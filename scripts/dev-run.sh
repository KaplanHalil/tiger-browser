#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="${TIGER_PROFILE:-${XDG_CONFIG_HOME:-$HOME/.config}/tiger/profile}"
FIREFOX="${TIGER_FIREFOX:-}"

if [[ -z "$FIREFOX" ]]; then
  if [[ -f "$(dirname "$PROFILE")/firefox.path" ]]; then
    read -r FIREFOX <"$(dirname "$PROFILE")/firefox.path" || true
  fi
fi
if [[ -z "$FIREFOX" ]]; then
  FIREFOX="$(command -v firefox || true)"
fi
if [[ -z "$FIREFOX" ]]; then
  echo "Firefox bulunamadı. TIGER_FIREFOX=/path/to/firefox ./scripts/dev-run.sh" >&2
  exit 1
fi

"$ROOT/scripts/build-extensions.sh"

cat <<EOF

Tiger Tools'u geçici olarak yüklemek için:

  1. Tiger'ı başlat: $ROOT/packaging/tiger
  2. about:debugging#/runtime/this-firefox
  3. "Load Temporary Add-on" -> $ROOT/dist/tiger-tools.xpi
  4. Aynı şeyi tiger-theme.xpi için tekrarla.

Ya da yalnızca Tiger Tools ile web-ext kullan:

  npx --yes web-ext@latest run \\
    --source-dir "$ROOT/extension/tiger-tools" \\
    --firefox "$FIREFOX" \\
    --firefox-profile "$PROFILE" \\
    --keep-profile-changes

Kalıcı kurulum için önce ./scripts/sign.sh, sonra ./install.sh.
EOF

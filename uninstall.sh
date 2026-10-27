#!/usr/bin/env bash
set -euo pipefail

PREFIX="${TIGER_PREFIX:-$HOME/.local}"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/tiger"
PROFILE="${TIGER_PROFILE:-$CONFIG/profile}"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/tiger"
KEEP_DATA=0

if [[ "${1:-}" == "--keep-data" ]]; then
  KEEP_DATA=1
fi

echo "Tiger Lite kaldırılıyor..."

rm -f "$PREFIX/bin/tiger"
rm -rf "$PREFIX/lib/tiger"
rm -f "$HOME/.mozilla/native-messaging-hosts/org.tiger.host.json"
rm -f "$HOME/.local/share/applications/tiger.desktop"

for size in 16 24 32 48 64 128 256 512; do
  rm -f "$HOME/.local/share/icons/hicolor/${size}x${size}/apps/tiger.png"
done

if [[ "$KEEP_DATA" -eq 1 ]]; then
  echo "Profil korundu: $PROFILE"
else
  rm -rf "$PROFILE"
  rm -rf "$STATE"
  echo "Profil ve Tiger verileri silindi: $PROFILE"
fi

echo "Varsayılan Firefox profiline dokunulmadı."
echo "Bitti."

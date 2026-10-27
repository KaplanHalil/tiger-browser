#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=versions.env
source "$ROOT/versions.env"

PREFIX="${TIGER_PREFIX:-$HOME/.local}"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/tiger"
PROFILE="${TIGER_PROFILE:-$CONFIG/profile}"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/tiger"
FIREFOX=""
MISSING_TIGER_EXTENSIONS=0

say() { printf '  %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }

detect_firefox() {
  if [[ -n "${TIGER_FIREFOX:-}" ]]; then
    printf '%s\n' "$TIGER_FIREFOX"
    return 0
  fi
  if command -v firefox >/dev/null 2>&1; then
    command -v firefox
    return 0
  fi
  for candidate in /usr/lib/firefox/firefox "$HOME/.local/share/tiger/firefox/firefox"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

if ! FIREFOX="$(detect_firefox)"; then
  cat >&2 <<'EOF'
Tiger: Firefox bulunamadı.

  omarchy install browser firefox

Firefox kurulduktan sonra ./install.sh komutunu tekrar çalıştır.
Taşınabilir bir Firefox kullanacaksan:
  TIGER_FIREFOX=/path/to/firefox ./install.sh
EOF
  exit 1
fi

if [[ "$FIREFOX" != /* ]]; then
  FIREFOX="$(command -v "$FIREFOX" || true)"
fi
if [[ ! -x "$FIREFOX" ]]; then
  echo "Tiger: Firefox çalıştırılabilir değil: $FIREFOX" >&2
  exit 1
fi

VERSION_LINE="$("$FIREFOX" --version 2>/dev/null | head -n1 || true)"
MAJOR="$(printf '%s\n' "$VERSION_LINE" | sed -n 's/.*Mozilla Firefox \([0-9][0-9]*\).*/\1/p')"
if [[ -n "$MAJOR" && "$MAJOR" -lt 142 ]]; then
  echo "Tiger: Firefox 140 veya üstü gerekli. Bulunan: $VERSION_LINE" >&2
  exit 1
fi

for tool in curl sha256sum python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Tiger: $tool gerekli." >&2
    exit 1
  fi
done

if ! command -v cargo >/dev/null 2>&1 && [[ ! -x "$ROOT/dist/tiger-host" ]]; then
  echo "Tiger: Rust (cargo) gerekli, ya da dist/tiger-host hazır olmalı." >&2
  exit 1
fi

if ! command -v hyprctl >/dev/null 2>&1 || ! command -v foot >/dev/null 2>&1 || ! command -v tmux >/dev/null 2>&1; then
  warn "hyprctl/foot/tmux eksik: terminal butonu çalışmayacak."
fi

echo
echo "Tiger Lite $TIGER_VERSION"
say "Firefox : $FIREFOX"
say "Profil  : $PROFILE"
echo

mkdir -p \
  "$PROFILE/chrome" \
  "$PROFILE/extensions" \
  "$PREFIX/bin" \
  "$PREFIX/lib/tiger" \
  "$HOME/.mozilla/native-messaging-hosts" \
  "$HOME/.local/share/applications" \
  "$STATE"

if [[ -e "$PROFILE/lock" ]]; then
  warn "Tiger açık görünüyor. Kapatıp ./install.sh komutunu tekrar çalıştır."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
for file in user.js chrome/userChrome.css; do
  if [[ -f "$PROFILE/$file" ]]; then
    cp -a "$PROFILE/$file" "$PROFILE/$file.bak.$STAMP"
  fi
done

install -m 644 "$ROOT/profile/user.js" "$PROFILE/user.js"
install -m 644 "$ROOT/profile/chrome/userChrome.css" "$PROFILE/chrome/userChrome.css"

# Firefox shows a one-time "an extension changed your new tab" doorhanger.
# Tiger is a browser distribution, not a surprise: pre-confirm the override.
python3 - "$PROFILE/extension-settings.json" <<'PY'
import json
import os
import sys

path = sys.argv[1]
data = {}
if os.path.exists(path):
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        data = {}

for key, value in {
    "version": 3,
    "commands": {},
    "url_overrides": {},
    "newTabNotification": {},
    "homepageNotification": {},
    "default_search": {},
    "tabHideNotification": {},
    "prefs": {},
}.items():
    data.setdefault(key, value)

data["newTabNotification"]["tiger-tools@tiger-browser.dev"] = {
    "initialValue": False,
    "precedenceList": [
        {
            "id": "tiger-tools@tiger-browser.dev",
            "installDate": 0,
            "value": True,
            "enabled": True,
        }
    ],
}

tmp = path + ".tmp"
with open(tmp, "w", encoding="utf-8") as handle:
    json.dump(data, handle, indent=2)
    handle.write("\n")
os.replace(tmp, path)
PY

fetch_verify() {
  local url="$1" sha="$2" dest="$3" tmp
  if [[ -f "$dest" ]] && printf '%s  %s\n' "$sha" "$dest" | sha256sum -c - >/dev/null 2>&1; then
    return 0
  fi
  tmp="$(mktemp)"
  if ! curl -fsSL --retry 3 --retry-delay 2 "$url" -o "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if ! printf '%s  %s\n' "$sha" "$tmp" | sha256sum -c - >/dev/null; then
    rm -f "$tmp"
    echo "Tiger: SHA256 uyuşmadı: $url" >&2
    return 1
  fi
  mv "$tmp" "$dest"
  chmod 644 "$dest"
}

say "uBlock Origin $UBO_VERSION indiriliyor/doğrulanıyor..."
fetch_verify "$UBO_URL" "$UBO_SHA256" "$PROFILE/extensions/uBlock0@raymondhill.net.xpi"

say "Bitwarden $BITWARDEN_VERSION indiriliyor/doğrulanıyor..."
fetch_verify "$BITWARDEN_URL" "$BITWARDEN_SHA256" "$PROFILE/extensions/{446900e4-71c2-419f-a6a7-df9c091e268b}.xpi"

install_signed_extension() {
  local name="$1" alt="${1//-/_}" found
  found="$(find "$ROOT/dist/signed" -maxdepth 1 -type f \
    \( -name "${name}-*.xpi" -o -name "${alt}-*.xpi" -o -name "${name}.xpi" \) \
    -print -quit 2>/dev/null || true)"
  if [[ -z "$found" ]]; then
    return 1
  fi
  install -m 644 "$found" "$PROFILE/extensions/${name}.xpi"
  say "${name} kuruldu: $(basename "$found")"
}

if ! install_signed_extension tiger-tools; then
  MISSING_TIGER_EXTENSIONS=1
fi
if ! install_signed_extension tiger-theme; then
  MISSING_TIGER_EXTENSIONS=1
fi

if command -v cargo >/dev/null 2>&1; then
  say "tiger-host derleniyor..."
  cargo build --release --manifest-path "$ROOT/native/Cargo.toml"
  install -m 755 "$ROOT/native/target/release/tiger-host" "$PREFIX/lib/tiger/tiger-host"
elif [[ -x "$ROOT/dist/tiger-host" ]]; then
  install -m 755 "$ROOT/dist/tiger-host" "$PREFIX/lib/tiger/tiger-host"
else
  echo "Tiger: cargo yok ve dist/tiger-host hazır değil." >&2
  exit 1
fi

cat >"$HOME/.mozilla/native-messaging-hosts/org.tiger.host.json" <<EOF
{
  "name": "org.tiger.host",
  "description": "Tiger Browser native host",
  "path": "$PREFIX/lib/tiger/tiger-host",
  "type": "stdio",
  "allowed_extensions": [
    "tiger-tools@tiger-browser.dev",
    "tiger-theme@tiger-browser.dev"
  ]
}
EOF
chmod 644 "$HOME/.mozilla/native-messaging-hosts/org.tiger.host.json"

install -m 755 "$ROOT/packaging/tiger" "$PREFIX/bin/tiger"
printf '%s\n' "$FIREFOX" >"$CONFIG/firefox.path"
chmod 644 "$CONFIG/firefox.path"

sed "s|@EXEC@|$PREFIX/bin/tiger|g" "$ROOT/packaging/tiger.desktop.in" \
  >"$HOME/.local/share/applications/tiger.desktop"
chmod 644 "$HOME/.local/share/applications/tiger.desktop"

install_icon() {
  local size="$1" source="$2"
  local dir="$HOME/.local/share/icons/hicolor/${size}x${size}/apps"
  mkdir -p "$dir"
  install -m 644 "$source" "$dir/tiger.png"
}

for size in 16 24 32; do
  install_icon "$size" "$ROOT/branding/png/mark-$size.png"
done
for size in 48 64 128 256 512; do
  install_icon "$size" "$ROOT/branding/png/tiger-$size.png"
done

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q -t -f "$HOME/.local/share/icons/hicolor" >/dev/null 2>&1 || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database -q "$HOME/.local/share/applications" >/dev/null 2>&1 || true
fi

echo
echo "Kurulum tamam."
say "Başlat: $PREFIX/bin/tiger"
say "Varsayılan yapmak istersen: xdg-settings set default-web-browser tiger.desktop"
say "Bitwarden: bulut hesabı; girişte US/EU bölgesini seç."
echo

if [[ "$MISSING_TIGER_EXTENSIONS" -eq 1 ]]; then
  cat >&2 <<'EOF'
! Tiger Tools / Tiger Theme imzalı XPI bulunamadı.
  Bu iki eklenti olmadan yeni sekme, terminal butonu ve tema değiştirme çalışmaz.

  AMO API anahtarlarınla:
    export WEB_EXT_API_KEY="..."
    export WEB_EXT_API_SECRET="..."
    ./scripts/sign.sh
    ./install.sh

  Geliştirme sırasında geçici yükleme için: ./scripts/dev-run.sh
EOF
fi

if [[ ":$PATH:" != *":$PREFIX/bin:"* ]]; then
  warn "$PREFIX/bin PATH içinde değil. Launcher: $PREFIX/bin/tiger"
fi

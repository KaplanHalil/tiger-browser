# Third-party notices

Tiger Browser’s own source is MIT-licensed (see `LICENSE`). It uses or
interoperates with the following components. Tiger does not redistribute
Firefox itself; it uses the Firefox installation provided by the user.

## Firefox

- Project: https://www.mozilla.org/firefox/
- License: Mozilla Public License 2.0 (MPL-2.0)
- Tiger ships configuration files and a profile overlay, not Firefox binaries.
- “Firefox” is a trademark of the Mozilla Foundation. Tiger is independent and
  is not endorsed by Mozilla.

## uBlock Origin

- Project: https://github.com/gorhill/uBlock
- License: GNU General Public License v3.0 (GPL-3.0)
- Tiger downloads the unmodified, Mozilla-signed XPI from AMO and pins its
  version and SHA256 hash in `versions.env`.
- uBlock Origin is © Raymond Hill and contributors.

## Bitwarden Password Manager

- Project: https://github.com/bitwarden/clients
- License: GPL-3.0 by default; Bitwarden License v1.0 for code under
  `bitwarden_license/` (see the upstream repository).
- Tiger downloads the unmodified, Mozilla-signed XPI from AMO and pins its
  version and SHA256 hash in `versions.env`.
- “Bitwarden” is a trademark of Bitwarden Inc. Tiger is not affiliated with
  Bitwarden.

## Rust crates

- `serde`, `serde_json`: MIT / Apache-2.0
- `toml`: MIT / Apache-2.0

## Fonts

Tiger does not bundle fonts. The UI requests `JetBrainsMono Nerd Font` and
falls back to the system monospace font. JetBrains Mono is licensed under the
SIL Open Font License 1.1.

## Omarchy

- Project: https://omarchy.org/
- Tiger reads Omarchy theme files and calls `omarchy theme set`. Omarchy is a
  separate project; Tiger is not affiliated with it.

## Artwork

The Tiger logo, wordmark, terminal icon, and theme icon in `branding/` are
original MIT-licensed artwork created for this project.

# Security policy

## Reporting a vulnerability

Please report security issues **privately** through GitHub’s
[Security Advisories](https://github.com/KaplanHalil/tiger-browser/security/advisories/new)
for this repository. Do not open a public issue for a vulnerability.

Include:

- A short description and impact.
- Steps to reproduce, ideally a minimal profile or command.
- The Firefox version, Omarchy version, and Tiger version.
- Whether the issue is in Tiger’s code or in an upstream component.

You can expect an initial response within a few days. This is a small,
volunteer-maintained project; there is no bug bounty.

## Scope

In scope:

- `native/src/main.rs` — native messaging host, caller checks, command
  construction, theme-name validation.
- `extension/tiger-tools/` and `extension/tiger-theme/` — permissions, newtab
  override, native messaging, theme handling.
- `profile/user.js` — privacy/security defaults, permission defaults.
- `profile/chrome/userChrome.css` — UI spoofing or hidden security indicators.
- `install.sh`, `uninstall.sh`, `scripts/*.sh` — unsafe file handling, download
  verification, privilege issues.
- `versions.env` — pinned third-party versions and SHA256 hashes.

Out of scope (report upstream):

- Firefox itself, including sandbox escapes and 0-days.
- uBlock Origin and Bitwarden extension vulnerabilities.
- Mozilla’s AMO signing infrastructure.
- Omarchy, Hyprland, `foot`, `tmux`, or Arch packages.
- Issues that require an attacker to already have the user’s UID and the ability
  to modify files in the user’s home directory (see the threat model).

## Security design

- The native host runs as the user. It never runs as root.
- It accepts only two caller extension IDs.
- It accepts only a fixed action allowlist.
- Theme names are validated against a strict character set and checked against
  the theme directories before `omarchy theme set` is invoked.
- No `sh -c`, no shell interpolation, no user-supplied command arguments.
- Third-party extensions are downloaded over HTTPS and verified against pinned
  SHA256 hashes.
- Tiger’s own extensions are signed through AMO’s unlisted channel.
- The installer is per-user and refuses to run while the Tiger profile is in use.
- The installer does not touch the default Firefox profile.

See [`THREAT-MODEL.md`](THREAT-MODEL.md) for residual risks.

## Update policy

- **Firefox:** updated by the system package manager (`omarchy update`). Tiger
  tracks the current Omarchy `extra` Firefox.
- **uBlock Origin / Bitwarden:** update through AMO; `extensions.update.enabled`
  is on.
- **Tiger scripts/extensions:** update with `git pull && ./install.sh`. The Tiger
  XPIs must be re-signed after a version bump.
- **Native host:** rebuilt by `install.sh` from the checked-out source.

`userChrome.css` is not a stable Firefox API. A Firefox major update can change
selectors; that is a compatibility issue, not a security boundary. Do not rely on
CSS for security indicators.

## Known limitations

- Tiger Lite uses the system Firefox binary; it cannot enforce a specific
  Firefox security patch level beyond the installer’s minimum-version check.
- A compromised AMO account or a malicious extension the user installs can abuse
  the permissions it is granted. The native host is deliberately limited, but it
  can still toggle a terminal and change the theme.
- The native host binary lives in `~/.local/lib/tiger`; a same-UID attacker can
  replace it. Use full-disk encryption and a locked screen.
- Google is the default search engine; queries go to Google. This is a privacy
  choice, not a vulnerability, but it is documented here because users may
  assume otherwise.

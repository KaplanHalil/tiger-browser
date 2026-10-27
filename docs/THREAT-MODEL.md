# Tiger threat model

Tiger is a hardened daily browser for Omarchy, not an anonymity system. This
document states what it tries to protect, from whom, and where the remaining
risk is.

## Assets

1. **Passwords and passkeys** stored in Bitwarden.
2. **Browsing session**: cookies, history, bookmarks, open tabs.
3. **Local profile**: `~/.config/tiger/profile` and its caches.
4. **Native host**: a local process that can open a terminal and change the
   desktop theme.
5. **User attention**: the address bar, permission prompts, and the theme/terminal
   buttons must not lie about what they do.

## Adversaries

### 1. Commercial trackers and ad networks

**Goal:** correlate browsing across sites, build profiles, fingerprint the
device, measure conversions.

**Mitigations:** strict ETP, Total Cookie Protection, network-state
partitioning, query stripping, bounce-tracking protection, uBlock Origin with
EasyList/EasyPrivacy (regional lists can be enabled in uBO), HTTPS-Only, Quad9 DoH.

**Residual risk:** first-party tracking, logged-in services, fingerprinting that
survives partitioning, and sites that require the blocked scripts to function.

### 2. Network observers (ISP, Wi-Fi, transit)

**Goal:** observe DNS queries and plaintext traffic; inject or downgrade.

**Mitigations:** HTTPS-Only, HSTS where offered, DoH to Quad9, mixed-content
blocking, certificate validation via Firefox.

**Residual risk:** SNI and destination IPs are still visible; DoH moves trust
from the ISP to Quad9; a hostile CA or local root can still intercept TLS.

### 3. A malicious or compromised website

**Goal:** exploit the browser, escape the sandbox, steal credentials, trick the
user with UI.

**Mitigations:** Firefox sandbox and site isolation, prompt-based permissions,
notification denial, Bitwarden origin-bound autofill, no automatic downloads,
Tiger’s minimal native host surface.

**Residual risk:** Firefox 0-days, malicious downloads the user chooses to run,
and phishing. Tiger does not add a malware scanner.

### 4. A malicious extension

**Goal:** read pages, steal cookies, abuse native messaging, persist.

**Mitigations:** only four extensions are intended (uBO, Bitwarden, Tiger Tools,
Tiger Theme). AMO signing and review, pinned versions at install, native host
allowlist by extension ID, host command allowlist, no shell execution, theme
name validation.

**Residual risk:** a compromised AMO account or supply-chain compromise of uBO
or Bitwarden; a malicious extension the user installs manually; Firefox’s
extension permission model. The native host cannot be used to run arbitrary
commands, but it can still toggle a terminal and change the theme.

### 5. A local attacker with the user’s account

**Goal:** read the profile, steal the Bitwarden vault, modify the launcher, or
replace the native host.

**Mitigations:** standard Linux file permissions, Bitwarden’s own encryption and
lock, no plaintext password store in Firefox, no telemetry endpoint to leak to.

**Residual risk:** an attacker with the same UID can read the profile, replace
`~/.local/lib/tiger/tiger-host`, modify `~/.mozilla/native-messaging-hosts`, or
attach to the browser. Tiger is not an anti-forensics or privilege-separation
tool. Full-disk encryption and a locked screen matter more than any browser
setting here.

### 6. Tiger’s own supply chain

**Goal:** ship a bad update or a malicious dependency.

**Mitigations:** small, auditable shell/Rust/JS code; pinned third-party XPI
versions with SHA256; Mozilla-signed extensions; no runtime downloads outside
AMO; no analytics; no remote config.

**Residual risk:** GitHub compromise, a malicious commit, an npm compromise in
`web-ext` at signing time, or a compromised `omarchy theme set` script. The
installer is per-user and does not run as root; review it before running.

## Native host security

`tiger-host` is deliberately tiny:

- Accepts only callers whose extension ID is in
  `tiger-tools@tiger-browser.dev` or `tiger-theme@tiger-browser.dev`.
- Accepts only four actions: `ping`, `theme.current`, `theme.list`, `theme.set`,
  `terminal.toggle`.
- `theme.set` validates the name against `^[A-Za-z0-9._-]{1,64}$` **and** checks
  that the theme directory exists before running `/usr/bin/omarchy`.
- Uses fixed absolute binaries (`/usr/bin/hyprctl`, `/usr/bin/foot`,
  `/usr/bin/tmux`, `/usr/bin/omarchy`). No `sh -c`, no user-supplied arguments.
- Limits native messages to 1 MiB and returns structured errors.
- Logs errors to stderr; `TIGER_DEBUG=1` also writes to
  `~/.local/state/tiger/host.log`.

The terminal command is fixed:

```
foot --app-id=tiger-terminal --title=TigerTerminal -e tmux new-session -A -s tiger
```

There is no way to make the host run a different command through the protocol.

## Non-goals

- **Anonymity.** Use Tor Browser or Mullvad Browser if that is the goal.
- **DRM/streaming parity.** Widevine is not configured.
- **Cross-device sync.** Tiger has no account or sync service.
- **Malware sandboxing beyond Firefox.** Tiger does not scan downloads.
- **Hiding from a local administrator.** The profile is readable by the user.
- **Windows/macOS.** v0.1 is Linux/Omarchy-only.
- **Full browser branding.** Lite still uses the system Firefox binary; the
  window class is `firefox`.

## Review checklist for changes

Any change that touches these areas needs a security review:

- `native/src/main.rs` (caller checks, command construction, path handling)
- `profile/user.js` (privacy defaults, telemetry, permissions)
- `extension/*/manifest.json` (permissions, native messaging, newtab override)
- `install.sh` (downloads, hashes, file locations, no root)
- `versions.env` (pinned versions and SHA256)
- `scripts/sign.sh` (AMO credentials and artifact handling)

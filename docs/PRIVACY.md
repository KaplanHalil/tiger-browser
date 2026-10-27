# Privacy

Tiger has no backend, no analytics, and no account of its own. This page lists
every network flow the project intentionally triggers, so you can decide whether
the trade-offs match your threat model.

## What Tiger itself collects

**Nothing.** There is no Tiger server, telemetry endpoint, crash reporter, update
service, or “anonymous usage” metric. The native host is local-only.

Tiger writes:

- `~/.config/tiger/` — profile, prefs, history, cookies, bookmarks, caches.
- `~/.local/state/tiger/host.log` — only if `TIGER_DEBUG=1`, errors only.
- `~/.local/lib/tiger/tiger-host` — the native host binary.
- `~/.local/bin/tiger`, desktop file, icons, native messaging manifest.

You can remove all of it with `./uninstall.sh` (or keep the profile with
`--keep-data`).

## Network flows you should know about

| Destination | When | What is sent | Can it be disabled? |
| --- | --- | --- | --- |
| **Google** | You search | The query, your IP, cookies for Google | Yes: DuckDuckGo switch or change the default engine |
| **Bitwarden cloud** | You log in / sync the vault | Encrypted vault traffic, account metadata | Yes: self-host Vaultwarden or don’t use Bitwarden |
| **Quad9 DoH** | DNS lookups | DNS names (not your IP? it sees your IP) | Yes: change `network.trr.uri` or set `network.trr.mode=5` |
| **AMO (addons.mozilla.org)** | Extension updates | Extension IDs, version checks | Yes: disable `extensions.update.enabled` (not recommended) |
| **Mozilla / Google Safe Browsing** | Malicious-site protection | Hash prefixes / blocklist updates | Partially; Firefox’s safe-browsing prefs |
| **Websites you visit** | Always | Normal HTTP/TLS traffic | No |
| **`omarchy` theme commands** | You change theme | Local process only, no network | N/A |

### Google is the default

This is a deliberate product choice, and it is the biggest privacy caveat in
Tiger. Google receives your search queries and can associate them with your
Google cookies if you are signed in. Tiger disables search suggestions so
keystrokes are not sent before you press Enter, and the new tab has a one-click
DuckDuckGo switch.

To make DuckDuckGo permanent, change this line in `profile/user.js`:

```js
user_pref("browser.search.defaultenginename", "DuckDuckGo");
```

then run `./install.sh` again.

### Bitwarden

Tiger bundles the official Bitwarden extension but does not operate a Bitwarden
server. Your vault is encrypted on the client and stored by Bitwarden (US or EU
region) unless you self-host Vaultwarden. Bitwarden’s own privacy policy applies.
Firefox’s built-in password manager is disabled so there is a single password
store.

### DNS over HTTPS

Tiger uses Quad9 (`https://dns.quad9.net/dns-query`) in fallback mode
(`network.trr.mode=2`). Quad9 sees your DNS queries and your IP. If you prefer
another resolver, change `network.trr.uri` and
`network.trr.default_provider_uri` in `user.js`.

Captive portals may fail with DoH enabled. Use `network.trr.mode=5` temporarily,
or allow the portal first.

### Extension updates

uBlock Origin, Bitwarden, Tiger Tools, and Tiger Theme update through AMO. The
update check reveals the extension IDs and your IP to Mozilla. The Tiger helper
extensions are signed on AMO’s **unlisted** channel; they are not listed in the
public add-on store.

### Safe Browsing and blocklists

Firefox’s malware/phishing protection and remote blocklist updates still contact
Mozilla/Google infrastructure. Tiger does not disable them because they protect
against real threats. If you want to remove these flows, review
`browser.safebrowsing.*` and `services.settings.*` in `about:config`; doing so
reduces protection.

## Local data

- **History, cookies, bookmarks, tabs:** standard Firefox profile data under
  `~/.config/tiger/profile`.
- **Bitwarden vault:** managed by the extension, encrypted at rest; unlock state
  is in memory.
- **Theme cache:** none; Tiger reads Omarchy’s current theme files.
- **Logs:** `TIGER_DEBUG=1` writes host errors to
  `~/.local/state/tiger/host.log`; no browsing data is logged.

## What Tiger does not do

- No account, no sync, no telemetry, no “anonymous” pings.
- No remote configuration, no experiments, no sponsored content.
- No custom user agent or fingerprint spoofing.
- No proxy/VPN/Tor integration.
- No DRM configuration.
- No hidden network requests from the new tab page (it loads only local
  extension assets).

## Contact

Privacy questions and reports: open a GitHub issue or use the security contact
in [`SECURITY.md`](SECURITY.md). Do not include vault contents or personal
browsing data in a public issue.

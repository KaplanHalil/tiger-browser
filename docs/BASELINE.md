# Tiger Baseline

Tiger’s defaults live in `profile/user.js`. Firefox re-applies `user.js` on every
start, so changing a pref in `about:config` will not survive a restart if the
same pref is set here. To change a default, edit `profile/user.js` and re-run
`./install.sh` (or copy the file into the profile).

The baseline is intentionally conservative but not anonymous. See
`THREAT-MODEL.md` for what it does and does not protect against.

## Telemetry, studies and sponsored surfaces

| Pref | Value | Why |
| --- | --- | --- |
| `toolkit.telemetry.enabled` | `false` | No telemetry pings |
| `toolkit.telemetry.unified` | `false` | Disable the unified telemetry client |
| `toolkit.telemetry.*Ping*` | `false` | Disable startup/shutdown/crash pings |
| `datareporting.healthreport.uploadEnabled` | `false` | No health report uploads |
| `datareporting.policy.dataSubmissionEnabled` | `false` | No data submission |
| `datareporting.policy.dataSubmissionPolicyBypassNotification` | `true` | Skip the first-run privacy notice; Tiger is a distribution |
| `app.shield.optoutstudies.enabled` | `false` | No Shield studies |
| `app.normandy.enabled` | `false` | No Normandy experiments |
| `browser.discovery.enabled` | `false` | No discovery/telemetry surfaces |
| `extensions.pocket.enabled` | `false` | No Pocket |
| `browser.newtabpage.activity-stream.showSponsored` | `false` | No sponsored tiles |
| `browser.newtabpage.activity-stream.feeds.section.topstories` | `false` | No Pocket stories |
| `browser.messaging-system.whatsNewPanel.enabled` | `false` | No “what’s new” panel |
| `browser.uitour.enabled` | `false` | No product tours |

## Accounts and sync

| Pref | Value | Why |
| --- | --- | --- |
| `identity.fxaccounts.enabled` | `false` | No Firefox Account |
| `services.sync.enabled` | `false` | No Sync |
| `signon.rememberSignons` | `false` | Firefox does not store passwords |
| `signon.autofillForms` | `false` | Firefox does not autofill passwords |
| `signon.generation.enabled` | `false` | No Firefox password generator |
| `signon.management.page.breach-alerts.enabled` | `false` | No breach-alert lookups |
| `extensions.formautofill.addresses.enabled` | `false` | No address autofill |
| `extensions.formautofill.creditCards.enabled` | `false` | No card autofill |
| `browser.formfill.enable` | `false` | No form-history suggestions |

Bitwarden provides password management. It is a separate extension with its own
storage and permissions; see `PRIVACY.md`.

## Tracking, cookies, HTTPS and DNS

| Pref | Value | Why |
| --- | --- | --- |
| `browser.contentblocking.category` | `strict` | Strict ETP |
| `privacy.trackingprotection.*` | `true` | Trackers, social trackers, cryptominers, fingerprinters, email trackers |
| `network.cookie.cookieBehavior` | `5` | Total Cookie Protection |
| `network.cookie.cookieBehavior.pbmode` | `5` | TCP in private windows |
| `privacy.partition.network_state` | `true` | Network state partitioning |
| `privacy.query_stripping.enabled` | `true` | Strip known tracking parameters |
| `privacy.bounceTrackingProtection.mode` | `1` | Bounce-tracking protection |
| `privacy.donottrackheader.enabled` | `true` | Send DNT (honoured by few sites) |
| `privacy.globalprivacycontrol.enabled` | `true` | Send GPC |
| `dom.security.https_only_mode` | `true` | HTTPS-Only |
| `dom.security.https_only_mode_send_http_background_request` | `false` | No background HTTP probe |
| `security.mixed_content.block_display_content` | `true` | Block mixed display content |
| `security.mixed_content.upgrade_display_content` | `true` | Upgrade mixed display content |
| `network.trr.mode` | `2` | DoH first, fallback allowed |
| `network.trr.uri` | Quad9 | `https://dns.quad9.net/dns-query` |
| `network.trr.bootstrapAddress` | `9.9.9.9` | Bootstrap the DoH resolver |
| `network.captive-portal-service.enabled` | `false` | No captive-portal probes |
| `network.connectivity-service.enabled` | `false` | No connectivity probes |

If you use a captive portal (hotel/airport Wi-Fi), set `network.trr.mode` to
`5` (off) or `0` temporarily, or allow the portal before relying on DoH.

## Permissions and WebRTC

| Pref | Value | Why |
| --- | --- | --- |
| `permissions.default.desktop-notification` | `2` | Deny notifications |
| `permissions.default.geo` | `0` | Ask |
| `permissions.default.camera` | `0` | Ask |
| `permissions.default.microphone` | `0` | Ask |
| `permissions.default.xr` | `2` | Deny XR |
| `permissions.default.shortcuts` | `2` | Deny keyboard-shortcut capture |
| `media.peerconnection.ice.default_address_only` | `true` | Limit WebRTC ICE candidates |

Denying notifications by default is deliberate. Allow individual sites from the
address-bar permissions panel when needed (WhatsApp Web, calendars, etc.).
WebRTC is not disabled; Meet/Zoom-style apps still work, but local IP candidates
are limited.

## Search

| Pref | Value | Why |
| --- | --- | --- |
| `browser.search.defaultenginename` | `Google` | Explicit product choice |
| `browser.search.suggest.enabled` | `false` | Keystrokes stay local |
| `browser.urlbar.suggest.searches` | `false` | No remote search suggestions |
| `browser.urlbar.suggest.trending` | `false` | No trending suggestions |
| `browser.urlbar.suggest.quicksuggest.*` | `false` | No Firefox Suggest |
| `browser.urlbar.trimURLs` | `false` | Show the full URL |
| `browser.urlbar.suggest.history/bookmark/openpage` | `true` | Local-only suggestions |

Google receives queries. The new tab has a DuckDuckGo switch. To make DuckDuckGo
the default permanently, set `browser.search.defaultenginename` to
`DuckDuckGo` in `user.js` and reinstall.

## UI

| Pref | Value | Why |
| --- | --- | --- |
| `sidebar.revamp` | `true` | New sidebar |
| `sidebar.verticalTabs` | `true` | Vertical tabs by default |
| `sidebar.visibility` | `always-show` | Keep the tab rail visible |
| `sidebar.position_start` | `true` | Tabs on the left |
| `browser.uidensity` | `1` | Compact chrome |
| `browser.toolbars.bookmarks.visibility` | `never` | No bookmarks bar |
| `toolkit.legacyUserProfileCustomizations.stylesheets` | `true` | Load `userChrome.css` |
| `browser.uiCustomization.state` | pinned | Put the terminal/theme buttons on the toolbar |

`browser.uiCustomization.state` is a JSON string generated for the Tiger
extensions. If it is reset, Firefox moves new extension buttons into the
extensions panel; re-run `install.sh` or reset `user.js`.

## Extensions

| Pref | Value | Why |
| --- | --- | --- |
| `extensions.autoDisableScopes` | `0` | Do not disable sideloaded signed XPIs |
| `extensions.enabledScopes` | `15` | Enable profile-installed extensions |
| `extensions.update.enabled` | `true` | Let signed extensions update from AMO |

Tiger downloads pinned, signed versions of uBlock Origin and Bitwarden on
install. They can update themselves from AMO afterwards. The two Tiger helper
extensions are signed through AMO’s unlisted channel; see `README.md`.

## What is deliberately not set

- `privacy.resistFingerprinting` is **off**: it breaks too many sites for a
  daily browser.
- DRM/Widevine is not configured.
- No proxy, VPN, or Tor integration.
- No custom user agent. Tiger does not pretend to be Chrome.
- No telemetry-free “metrics”; there is no analytics endpoint at all.

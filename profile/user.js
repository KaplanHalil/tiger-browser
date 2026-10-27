// Tiger Browser — Tiger Baseline
// Applied on every start by Firefox. Keep this file small, readable, and
// documented: every line here is a promise the browser makes to the user.

// ---------------------------------------------------------------------------
// Omarchy / Wayland integration
// ---------------------------------------------------------------------------
user_pref("apz.overscroll.enabled", true);
user_pref("media.ffmpeg.vaapi.enabled", true);
user_pref("media.hardware-video-decoding.force-enabled", true);
user_pref("widget.disable-swipe-tracker", false);
user_pref("widget.wayland.fractional-scale.enabled", true);

// ---------------------------------------------------------------------------
// No telemetry, studies, experiments, crash uploads or sponsored surfaces
// ---------------------------------------------------------------------------
user_pref("toolkit.telemetry.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.archive.enabled", false);
user_pref("toolkit.telemetry.newProfilePing.enabled", false);
user_pref("toolkit.telemetry.shutdownPingSender.enabled", false);
user_pref("toolkit.telemetry.updatePing.enabled", false);
user_pref("toolkit.telemetry.bhrPing.enabled", false);
user_pref("toolkit.telemetry.firstShutdownPing.enabled", false);
user_pref("toolkit.telemetry.coverage.opt-out", true);
user_pref("toolkit.coverage.opt-out", true);
user_pref("toolkit.coverage.endpoint.base", "");
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("datareporting.policy.dataSubmissionPolicyAcceptedVersion", 2);
user_pref("datareporting.policy.dataSubmissionPolicyNotifiedTime", "0");
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", false);
user_pref("app.normandy.api_url", "");
user_pref("breakpad.reportURL", "");
user_pref("browser.tabs.crashReporting.sendReport", false);
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);
user_pref("browser.discovery.enabled", false);
user_pref("browser.region.network.url", "");
user_pref("browser.region.update.enabled", false);

user_pref("extensions.pocket.enabled", false);
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
user_pref("browser.newtabpage.activity-stream.feeds.snippets", false);
user_pref("browser.newtabpage.activity-stream.feeds.topsites", false);
user_pref("browser.newtabpage.activity-stream.showWeather", false);
user_pref("browser.newtabpage.activity-stream.default.sites", "");
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);
user_pref("browser.messaging-system.whatsNewPanel.enabled", false);
user_pref("browser.uitour.enabled", false);

// ---------------------------------------------------------------------------
// No Firefox Account, no Sync: Tiger is local-first
// ---------------------------------------------------------------------------
user_pref("identity.fxaccounts.enabled", false);
user_pref("identity.fxaccounts.toolbar.enabled", false);
user_pref("identity.fxaccounts.pairing.enabled", false);
user_pref("identity.fxaccounts.commands.enabled", false);
user_pref("services.sync.enabled", false);

// ---------------------------------------------------------------------------
// Passwords: Bitwarden only. Firefox's own manager stays out of the way.
// ---------------------------------------------------------------------------
user_pref("signon.rememberSignons", false);
user_pref("signon.autofillForms", false);
user_pref("signon.generation.enabled", false);
user_pref("signon.management.page.breach-alerts.enabled", false);
user_pref("signon.firefoxRelay.feature", "disabled");
user_pref("extensions.formautofill.addresses.enabled", false);
user_pref("extensions.formautofill.creditCards.enabled", false);
user_pref("browser.formfill.enable", false);

// ---------------------------------------------------------------------------
// Tracking protection, cookies, HTTPS, query stripping
// ---------------------------------------------------------------------------
user_pref("browser.contentblocking.category", "strict");
user_pref("privacy.trackingprotection.enabled", true);
user_pref("privacy.trackingprotection.pbmode.enabled", true);
user_pref("privacy.trackingprotection.socialtracking.enabled", true);
user_pref("privacy.trackingprotection.cryptomining.enabled", true);
user_pref("privacy.trackingprotection.fingerprinting.enabled", true);
user_pref("privacy.trackingprotection.emailtracking.enabled", true);
user_pref("network.cookie.cookieBehavior", 5);
user_pref("network.cookie.cookieBehavior.pbmode", 5);
user_pref("privacy.partition.network_state", true);
user_pref("privacy.donottrackheader.enabled", true);
user_pref("privacy.globalprivacycontrol.enabled", true);
user_pref("privacy.globalprivacycontrol.functionality.enabled", true);
user_pref("privacy.query_stripping.enabled", true);
user_pref("privacy.query_stripping.enabled.pbmode", true);
user_pref("privacy.bounceTrackingProtection.mode", 1);
user_pref("dom.security.https_only_mode", true);
user_pref("dom.security.https_only_mode_pbm", true);
user_pref("dom.security.https_only_mode_ever_enabled", true);
user_pref("dom.security.https_only_mode_send_http_background_request", false);
user_pref("security.insecure_connection_text.enabled", true);
user_pref("security.insecure_connection_text.pbmode.enabled", true);
user_pref("security.mixed_content.block_display_content", true);
user_pref("security.mixed_content.upgrade_display_content", true);

// ---------------------------------------------------------------------------
// DNS over HTTPS: Quad9, fallback allowed. Strict mode can be enabled in
// about:preferences#privacy; fallback keeps captive portals usable.
// ---------------------------------------------------------------------------
user_pref("network.trr.mode", 2);
user_pref("network.trr.uri", "https://dns.quad9.net/dns-query");
user_pref("network.trr.custom_uri", "https://dns.quad9.net/dns-query");
user_pref("network.trr.default_provider_uri", "https://dns.quad9.net/dns-query");
user_pref("network.trr.bootstrapAddress", "9.9.9.9");
user_pref("network.trr.allow-rfc1918", true);
user_pref("network.trr.exclude-etc-hosts", false);
user_pref("network.trr.wait-for-portal", false);
user_pref("network.captive-portal-service.enabled", false);
user_pref("network.connectivity-service.enabled", false);

// ---------------------------------------------------------------------------
// Permissions: notifications denied, sensors prompt, WebRTC limited
// ---------------------------------------------------------------------------
user_pref("permissions.default.desktop-notification", 2);
user_pref("permissions.default.geo", 0);
user_pref("permissions.default.camera", 0);
user_pref("permissions.default.microphone", 0);
user_pref("permissions.default.xr", 2);
user_pref("permissions.default.shortcuts", 2);
user_pref("media.peerconnection.ice.default_address_only", true);

// ---------------------------------------------------------------------------
// UI: vertical tabs, compact chrome, no bookmarks bar, no onboarding
// ---------------------------------------------------------------------------
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("sidebar.revamp", true);
user_pref("sidebar.verticalTabs", true);
user_pref("sidebar.verticalTabs.dragToReorder", true);
user_pref("sidebar.visibility", "always-show");
user_pref("sidebar.position_start", true);
user_pref("browser.compactmode.show", true);
user_pref("browser.uidensity", 1);
user_pref("browser.toolbars.bookmarks.visibility", "never");
user_pref("browser.tabs.closeWindowWithLastTab", false);
user_pref("browser.startup.page", 3);
user_pref("browser.startup.homepage", "about:blank");
user_pref("browser.aboutwelcome.enabled", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("startup.homepage_welcome_url", "");
user_pref("startup.homepage_welcome_url.additional", "");
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.defaultbrowser.notificationbar", false);
user_pref("devtools.theme", "dark");
user_pref("devtools.chrome.enabled", false);
user_pref("devtools.debugger.remote-enabled", false);

// ---------------------------------------------------------------------------
// Search: Google default, suggestions OFF (keystrokes stay local)
// ---------------------------------------------------------------------------
user_pref("browser.search.defaultenginename", "Google");
user_pref("browser.search.suggest.enabled", false);
user_pref("browser.search.suggest.enabled.private", false);
user_pref("browser.urlbar.suggest.searches", false);
user_pref("browser.urlbar.suggest.trending", false);
user_pref("browser.urlbar.suggest.engines", false);
user_pref("browser.urlbar.suggest.topsites", false);
user_pref("browser.urlbar.suggest.quicksuggest.sponsored", false);
user_pref("browser.urlbar.suggest.quicksuggest.nonsponsored", false);
user_pref("browser.urlbar.quicksuggest.enabled", false);
user_pref("browser.urlbar.showSearchTerms.enabled", false);
user_pref("browser.urlbar.trimURLs", false);
user_pref("browser.urlbar.suggest.history", true);
user_pref("browser.urlbar.suggest.bookmark", true);
user_pref("browser.urlbar.suggest.openpage", true);

// ---------------------------------------------------------------------------
// Extension installation: allow the signed XPIs shipped by Tiger
// ---------------------------------------------------------------------------
user_pref("extensions.autoDisableScopes", 0);
user_pref("extensions.enabledScopes", 15);
user_pref("extensions.update.enabled", true);
user_pref("extensions.systemAddon.update.enabled", true);

// ---------------------------------------------------------------------------
// Toolbar layout: Firefox puts new extension buttons in the overflow panel.
// Tiger pins the terminal and theme buttons to the right of the URL bar.
// The widget ids are derived from the extension ids and stay stable.
// ---------------------------------------------------------------------------
user_pref("browser.uiCustomization.state", "{\"placements\": {\"widget-overflow-fixed-list\": [], \"unified-extensions-area\": [\"ublock0_raymondhill_net-browser-action\", \"_446900e4-71c2-419f-a6a7-df9c091e268b_-browser-action\"], \"nav-bar\": [\"alltabs-button\", \"smartwindow-group-tabs-button\", \"ai-window-toggle\", \"unified-extensions-button\", \"urlbar-container\", \"tiger-tools_tiger-browser_dev-browser-action\", \"tiger-theme_tiger-browser_dev-browser-action\", \"vertical-spacer\", \"forward-button\", \"back-button\"], \"toolbar-menubar\": [\"menubar-items\"], \"TabsToolbar\": [], \"vertical-tabs\": [\"tabbrowser-tabs\"], \"PersonalToolbar\": [\"personal-bookmarks\"]}, \"seen\": [\"reset-pbm-toolbar-button\", \"ublock0_raymondhill_net-browser-action\", \"_446900e4-71c2-419f-a6a7-df9c091e268b_-browser-action\", \"developer-button\", \"profiler-button\", \"tiger-theme_tiger-browser_dev-browser-action\", \"tiger-tools_tiger-browser_dev-browser-action\", \"smartwindow-group-tabs-button\", \"ai-window-toggle\", \"screenshot-button\"], \"dirtyAreaCache\": [\"unified-extensions-area\", \"nav-bar\", \"TabsToolbar\", \"vertical-tabs\", \"toolbar-menubar\", \"PersonalToolbar\"], \"currentVersion\": 28, \"newElementCount\": 0}");

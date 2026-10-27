# Troubleshooting

## Firefox is missing

```
Tiger: Firefox bulunamadı.
```

Install it through Omarchy:

```bash
omarchy install browser firefox
./install.sh
```

Or point Tiger at another Firefox binary:

```bash
TIGER_FIREFOX=/path/to/firefox ./install.sh
```

Tiger 0.1 requires Firefox 142 or newer.

## “Tiger Tools / Tiger Theme signed XPI not found”

Release Firefox refuses unsigned extensions. Sign Tiger’s two extensions once:

```bash
export WEB_EXT_API_KEY="..."
export WEB_EXT_API_SECRET="..."
./scripts/sign.sh
./install.sh
```

Get a free key at <https://addons.mozilla.org/developers/addon/api/key/>. The
“unlisted” channel does not publish Tiger in the add-on store.

For a temporary development session, load `dist/tiger-tools.xpi` and
`dist/tiger-theme.xpi` from `about:debugging#/runtime/this-firefox`. Temporary
add-ons disappear when Firefox exits.

## The terminal button does nothing

Check the basics:

```bash
command -v hyprctl foot tmux
hyprctl version
tmux -V
```

Run the host directly:

```bash
echo '{"action":"terminal.toggle"}' \
  | TIGER_DRY_RUN=1 ~/.local/lib/tiger/tiger-host --once
```

A successful dry run prints the terminal command, geometry, and window rule. If
it fails, check:

- Hyprland is running (`HYPRLAND_INSTANCE_SIGNATURE` is set in the session).
- `~/.mozilla/native-messaging-hosts/org.tiger.host.json` exists and its `path`
  points to an executable.
- The extension IDs in that JSON match the installed XPIs.
- `TIGER_DEBUG=1` is set in the Firefox environment, then read
  `~/.local/state/tiger/host.log`.

The terminal opens as a floating `foot` window on the right. It is not embedded
in the browser; Wayland does not allow that.

## The theme button does nothing

```bash
omarchy theme current
omarchy theme list
```

Test the host:

```bash
echo '{"action":"theme.current"}' | ~/.local/lib/tiger/tiger-host --once
echo '{"action":"theme.list"}' | ~/.local/lib/tiger/tiger-host --once
```

If the popup says “native host is not reachable”, the native messaging manifest
or the host binary is the problem. If it lists themes but cannot apply one, run
`omarchy theme set <name>` manually and check the error. Theme changes affect the
whole desktop and restart some Omarchy components; that is expected.

## The new tab still looks like Firefox

1. Close Tiger completely.
2. Check that both Tiger XPIs are installed and active in `about:addons`.
3. Open `about:debugging#/runtime/this-firefox` and confirm the extension is
   enabled.
4. Look for the one-time doorhanger **“Your new tab has changed”**. Tiger
   pre-confirms it during install; if it still appears, click **Keep Changes**.
5. Restart Tiger and open a new tab.

If the new tab is blank instead of the Tiger dashboard, the extension is not
signed or not installed.

## The Tiger toolbar buttons are missing

Firefox puts new extension buttons in the extensions panel. Tiger pins them with
`browser.uiCustomization.state` in `user.js`. If they are missing:

- Make sure both extensions are installed and active.
- Close Tiger, re-run `./install.sh`, and start again.
- Or right-click the toolbar → **Customize Toolbar** and drag the terminal and
  theme buttons onto the toolbar.

The extension IDs must remain:

```
tiger-tools@tiger-browser.dev
tiger-theme@tiger-browser.dev
```

Changing them invalidates the pinned widget IDs and the native host allowlist.

## The UI is still rounded / the colors are wrong

`userChrome.css` requires:

```js
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
```

Tiger sets this in `user.js`. Check `about:config` and restart Firefox after any
change. If only some parts look wrong after a Firefox update, the selectors have
drifted; open an issue with a screenshot and your Firefox version.

## First-run onboarding / privacy notice appears

Tiger disables `about:welcome` and sets the data-reporting policy prefs. If a
welcome page still appears, it is usually a Firefox profile upgrade page. Close
it once; it should not return. Make sure you are launching the Tiger profile:

```bash
firefox --version   # and: cat ~/.config/tiger/firefox.path
```

## Reset the profile

Back up first:

```bash
mv ~/.config/tiger/profile ~/.config/tiger/profile.bak
./install.sh
```

This gives you a fresh Tiger profile. Your default Firefox profile is separate
and untouched. To remove everything:

```bash
./uninstall.sh
```

## Reset the toolbar layout

Delete the pinned state and restart:

```bash
grep -v 'browser.uiCustomization.state' \
  ~/.config/tiger/profile/user.js > /tmp/user.js
mv /tmp/user.js ~/.config/tiger/profile/user.js
```

Then re-run `./install.sh` to restore Tiger’s layout. You can also use
**Customize Toolbar** from the Firefox UI.

## Get diagnostics

```bash
firefox --version
omarchy version
hyprctl version | head -3
cat ~/.mozilla/native-messaging-hosts/org.tiger.host.json
ls -l ~/.local/lib/tiger/tiger-host
```

With `TIGER_DEBUG=1` set in the environment that launches Tiger, the host writes
errors to `~/.local/state/tiger/host.log`.

When opening an issue, include the Firefox/Omarchy versions, the relevant log
lines, and a screenshot. Do not include vault contents, cookies, or private URLs.

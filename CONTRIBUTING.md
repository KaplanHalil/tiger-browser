# Contributing

Tiger is a small, opinionated project. Bug reports, selector fixes, docs, and
well-scoped features are welcome.

## Before you start

- Read [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md) and
  [`docs/BASELINE.md`](docs/BASELINE.md). Changes to privacy defaults are
  security changes.
- Check the roadmap in the README. v0.1 is deliberately “Lite”: no Firefox fork,
  no Flatpak/AUR yet.
- Do not commit built XPIs, signed artifacts, `dist/`, or `native/target/`.

## Development

```bash
git clone https://github.com/KaplanHalil/tiger-browser.git
cd tiger-browser
./scripts/check.sh
```

`check.sh` runs the Rust tests, checks JS syntax and manifests, builds both XPIs,
and runs `web-ext lint`.

To try the UI without signing:

```bash
./scripts/build-extensions.sh
./scripts/dev-run.sh
```

Load the XPIs temporarily from `about:debugging#/runtime/this-firefox`. Temporary
add-ons are removed when Firefox exits.

For native host work:

```bash
cargo test --manifest-path native/Cargo.toml
echo '{"action":"theme.current"}' | ./native/target/release/tiger-host --once
```

## Style

- Keep the native host small. New actions need a security review and an entry in
  the threat model.
- Never pass user input to a shell. Use `Command` with fixed arguments and
  validate against an allowlist.
- CSS should target both the `#tabbrowser-tabs[orient="vertical"]` and the
  Firefox 160 `#vertical-tabs` markup while both are in use.
- Prefer square geometry, 1px lines, and Omarchy theme variables over hard-coded
  colors.
- Keep user-facing text short. Turkish and English are both welcome in issues;
  the README is English with a Turkish quickstart.

## Pull requests

- One topic per PR.
- Include the Firefox version you tested (`firefox --version`) and whether the
  change affects `userChrome.css`, the native host, or an extension.
- If you change `versions.env`, update both the URL and the SHA256.
- If you add a permission to an extension, explain why in the PR and update the
  threat model.

## Security

Do **not** open a public issue for a vulnerability. See
[`docs/SECURITY.md`](docs/SECURITY.md).

// Tiger Browser native messaging host.
//
// Firefox starts this process, passes the caller extension ID as argv[1], and
// speaks length-prefixed JSON over stdin/stdout. Keep stdout clean: it is the
// protocol channel. Logs go to stderr and, when TIGER_DEBUG=1, to
// ~/.local/state/tiger/host.log.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::fs;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

const VERSION: &str = env!("CARGO_PKG_VERSION");
const HOST_NAME: &str = "org.tiger.host";
const MAX_MESSAGE: usize = 1 << 20;
const ALLOWED_EXTENSIONS: [&str; 2] = [
    "tiger-tools@tiger-browser.dev",
    "tiger-theme@tiger-browser.dev",
];

const HYPRCTL: &str = "/usr/bin/hyprctl";
const FOOT: &str = "/usr/bin/foot";
const TMUX: &str = "/usr/bin/tmux";
const TERMINAL_CLASS: &str = "tiger-terminal";

#[derive(Debug, Serialize, Clone)]
struct Theme {
    name: String,
    mode: String,
    colors: BTreeMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct HyprClient {
    address: String,
    #[serde(default)]
    class: String,
    #[serde(default, rename = "initialClass")]
    initial_class: String,
}

#[derive(Debug, Clone, Deserialize)]
struct HyprMonitor {
    #[serde(default)]
    x: i64,
    #[serde(default)]
    y: i64,
    #[serde(default)]
    width: i64,
    #[serde(default)]
    height: i64,
    #[serde(default = "one")]
    scale: f64,
    #[serde(default)]
    focused: bool,
}

fn one() -> f64 {
    1.0
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.iter().any(|a| a == "--version") {
        println!("tiger-host {VERSION}");
        return;
    }

    if args.iter().any(|a| a == "--help") {
        println!("tiger-host {VERSION}");
        println!("usage: tiger-host <extension-id>");
        println!("       tiger-host --stdio");
        println!("       tiger-host --once < request.json   # development");
        println!("env: TIGER_DEBUG=1 TIGER_DRY_RUN=1");
        return;
    }

    let once = args.iter().any(|a| a == "--once");
    let stdio_mode = args.iter().any(|a| a == "--stdio") || once;

    if !stdio_mode {
        // Firefox has historically passed the caller extension ID as argv[1].
        // Some builds also pass the native manifest path before it, so accept
        // the ID anywhere in argv while still refusing unknown callers.
        let allowed = args
            .iter()
            .skip(1)
            .any(|arg| ALLOWED_EXTENSIONS.contains(&arg.as_str()));
        if !allowed {
            eprintln!("tiger-host: caller not allowed: {:?}", &args[1..]);
            std::process::exit(1);
        }
    }

    if once {
        let mut line = String::new();
        let stdin = io::stdin();
        let mut lock = stdin.lock();
        if let Err(err) = lock.read_to_string(&mut line) {
            eprintln!("tiger-host: {err}");
            std::process::exit(1);
        }
        let response = match serde_json::from_str::<Value>(&line) {
            Ok(value) => handle_value(value),
            Err(err) => error_reply(None, format!("invalid json: {err}")),
        };
        println!("{}", serde_json::to_string_pretty(&response).unwrap());
        return;
    }

    let stdin = io::stdin();
    let stdout = io::stdout();
    if let Err(err) = run(stdin.lock(), stdout.lock()) {
        eprintln!("tiger-host: {err}");
        std::process::exit(1);
    }
}

fn run<R: Read, W: Write>(mut reader: R, mut writer: W) -> Result<(), String> {
    while let Some(value) = read_message(&mut reader)? {
        let response = handle_value(value);
        write_message(&mut writer, &response)?;
    }
    Ok(())
}

fn read_message<R: Read>(reader: &mut R) -> Result<Option<Value>, String> {
    let mut length = [0_u8; 4];
    let mut filled = 0_usize;

    while filled < length.len() {
        match reader.read(&mut length[filled..]) {
            Ok(0) if filled == 0 => return Ok(None),
            Ok(0) => return Err("truncated message length".into()),
            Ok(n) => filled += n,
            Err(err) if err.kind() == io::ErrorKind::Interrupted => continue,
            Err(err) => return Err(format!("read length: {err}")),
        }
    }

    let size = u32::from_ne_bytes(length) as usize;
    if size == 0 || size > MAX_MESSAGE {
        return Err(format!("invalid message size: {size}"));
    }

    let mut payload = vec![0_u8; size];
    reader
        .read_exact(&mut payload)
        .map_err(|err| format!("read payload: {err}"))?;

    serde_json::from_slice(&payload)
        .map(Some)
        .map_err(|err| format!("invalid json: {err}"))
}

fn write_message<W: Write>(writer: &mut W, value: &Value) -> Result<(), String> {
    let payload = serde_json::to_vec(value).map_err(|err| format!("encode: {err}"))?;
    if payload.len() > MAX_MESSAGE {
        return Err("response too large".into());
    }
    writer
        .write_all(&(payload.len() as u32).to_ne_bytes())
        .map_err(|err| format!("write length: {err}"))?;
    writer
        .write_all(&payload)
        .map_err(|err| format!("write payload: {err}"))?;
    writer.flush().map_err(|err| format!("flush: {err}"))
}

fn handle_value(value: Value) -> Value {
    let id = value.get("id").and_then(Value::as_u64);
    let action = value.get("action").and_then(Value::as_str).unwrap_or_default();
    let name = value.get("name").and_then(Value::as_str);

    let result = match action {
        "ping" => Ok(json!({ "host": HOST_NAME, "version": VERSION })),
        "theme.current" => current_theme().map(|theme| json!(theme)),
        "theme.list" => list_themes(),
        "theme.set" => match name {
            Some(name) => set_theme(name).map(|theme| json!(theme)),
            None => Err("theme.set requires a name".into()),
        },
        "terminal.toggle" => toggle_terminal(),
        "" => Err("missing action".into()),
        other => Err(format!("unknown action: {other}")),
    };

    match result {
        Ok(data) => ok_reply(id, data),
        Err(err) => {
            log_error(&err);
            error_reply(id, err)
        }
    }
}

fn ok_reply(id: Option<u64>, data: Value) -> Value {
    let mut object = serde_json::Map::new();
    if let Some(id) = id {
        object.insert("id".into(), json!(id));
    }
    object.insert("ok".into(), json!(true));
    object.insert("data".into(), data);
    Value::Object(object)
}

fn error_reply(id: Option<u64>, error: String) -> Value {
    let mut object = serde_json::Map::new();
    if let Some(id) = id {
        object.insert("id".into(), json!(id));
    }
    object.insert("ok".into(), json!(false));
    object.insert("error".into(), json!(error));
    Value::Object(object)
}

fn home() -> Result<PathBuf, String> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| "HOME is not set".to_string())
}

fn state_dir() -> Result<PathBuf, String> {
    Ok(home()?.join(".local/state/omarchy/current"))
}

fn theme_name() -> Result<String, String> {
    let path = state_dir()?.join("theme.name");
    let name = fs::read_to_string(&path)
        .map_err(|err| format!("read {}: {err}", path.display()))?;
    let name = name.trim().to_string();
    if name.is_empty() {
        Err("current theme name is empty".into())
    } else {
        Ok(name)
    }
}

fn current_theme() -> Result<Theme, String> {
    let state = state_dir()?;
    let name = theme_name().unwrap_or_else(|_| "Unknown".to_string());
    let path = state.join("theme/colors.toml");
    if !path.is_file() {
        return Err(format!("current theme colors not found: {}", path.display()));
    }
    theme_from_colors(&path, &name)
}

fn theme_from_colors(path: &Path, name: &str) -> Result<Theme, String> {
    let raw = fs::read_to_string(path)
        .map_err(|err| format!("read {}: {err}", path.display()))?;
    theme_from_colors_str(&raw, name)
}

fn theme_from_colors_str(raw: &str, name: &str) -> Result<Theme, String> {
    let value: toml::Value =
        toml::from_str(raw).map_err(|err| format!("parse colors.toml: {err}"))?;
    let table = value
        .as_table()
        .ok_or_else(|| "colors.toml is not a table".to_string())?;

    let mut colors = BTreeMap::new();
    for (key, value) in table {
        if let Some(text) = value.as_str() {
            colors.insert(key.clone(), text.to_string());
        }
    }

    if colors.is_empty() {
        return Err("colors.toml has no string colors".into());
    }

    let mode = colors
        .get("mode")
        .cloned()
        .unwrap_or_else(|| "dark".to_string());

    Ok(Theme {
        name: name.to_string(),
        mode,
        colors,
    })
}

fn theme_map() -> Result<BTreeMap<String, Theme>, String> {
    let home = home()?;
    let system = PathBuf::from("/usr/share/omarchy/themes");
    let user = home.join(".config/omarchy/themes");
    let mut themes = BTreeMap::new();

    for dir in [system, user] {
        if !dir.is_dir() {
            continue;
        }
        let entries = fs::read_dir(&dir)
            .map_err(|err| format!("read {}: {err}", dir.display()))?;
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let colors = path.join("colors.toml");
            if !colors.is_file() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            match theme_from_colors(&colors, &name) {
                Ok(theme) => {
                    themes.insert(name, theme);
                }
                Err(err) => log_error(&format!("skip theme {name}: {err}")),
            }
        }
    }

    Ok(themes)
}

fn list_themes() -> Result<Value, String> {
    let themes = theme_map()?;
    let current = theme_name().unwrap_or_default();
    let current_theme = themes
        .get(&current)
        .cloned()
        .or_else(|| current_theme().ok());

    Ok(json!({
        "themes": themes.values().collect::<Vec<_>>(),
        "current": current,
        "currentTheme": current_theme,
    }))
}

fn valid_theme_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 64
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
}

fn set_theme(name: &str) -> Result<Theme, String> {
    let name = name.trim();
    if !valid_theme_name(name) {
        return Err("invalid theme name".into());
    }

    let themes = theme_map()?;
    if !themes.contains_key(name) {
        return Err(format!("unknown theme: {name}"));
    }

    let omarchy = find_omarchy()?;
    let omarchy_path = omarchy_root();
    let mut command = Command::new(&omarchy);
    command
        .args(["theme", "set", name])
        .env("OMARCHY_PATH", &omarchy_path)
        .env("PATH", augmented_path(&omarchy_path))
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::piped());

    let output = command
        .output()
        .map_err(|err| format!("run {}: {err}", omarchy.display()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stderr = stderr.trim();
        if stderr.is_empty() {
            return Err(format!("omarchy theme set failed: {}", output.status));
        }
        return Err(format!("omarchy theme set failed: {stderr}"));
    }

    current_theme()
}

fn find_omarchy() -> Result<PathBuf, String> {
    if let Ok(candidate) = std::env::var("TIGER_OMARCHY_BIN") {
        let path = PathBuf::from(&candidate);
        if path.is_file() {
            return Ok(path);
        }
        return Err(format!("TIGER_OMARCHY_BIN does not exist: {candidate}"));
    }
    for candidate in ["/usr/bin/omarchy", "/usr/share/omarchy/bin/omarchy"] {
        let path = PathBuf::from(candidate);
        if path.is_file() {
            return Ok(path);
        }
    }
    Err("omarchy command not found".into())
}

fn omarchy_root() -> String {
    std::env::var("OMARCHY_PATH").unwrap_or_else(|_| "/usr/share/omarchy".to_string())
}

fn augmented_path(root: &str) -> String {
    let current = std::env::var("PATH").unwrap_or_default();
    format!("{root}/bin:/usr/local/bin:/usr/bin:/bin:{current}")
}

fn hypr_clients() -> Result<Vec<HyprClient>, String> {
    let output = Command::new(HYPRCTL)
        .args(["clients", "-j"])
        .output()
        .map_err(|err| format!("hyprctl clients: {err}"))?;

    if !output.status.success() {
        return Err(format!(
            "hyprctl clients failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    serde_json::from_slice(&output.stdout).map_err(|err| format!("parse hyprctl clients: {err}"))
}

fn focused_monitor() -> Result<HyprMonitor, String> {
    let output = Command::new(HYPRCTL)
        .args(["monitors", "-j"])
        .output()
        .map_err(|err| format!("hyprctl monitors: {err}"))?;

    if !output.status.success() {
        return Err(format!(
            "hyprctl monitors failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    let monitors: Vec<HyprMonitor> =
        serde_json::from_slice(&output.stdout).map_err(|err| format!("parse monitors: {err}"))?;

    monitors
        .iter()
        .find(|monitor| monitor.focused)
        .or_else(|| monitors.first())
        .cloned()
        .ok_or_else(|| "no Hyprland monitor found".to_string())
}

fn terminal_rule_lua(width: i64, height: i64, x: i64, y: i64, border: &str) -> String {
    format!(
        "hl.window_rule({{ name = \"tiger-terminal\", match = {{ class = \"^{TERMINAL_CLASS}$\" }}, \
         float = true, size = \"{width} {height}\", move = \"{x} {y}\", rounding = 0, \
         border_color = \"{border}\", no_shadow = true, no_blur = true, \
         opacity = \"1.0 override 1.0 override 1.0 override\" }})"
    )
}

fn terminal_command() -> String {
    format!(
        "{FOOT} --app-id={TERMINAL_CLASS} --title=TigerTerminal -e {TMUX} new-session -A -s tiger"
    )
}

fn toggle_terminal() -> Result<Value, String> {
    let clients = hypr_clients()?;

    if let Some(client) = clients.iter().find(|client| {
        client.class == TERMINAL_CLASS || client.initial_class == TERMINAL_CLASS
    }) {
        if !dry_run() {
            run_hypr_dispatch(&format!(
                "hl.dsp.window.close({{ window = \"address:{}\" }})",
                client.address
            ))?;
        }
        return Ok(json!({ "open": false }));
    }

    let monitor = focused_monitor()?;
    let scale = if monitor.scale > 0.0 { monitor.scale } else { 1.0 };
    let monitor_width = (monitor.width as f64 / scale).round() as i64;
    let monitor_height = (monitor.height as f64 / scale).round() as i64;

    if monitor_width <= 0 || monitor_height <= 0 {
        return Err("monitor has no usable size".into());
    }

    let width = (monitor_width * 40 / 100).max(480);
    let height = monitor_height;
    let x = monitor.x + monitor_width - width;
    let y = monitor.y;

    let accent = current_theme()
        .ok()
        .and_then(|theme| theme.colors.get("accent").cloned())
        .unwrap_or_else(|| "#7D82D9".to_string());
    let border = accent_to_hypr(&accent);

    let rule = terminal_rule_lua(width, height, x, y, &border);
    let command = terminal_command();

    if !dry_run() {
        // Hyprland 0.56+ runs a Lua config, so legacy `hyprctl keyword
        // windowrulev2` is not available. Create the rule through the Lua API.
        run_hypr_eval(&rule)?;
        run_hypr_dispatch(&format!(
            "hl.dsp.exec_cmd(\"{}\")",
            escape_lua_string(&command)
        ))?;
    }

    Ok(json!({
        "open": true,
        "width": width,
        "height": height,
        "x": x,
        "y": y,
        "border": border,
        "command": command,
        "rules": [rule],
        "dryRun": dry_run(),
    }))
}

fn escape_lua_string(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
}

fn run_hypr_dispatch(expression: &str) -> Result<(), String> {
    let output = Command::new(HYPRCTL)
        .args(["dispatch", expression])
        .output()
        .map_err(|err| format!("hyprctl dispatch: {err}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !output.status.success() || stdout.trim_start().starts_with("error:") {
        return Err(format!(
            "hyprctl dispatch failed: {}{}",
            stdout.trim(),
            stderr.trim()
        ));
    }

    Ok(())
}

fn run_hypr_eval(code: &str) -> Result<(), String> {
    let output = Command::new(HYPRCTL)
        .args(["eval", code])
        .output()
        .map_err(|err| format!("hyprctl eval: {err}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !output.status.success() || !stdout.trim_start().starts_with("ok") {
        return Err(format!(
            "hyprctl eval failed: {}{}",
            stdout.trim(),
            stderr.trim()
        ));
    }

    Ok(())
}

fn accent_to_hypr(hex: &str) -> String {
    let hex = hex.trim().trim_start_matches('#');
    if hex.len() != 6 {
        return "rgb(7D82D9)".into();
    }
    let parse = |start: usize| u8::from_str_radix(&hex[start..start + 2], 16).ok();
    match (parse(0), parse(2), parse(4)) {
        (Some(r), Some(g), Some(b)) => format!("rgb({r:02X}{g:02X}{b:02X})"),
        _ => "rgb(7D82D9)".into(),
    }
}

fn dry_run() -> bool {
    std::env::var("TIGER_DRY_RUN")
        .map(|value| value == "1")
        .unwrap_or(false)
}

fn log_error(message: &str) {
    eprintln!("tiger-host: {message}");
    if std::env::var("TIGER_DEBUG").ok().as_deref() != Some("1") {
        return;
    }
    if let Ok(home) = home() {
        let dir = home.join(".local/state/tiger");
        let _ = fs::create_dir_all(&dir);
        let path = dir.join("host.log");
        if let Ok(metadata) = fs::metadata(&path) {
            if metadata.len() > 1_048_576 {
                let _ = fs::remove_file(&path);
            }
        }
        if let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(&path) {
            let stamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|duration| duration.as_secs())
                .unwrap_or(0);
            let _ = writeln!(file, "{stamp} {message}");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn theme_names_are_strict() {
        assert!(valid_theme_name("ethereal"));
        assert!(valid_theme_name("tokyo-night"));
        assert!(valid_theme_name("Catppuccin_Latte"));
        assert!(!valid_theme_name(""));
        assert!(!valid_theme_name("../etc"));
        assert!(!valid_theme_name("theme with space"));
        assert!(!valid_theme_name("theme;rm -rf"));
    }

    #[test]
    fn parses_flat_colors() {
        let theme = theme_from_colors_str(
            "mode = \"dark\"\naccent = \"#7D82D9\"\nbackground = \"#060B1E\"\n",
            "test",
        )
        .expect("theme");
        assert_eq!(theme.name, "test");
        assert_eq!(theme.mode, "dark");
        assert_eq!(theme.colors.get("accent").unwrap(), "#7D82D9");
    }

    #[test]
    fn converts_hex_to_hypr_rgb() {
        assert_eq!(accent_to_hypr("#7D82D9"), "rgb(7D82D9)");
        assert_eq!(accent_to_hypr("7d82d9"), "rgb(7D82D9)");
        assert_eq!(accent_to_hypr("nope"), "rgb(7D82D9)");
    }

    #[test]
    fn terminal_rule_is_scoped() {
        let rule = terminal_rule_lua(768, 1080, 1152, 0, "rgb(7D82D9)");
        assert!(rule.contains("class = \"^tiger-terminal$\""));
        assert!(rule.contains("size = \"768 1080\""));
        assert!(rule.contains("border_color = \"rgb(7D82D9)\""));
    }

    #[test]
    fn escapes_lua_strings() {
        assert_eq!(escape_lua_string("a\"b"), "a\\\"b");
        assert_eq!(escape_lua_string("a\\b"), "a\\\\b");
    }
}

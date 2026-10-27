"use strict";

const HOST = "org.tiger.host";
const POLL_MS = 60000;

console.info("Tiger Theme: background started");

let port = null;
let sequence = 0;
const pending = new Map();
let lastTheme = "";

function connect() {
  if (port) return port;

  port = browser.runtime.connectNative(HOST);

  port.onMessage.addListener((message) => {
    const entry = pending.get(message?.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    entry.resolve(message);
  });

  port.onDisconnect.addListener(() => {
    let reason = "Tiger native host disconnected";
    try {
      if (browser.runtime.lastError) reason = browser.runtime.lastError.message;
    } catch (_) { /* no lastError */ }
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    }
    pending.clear();
    port = null;
  });

  return port;
}

function request(action, payload = {}, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    let active;
    try {
      active = connect();
    } catch (err) {
      reject(err);
      return;
    }

    const id = ++sequence;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tiger native host timed out: ${action}`));
    }, timeoutMs);

    pending.set(id, { resolve, reject, timer });

    try {
      active.postMessage({ id, action, ...payload });
    } catch (err) {
      clearTimeout(timer);
      pending.delete(id);
      reject(err);
    }
  });
}

function themeObject(data) {
  const c = data?.colors || {};
  const bg = c.background || "#060B1E";
  const surface = c.lighter_background || c.dark_background || bg;
  const field = c.dark_background || bg;
  const text = c.foreground || "#FFCEAD";
  const muted = c.muted || text;
  const line = c.selection || c.muted || "#252E56";
  const accent = c.accent || "#7D82D9";

  return {
    colors: {
      frame: bg,
      frame_inactive: bg,
      toolbar: surface,
      toolbar_text: text,
      toolbar_field: field,
      toolbar_field_text: text,
      toolbar_field_border: line,
      toolbar_field_border_focus: accent,
      toolbar_top_separator: line,
      toolbar_bottom_separator: line,
      toolbar_vertical_separator: line,
      tab_selected: surface,
      tab_text: text,
      tab_background_text: muted,
      tab_background_separator: line,
      tab_line: accent,
      popup: surface,
      popup_text: text,
      popup_border: line,
      popup_highlight: accent,
      popup_highlight_text: bg,
      button_background_hover: line,
      button_background_active: accent,
      icons: text,
      icons_attention: accent,
      ntp_background: bg,
      ntp_text: text,
    },
  };
}

async function applyCurrent(force = false) {
  const reply = await request("theme.current");
  if (!reply?.ok) throw new Error(reply?.error || "theme.current failed");
  const signature = JSON.stringify(reply.data?.colors || {});
  if (!force && signature === lastTheme) return reply.data;
  lastTheme = signature;
  await browser.theme.update(themeObject(reply.data));
  return reply.data;
}

async function boot() {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await applyCurrent(true);
      return;
    } catch (err) {
      console.warn("Tiger theme:", err.message);
      await new Promise((resolve) => setTimeout(resolve, 2000 + attempt * 1000));
    }
  }
}

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;

  if (message.type === "tiger.themeList") {
    request("theme.list")
      .then((reply) => sendResponse(reply))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "tiger.themeSet") {
    const name = String(message.name || "");
    request("theme.set", { name }, 25000)
      .then(async (reply) => {
        if (reply?.ok && reply.data) {
          lastTheme = JSON.stringify(reply.data.colors || {});
          await browser.theme.update(themeObject(reply.data));
        }
        sendResponse(reply);
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "tiger.themeCurrent") {
    applyCurrent(true)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  return false;
});

browser.commands.onCommand.addListener((command) => {
  if (command !== "open-theme") return;
  browser.browserAction.openPopup().catch((err) => {
    console.warn("Tiger theme: could not open popup:", err);
  });
});

browser.commands.getAll().then((commands) => {
  console.info(
    "Tiger Theme commands",
    JSON.stringify(commands.map((command) => `${command.name}=${command.shortcut}`))
  );
});

setInterval(() => {
  applyCurrent(false).catch(() => {});
}, POLL_MS);

boot();

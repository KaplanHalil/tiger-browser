"use strict";

const HOST = "org.tiger.host";

console.info("Tiger Tools: background started");
console.info(
  "Tiger Tools: newtab override",
  JSON.stringify(browser.runtime.getManifest().chrome_url_overrides || null)
);

function callNative(action, payload = {}) {
  return new Promise((resolve, reject) => {
    let port;
    try {
      port = browser.runtime.connectNative(HOST);
    } catch (err) {
      reject(err);
      return;
    }

    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      try { port.disconnect(); } catch (_) { /* already gone */ }
      fn(value);
    };

    port.onMessage.addListener((msg) => finish(resolve, msg));
    port.onDisconnect.addListener(() => {
      let message = "Tiger native host disconnected";
      try {
        if (browser.runtime.lastError) message = browser.runtime.lastError.message;
      } catch (_) { /* no lastError */ }
      finish(reject, new Error(message));
    });

    try {
      port.postMessage({ action, ...payload });
    } catch (err) {
      finish(reject, err);
    }
  });
}

async function flashError() {
  try {
    await browser.browserAction.setBadgeBackgroundColor({ color: "#ED5B5A" });
    await browser.browserAction.setBadgeText({ text: "!" });
    setTimeout(() => browser.browserAction.setBadgeText({ text: "" }).catch(() => {}), 2500);
  } catch (_) { /* badge is cosmetic */ }
}

async function toggleTerminal() {
  try {
    const reply = await callNative("terminal.toggle");
    if (!reply || reply.ok !== true) throw new Error(reply?.error || "terminal toggle failed");
    await browser.browserAction.setBadgeText({ text: "" });
  } catch (err) {
    console.error("Tiger terminal:", err);
    await flashError();
  }
}

browser.browserAction.onClicked.addListener(toggleTerminal);

browser.commands.onCommand.addListener((command) => {
  if (command === "toggle-terminal") toggleTerminal();
});

browser.commands.getAll().then((commands) => {
  console.info(
    "Tiger Tools commands",
    JSON.stringify(commands.map((command) => `${command.name}=${command.shortcut}`))
  );
});

// The new tab asks for the current Omarchy theme name. Cache it briefly so a
// new tab does not spawn a native process every time.
let themeCache = { name: "", at: 0 };

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "tiger.themeName") return false;

  const now = Date.now();
  if (themeCache.name && now - themeCache.at < 15000) {
    sendResponse({ ok: true, name: themeCache.name });
    return false;
  }

  callNative("theme.current")
    .then((reply) => {
      const name = reply?.ok ? reply.data?.name || "" : "";
      themeCache = { name, at: Date.now() };
      sendResponse({ ok: Boolean(name), name });
    })
    .catch(() => sendResponse({ ok: false, name: "" }));

  return true;
});

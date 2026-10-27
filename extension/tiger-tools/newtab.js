"use strict";

console.info("Tiger newtab loaded", location.href);

const api = typeof browser !== "undefined" ? browser : null;
const form = document.getElementById("search");
const input = document.getElementById("q");
const engineButtons = Array.from(document.querySelectorAll("[data-engine]"));
const themeLabel = document.getElementById("theme-name");

const ENGINES = {
  google: {
    action: "https://www.google.com/search",
    placeholder: "Search with Google",
  },
  ddg: {
    action: "https://duckduckgo.com/",
    placeholder: "Search with DuckDuckGo",
  },
};

function setEngine(name) {
  const engine = ENGINES[name] || ENGINES.google;
  form.action = engine.action;
  input.placeholder = engine.placeholder;
  for (const button of engineButtons) {
    button.classList.toggle("active", button.dataset.engine === name);
  }
  try {
    localStorage.setItem("tiger.engine", name);
  } catch (_) { /* storage can be unavailable */ }
}

function applyTheme(theme) {
  const colors = theme && theme.colors ? theme.colors : {};
  const root = document.documentElement;
  const map = {
    "--bg": colors.frame,
    "--surface": colors.popup || colors.toolbar,
    "--line": colors.popup_border || colors.toolbar_field_border,
    "--text": colors.toolbar_text || colors.popup_text,
    "--accent": colors.tab_line,
    "--accent-2": colors.toolbar_field_text_focus,
  };
  for (const [name, value] of Object.entries(map)) {
    if (typeof value === "string" && value) root.style.setProperty(name, value);
  }
}

async function syncTheme() {
  if (!api) return;
  try {
    if (api.theme && api.theme.getCurrent) {
      applyTheme(await api.theme.getCurrent());
    }
    const reply = await api.runtime.sendMessage({ type: "tiger.themeName" });
    if (reply && reply.ok && reply.name) {
      themeLabel.textContent = String(reply.name).toUpperCase();
    }
  } catch (_) { /* keep the built-in palette */ }
}

function openUrl(url) {
  if (!api || !api.tabs) return;
  api.tabs.create({ url }).catch(() => {});
}

for (const button of engineButtons) {
  button.addEventListener("click", () => setEngine(button.dataset.engine));
}

for (const chip of document.querySelectorAll("[data-url]")) {
  chip.addEventListener("click", () => openUrl(chip.dataset.url));
}

form.addEventListener("submit", (event) => {
  if (!input.value.trim()) {
    event.preventDefault();
    input.focus();
  }
});

document.addEventListener("keydown", (event) => {
  const typing = document.activeElement === input;
  if (event.key === "/" && !typing) {
    event.preventDefault();
    input.focus();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    input.focus();
    input.select();
    return;
  }
  if (event.key === "Escape" && typing) {
    if (input.value) {
      input.value = "";
    } else {
      input.blur();
    }
  }
});

let savedEngine = "google";
try {
  savedEngine = localStorage.getItem("tiger.engine") || "google";
} catch (_) { /* storage can be unavailable */ }
setEngine(savedEngine);

input.focus();
requestAnimationFrame(() => {
  document.documentElement.dataset.ready = "1";
});

syncTheme();

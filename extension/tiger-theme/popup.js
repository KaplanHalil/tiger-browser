"use strict";

const listEl = document.getElementById("list");
const filterEl = document.getElementById("filter");
const currentEl = document.getElementById("current");
const countEl = document.getElementById("count");
const liveEl = document.getElementById("live");

let rows = [];
let currentName = "";

function setLive(text, isError = false) {
  liveEl.textContent = text;
  liveEl.classList.toggle("error", isError);
}

function applyPalette(data) {
  const c = data?.colors || {};
  const root = document.documentElement;
  const set = (name, value) => {
    if (typeof value === "string" && value) root.style.setProperty(name, value);
  };
  set("--bg", c.background);
  set("--surface", c.lighter_background || c.dark_background);
  set("--line", c.selection || c.muted);
  set("--text", c.foreground);
  set("--muted", c.muted);
  set("--accent", c.accent);
  set("--danger", c.red);
}

function rowFor(theme) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "row";
  row.dataset.name = theme.name;
  row.setAttribute("role", "option");
  row.setAttribute("aria-selected", theme.name === currentName ? "true" : "false");

  const swatches = document.createElement("span");
  swatches.className = "swatches";
  for (const key of ["accent", "red", "green", "blue"]) {
    const chip = document.createElement("i");
    const color = theme.colors?.[key];
    if (color) chip.style.background = color;
    swatches.append(chip);
  }

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = String(theme.name || "").toUpperCase();

  const mode = document.createElement("span");
  mode.className = "mode";
  mode.textContent = String(theme.mode || "").toUpperCase();

  row.append(swatches, name, mode);
  row.addEventListener("click", () => choose(theme.name, row));
  return row;
}

async function choose(name, row) {
  if (!name) return;
  if (name === currentName) {
    setLive("LIVE");
    return;
  }

  setLive("APPLYING");
  row.setAttribute("aria-busy", "true");

  try {
    const reply = await browser.runtime.sendMessage({ type: "tiger.themeSet", name });
    if (!reply || reply.ok !== true) throw new Error(reply?.error || "theme.set failed");

    currentName = name;
    for (const candidate of rows) {
      candidate.setAttribute("aria-selected", candidate.dataset.name === name ? "true" : "false");
    }
    applyPalette(reply.data);
    currentEl.textContent = name.toUpperCase();
    setLive("LIVE");
    row.focus();
  } catch (err) {
    console.error("Tiger theme:", err);
    setLive("ERROR", true);
  } finally {
    row.removeAttribute("aria-busy");
  }
}

function showEmpty(message) {
  const box = document.createElement("div");
  box.className = "empty";
  box.textContent = message;
  listEl.replaceChildren(box);
}

function render(data) {
  const themes = Array.isArray(data?.themes) ? data.themes : [];
  currentName = data?.current || "";
  applyPalette(data?.currentTheme || themes.find((theme) => theme.name === currentName));

  currentEl.textContent = currentName ? currentName.toUpperCase() : "NO THEME";
  countEl.textContent = `${themes.length} THEMES`;

  listEl.replaceChildren();
  rows = themes.map((theme) => {
    const row = rowFor(theme);
    listEl.append(row);
    return row;
  });

  if (!rows.length) {
    showEmpty("No Omarchy themes with colors.toml were found.");
  }
}

async function load() {
  setLive("LOADING");
  try {
    const reply = await browser.runtime.sendMessage({ type: "tiger.themeList" });
    if (!reply || reply.ok !== true) throw new Error(reply?.error || "theme.list failed");
    render(reply.data);
    setLive("LIVE");
  } catch (err) {
    console.error("Tiger theme:", err);
    setLive("ERROR", true);
    showEmpty("Tiger native host is not reachable. Run install.sh and check ~/.local/state/tiger/host.log.");
  }
}

filterEl.addEventListener("input", () => {
  const query = filterEl.value.trim().toLowerCase();
  for (const row of rows) {
    row.hidden = Boolean(query) && !row.dataset.name.toLowerCase().includes(query);
  }
  const visible = rows.filter((row) => !row.hidden);
  if (visible.length && document.activeElement !== filterEl && !visible.includes(document.activeElement)) {
    visible[0].focus();
  }
});

document.addEventListener("keydown", (event) => {
  const visible = rows.filter((row) => !row.hidden);
  if (!visible.length) return;

  const index = visible.indexOf(document.activeElement);

  if (event.key === "ArrowDown") {
    event.preventDefault();
    visible[Math.min(index + 1, visible.length - 1)].focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    visible[Math.max(index - 1, 0)].focus();
  } else if (event.key === "Escape") {
    window.close();
  }
});

filterEl.focus();
load();

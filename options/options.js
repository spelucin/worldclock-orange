import {
  getLocations,
  saveLocations,
  getSettings,
  saveSettings,
  uid,
  DEFAULT_WORK,
} from "../lib/store.js";
import { ACCENTS, ACCENT_NAMES } from "../lib/theme.js";
import { createSearch } from "../lib/search.js";
import { setLang, getLang, applyI18n, t } from "../lib/i18n.js";

const $ = (sel) => document.querySelector(sel);

let locations = [];
let settings = {};
let searchCtl = null;

init();

async function init() {
  locations = await getLocations();
  settings = await getSettings();
  ensurePrimary();

  setLang(settings.lang);
  applyTheme();
  applyI18n();
  renderTheme();
  renderMode();
  renderLang();
  renderLocalHours();
  renderList();

  searchCtl = createSearch({
    onPick: (item) => addLocation(item),
  });
  searchCtl.mount($("#searchWrap"));
  searchCtl.focus();

  bind();
}

function ensurePrimary() {
  if (!locations.some((l) => l.isPrimary) && locations.length > 0) {
    locations[0].isPrimary = true;
    saveLocations(locations);
  }
}

/* ---------- Theme ---------- */

function resolveMode(mode) {
  if (mode === "system") {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme() {
  document.documentElement.dataset.accent = settings.accent || "orange";
  document.documentElement.dataset.mode = resolveMode(settings.mode);
}

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (settings.mode === "system") applyTheme();
});

function renderTheme() {
  const wrap = $("#swatches");
  wrap.textContent = "";
  ACCENT_NAMES.forEach((name) => {
    const accent = ACCENTS[name];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `swatch${settings.accent === name ? " active" : ""}`;
    btn.style.background = accent.c500;
    btn.title = accent.label;
    btn.dataset.accent = name;
    btn.setAttribute("aria-label", `Color ${accent.label}`);
    btn.addEventListener("click", () => {
      settings.accent = name;
      saveSettings(settings);
      applyTheme();
      renderTheme();
    });
    wrap.appendChild(btn);
  });
}

function renderMode() {
  document.querySelectorAll("#modeSegmented .seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === settings.mode);
  });
}

function renderLang() {
  document.querySelectorAll("#langSegmented .seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === getLang());
  });
}

/* ---------- Local hours ---------- */

function renderLocalHours() {
  $("#localStart").value = settings.localWorkStart;
  $("#localEnd").value = settings.localWorkEnd;
}

/* ---------- Locations ---------- */

function addLocation(item) {
  const first = locations.length === 0;
  locations.push({
    id: uid(),
    label: item.city,
    timezone: item.timezone,
    country: item.country || "",
    isPrimary: first,
    ...DEFAULT_WORK,
  });
  saveLocations(locations);
  renderList();
}

function renderList() {
  const list = $("#optionList");
  list.textContent = "";
  $("#emptyState").hidden = locations.length > 0;

  locations.forEach((loc, index) => {
    const card = document.createElement("div");
    card.className = "opt-card";
    card.style.setProperty("--i", index);

    const head = document.createElement("div");
    head.className = "opt-head";

    const main = document.createElement("div");
    main.className = "opt-main";
    const city = document.createElement("div");
    city.className = `opt-city${loc.isPrimary ? " primary" : ""}`;
    city.textContent = loc.label;
    const tz = document.createElement("div");
    tz.className = "opt-tz";
    tz.textContent = loc.timezone;
    main.append(city, tz);

    const actions = document.createElement("div");
    actions.className = "opt-actions";

    const star = document.createElement("button");
    star.type = "button";
    star.className = `opt-action${loc.isPrimary ? " starred" : ""}`;
    star.title = loc.isPrimary ? t("primaryLocation") : t("setPrimary");
    star.innerHTML = STAR_ICON;
    star.addEventListener("click", () => {
      locations.forEach((l) => (l.isPrimary = l.id === loc.id));
      saveLocations(locations);
      renderList();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "opt-action danger";
    remove.title = t("remove");
    remove.innerHTML = TRASH_ICON;
    remove.addEventListener("click", () => {
      locations = locations.filter((l) => l.id !== loc.id);
      ensurePrimary();
      saveLocations(locations);
      renderList();
    });

    actions.append(star, remove);
    head.append(main, actions);

    const body = document.createElement("div");
    body.className = "opt-body";

    const workRow = document.createElement("div");
    workRow.className = "opt-work-row";
    const start = document.createElement("input");
    start.type = "time";
    start.className = "opt-time";
    start.value = loc.workStart;
    start.title = t("start");
    start.addEventListener("change", () => {
      loc.workStart = start.value || "09:00";
      saveLocations(locations);
    });
    const sep = document.createElement("span");
    sep.className = "time-sep";
    sep.textContent = "—";
    const end = document.createElement("input");
    end.type = "time";
    end.className = "opt-time";
    end.value = loc.workEnd;
    end.title = t("end");
    end.addEventListener("change", () => {
      loc.workEnd = end.value || "18:00";
      saveLocations(locations);
    });
    workRow.append(start, sep, end);

    const label = document.createElement("label");
    label.className = "opt-check";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = loc.weekdaysOnly;
    check.addEventListener("change", () => {
      loc.weekdaysOnly = check.checked;
      saveLocations(locations);
    });
    label.append(check, document.createTextNode(t("weekdaysOnly")));

    body.append(workRow, label);
    card.append(head, body);
    list.appendChild(card);
  });
}

/* ---------- Bindings ---------- */

function bind() {
  document.querySelectorAll("#modeSegmented .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.mode = btn.dataset.mode;
      saveSettings(settings);
      applyTheme();
      renderMode();
    });
  });

  document.querySelectorAll("#langSegmented .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.lang = btn.dataset.lang;
      saveSettings(settings);
      setLang(settings.lang);
      applyI18n();
      renderLang();
      renderList();
      if (searchCtl) searchCtl.focus();
    });
  });

  $("#localStart").addEventListener("change", (e) => {
    settings.localWorkStart = e.target.value || "09:00";
    saveSettings(settings);
  });
  $("#localEnd").addEventListener("change", (e) => {
    settings.localWorkEnd = e.target.value || "18:00";
    saveSettings(settings);
  });
}

const STAR_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.7l-5.8 3.05 1.1-6.47L2.6 9.7l6.5-.95z"/></svg>`;

const TRASH_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;
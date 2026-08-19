import {
  LOCAL_TIMEZONE,
  getTimeInZone,
  formatTime,
  getHoursDiffMinutes,
  formatDiff,
  isWithinWorkingHours,
  formatDate,
  friendlyCity,
} from "../lib/clock.js";
import {
  getLocations,
  saveLocations,
  getSettings,
  saveSettings,
  uid,
  DEFAULT_WORK,
} from "../lib/store.js";
import { MODES } from "../lib/theme.js";
import { createSearch } from "../lib/search.js";
import { setLang, locale, applyI18n, t } from "../lib/i18n.js";

const $ = (sel) => document.querySelector(sel);

let locations = [];
let settings = {};
let activeId = null;
let lastRemoteTime = "";

init();

async function init() {
  locations = await getLocations();
  settings = await getSettings();
  ensurePrimary();
  activeId = locations.find((l) => l.isPrimary)?.id || locations[0]?.id || null;

  setLang(settings.lang);
  applyTheme();
  applyI18n();

  const search = createSearch({
    onPick: (item) => addLocation(item),
  });
  search.mount($("#searchWrap"));

  bind(search);
  render();
  setInterval(tick, 20000);
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

function cycleMode() {
  const idx = MODES.indexOf(settings.mode);
  settings.mode = MODES[(idx + 1) % MODES.length];
  saveSettings(settings);
  applyTheme();
}

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (settings.mode === "system") applyTheme();
});

/* ---------- Rendering ---------- */

function workInfo(timeZone, work) {
  if (!timeZone) return null;
  const ok = isWithinWorkingHours(timeZone, work.workStart, work.workEnd, work.weekdaysOnly);
  return ok
    ? { cls: "ok", label: t("inHours") }
    : { cls: "bad", label: t("outHours") };
}

function setPill(el, info) {
  el.className = `pill ${info ? info.cls : "muted"}`;
  el.innerHTML = info ? `<i class="pill-dot"></i>${info.label}` : "";
}

function render() {
  const now = new Date();
  const localTz = LOCAL_TIMEZONE;
  const local = getTimeInZone(localTz, now);
  const active = locations.find((l) => l.id === activeId) || null;

  $("#localZone").textContent = friendlyCity(localTz);
  $("#localTime").textContent = formatTime(local.hour, local.minute);
  $("#localDate").textContent = formatDate(localTz, now, locale());
  setPill(
    $("#localWork"),
    workInfo(localTz, {
      workStart: settings.localWorkStart,
      workEnd: settings.localWorkEnd,
      weekdaysOnly: true,
    })
  );

  if (active) {
    const remote = getTimeInZone(active.timezone, now);
    const remoteTime = formatTime(remote.hour, remote.minute);
    const remoteEl = $("#remoteTime");
    if (lastRemoteTime && lastRemoteTime !== remoteTime) {
      remoteEl.classList.remove("ticking");
      void remoteEl.offsetWidth;
      remoteEl.classList.add("ticking");
    }
    lastRemoteTime = remoteTime;

    $("#remoteLabel").textContent = active.isPrimary ? t("primaryLocation") : t("location");
    $("#remoteName").textContent = active.label;
    $("#remoteTime").textContent = remoteTime;
    $("#remoteDate").textContent = formatDate(active.timezone, now, locale());
    const pill = $("#remoteWork");
    pill.hidden = false;
    setPill(pill, workInfo(active.timezone, active));

    const diff = getHoursDiffMinutes(localTz, active.timezone, now);
    $("#diff").textContent = formatDiff(diff);
    $("#diffNote").textContent =
      diff === 0 ? t("sameTime") : diff > 0 ? t("ahead") : t("behind");
  } else {
    $("#remoteLabel").textContent = t("location");
    $("#remoteName").textContent = "—";
    $("#remoteTime").textContent = "--:--";
    $("#remoteDate").textContent = "";
    $("#remoteWork").hidden = true;
    $("#diff").textContent = "—";
    $("#diffNote").textContent = t("addLocation");
  }

  renderList(now);
}

function renderList(now) {
  const list = $("#locationList");
  list.textContent = "";
  $("#locCount").textContent = locations.length;
  $("#emptyState").hidden = locations.length > 0;

  locations.forEach((loc, index) => {
    const t = getTimeInZone(loc.timezone, now);
    const info = workInfo(loc.timezone, loc);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "loc-card";
    if (loc.id === activeId) card.classList.add("active");
    card.style.setProperty("--i", index);
    card.dataset.id = loc.id;

    const dot = document.createElement("span");
    dot.className = `loc-dot ${info ? info.cls : ""}`;

    const main = document.createElement("span");
    main.className = "loc-main";
    const city = document.createElement("span");
    city.className = "loc-city";
    city.textContent = loc.isPrimary ? `★ ${loc.label}` : loc.label;
    const tz = document.createElement("span");
    tz.className = "loc-tz";
    tz.textContent = loc.timezone;
    main.append(city, tz);

    const time = document.createElement("span");
    time.className = "loc-time";
    time.textContent = formatTime(t.hour, t.minute);

    const offset = document.createElement("span");
    offset.className = "loc-offset";
    const diff = getHoursDiffMinutes(LOCAL_TIMEZONE, loc.timezone, now);
    offset.textContent = diff === 0 ? "0h" : formatDiff(diff);

    const actions = document.createElement("span");
    actions.className = "loc-actions";

    const star = document.createElement("button");
    star.type = "button";
    star.className = `loc-action-btn star${loc.isPrimary ? " starred" : ""}`;
    star.title = loc.isPrimary ? t("primaryLocation") : t("setPrimary");
    star.innerHTML = STAR_ICON;
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      setPrimary(loc.id);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "loc-action-btn danger";
    remove.title = t("remove");
    remove.innerHTML = TRASH_ICON;
    remove.addEventListener("click", (e) => {
      e.stopPropagation();
      removeLocation(loc.id);
    });

    actions.append(star, remove);
    card.append(dot, main, time, offset, actions);
    card.addEventListener("click", () => {
      activeId = loc.id;
      render();
    });
    list.appendChild(card);
  });
}

/* ---------- Mutations ---------- */

function addLocation(item) {
  const first = locations.length === 0;
  const location = {
    id: uid(),
    label: item.city,
    timezone: item.timezone,
    country: item.country || "",
    isPrimary: first,
    ...DEFAULT_WORK,
  };
  locations.push(location);
  activeId = location.id;
  saveLocations(locations);
  $("#searchWrap").hidden = true;
  render();
}

function removeLocation(id) {
  locations = locations.filter((l) => l.id !== id);
  if (locations.some((l) => l.isPrimary) === false && locations.length > 0) {
    locations[0].isPrimary = true;
  }
  if (activeId === id) {
    activeId = locations.find((l) => l.isPrimary)?.id || locations[0]?.id || null;
  }
  saveLocations(locations);
  render();
}

function setPrimary(id) {
  locations.forEach((l) => (l.isPrimary = l.id === id));
  activeId = id;
  saveLocations(locations);
  render();
}

function tick() {
  render();
}

/* ---------- Bindings ---------- */

function bind(search) {
  $("#themeBtn").addEventListener("click", cycleMode);
  $("#settingsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());

  const toggleSearch = () => {
    const wrap = $("#searchWrap");
    wrap.hidden = !wrap.hidden;
    if (!wrap.hidden) search.focus();
  };

  $("#addBtn").addEventListener("click", toggleSearch);
  $("#emptyAddBtn").addEventListener("click", toggleSearch);
}

const STAR_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.7l-5.8 3.05 1.1-6.47L2.6 9.7l6.5-.95z"/></svg>`;

const TRASH_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;
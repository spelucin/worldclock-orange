import { getTimeInZone, formatTime } from "./lib/clock.js";
import { getLocations, getSettings } from "./lib/store.js";
import { ACCENTS } from "./lib/theme.js";

const LOCAL_TIMEZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
})();

async function updateBadge() {
  try {
    const [locations, settings] = await Promise.all([getLocations(), getSettings()]);
    const primary = locations.find((l) => l.isPrimary);
    const timeZone = primary ? primary.timezone : LOCAL_TIMEZONE;

    const t = getTimeInZone(timeZone);
    if (!t) return;
    const text = formatTime(t.hour, t.minute);

    const accent = ACCENTS[settings.accent] || ACCENTS.orange;
    await chrome.action.setBadgeBackgroundColor({ color: accent.c600 });
    await chrome.action.setBadgeTextColor({ color: "#ffffff" });
    await chrome.action.setBadgeText({ text });
  } catch (err) {
    console.error("updateBadge failed", err);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("worldclock-tick", { periodInMinutes: 1 });
  updateBadge();
});

chrome.runtime.onStartup.addListener(updateBadge);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "worldclock-tick") updateBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.locations || changes.settings)) updateBadge();
});
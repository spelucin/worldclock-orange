const KEYS = {
  LOCATIONS: "locations",
  SETTINGS: "settings",
};

export const DEFAULT_SETTINGS = {
  accent: "orange",
  mode: "system",
  lang: "en",
  localWorkStart: "09:00",
  localWorkEnd: "18:00",
};

export const DEFAULT_WORK = {
  workStart: "09:00",
  workEnd: "18:00",
  weekdaysOnly: true,
};

export async function getLocations() {
  const { locations } = await chrome.storage.local.get(KEYS.LOCATIONS);
  const list = Array.isArray(locations) ? locations : [];
  return list.filter(
    (l) => l && typeof l.timezone === "string" && isSupportedZone(l.timezone)
  );
}

function isSupportedZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export async function saveLocations(locations) {
  await chrome.storage.local.set({ [KEYS.LOCATIONS]: locations });
}

export async function getSettings() {
  const { settings } = await chrome.storage.local.get(KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ [KEYS.SETTINGS]: settings });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
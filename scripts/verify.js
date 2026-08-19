import {
  getTimeInZone,
  formatTime,
  getOffsetMinutes,
  getHoursDiffMinutes,
  formatDiff,
  formatDiffNote,
  parseHHMM,
  isWithinRange,
  isWithinWorkingHours,
  friendlyCity,
  formatUtcOffset,
} from "../lib/clock.js";
import { CURATED_CITIES, searchLocations, allTimezones } from "../lib/data.js";
import { ACCENTS } from "../lib/theme.js";

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name} ${detail}`);
  }
}

const now = new Date();

console.log("clock");
{
  for (const tz of ["Europe/Madrid", "Asia/Tokyo", "America/New_York", "UTC"]) {
    const { hour, minute } = getTimeInZone(tz, now);
    const ref = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(now);
    check(`getTimeInZone(${tz})`, formatTime(hour, minute) === ref, `${formatTime(hour, minute)} vs ${ref}`);
  }

  const local = "Europe/Madrid";
  const target = "Asia/Tokyo";
  const diff = getHoursDiffMinutes(local, target, now);
  const expected = getOffsetMinutes(target, now) - getOffsetMinutes(local, now);
  check("getHoursDiffMinutes", diff === expected, `${diff} vs ${expected}`);
  check("diff nonzero (Madrid vs Tokyo)", Math.abs(diff) >= 7, `diff=${diff}`);
  check("formatDiff sign", formatDiff(diff).startsWith("+"), formatDiff(diff));
  check("formatDiff zero", formatDiff(0) === "0h");
  check("formatDiffNote zero", formatDiffNote(0) === "Mismo horario");
  check("formatUtcOffset", formatUtcOffset(120) === "UTC+02:00");
  check("formatUtcOffset neg", formatUtcOffset(-300) === "UTC-05:00");
  check("formatUtcOffset half", formatUtcOffset(330) === "UTC+05:30");
}

console.log("working hours");
{
  check("parseHHMM", parseHHMM("09:30") === 570);
  check("isWithinRange basic", isWithinRange(600, 540, 1080) === true);
  check("isWithinRange before", isWithinRange(500, 540, 1080) === false);
  check("isWithinRange after", isWithinRange(1100, 540, 1080) === false);
  check("isWithinRange overnight in", isWithinRange(120, 1320, 480) === true);
  check("isWithinRange overnight out", isWithinRange(600, 1320, 480) === false);
  check("isWithinRange full day", isWithinRange(999, 540, 540) === true);
  check("isWithinRange boundary end", isWithinRange(1080, 540, 1080) === false);

  // Weekend: Madrid at a known Saturday. Use a fixed date: 2026-08-15 (Saturday)
  const sat = new Date("2026-08-15T12:00:00Z");
  check("weekend excluded", isWithinWorkingHours("Europe/Madrid", "09:00", "18:00", true, sat) === false);
  check("weekend allowed when disabled", isWithinWorkingHours("Europe/Madrid", "09:00", "18:00", false, sat) === true);
  const mon = new Date("2026-08-17T12:00:00Z");
  check("monday 12:00 UTC in Madrid (14:00) within", isWithinWorkingHours("Europe/Madrid", "09:00", "18:00", true, mon) === true);
}

console.log("data");
{
  check("curated count >= 40", CURATED_CITIES.length >= 40, String(CURATED_CITIES.length));
  check("all timezones count", allTimezones().length >= 400, String(allTimezones().length));
  const res = searchLocations("madrid");
  check("search madrid finds Madrid", res.some((r) => r.timezone === "Europe/Madrid"));
  check("search first result is curated Madrid", res[0] && res[0].city === "Madrid");
  const tokyo = searchLocations("tokyo");
  check("search tokyo", tokyo.some((r) => r.timezone === "Asia/Tokyo"));
  const empty = searchLocations("");
  check("empty query returns curated", empty.length === CURATED_CITIES.length);
  const dupes = searchLocations("new york");
  check(
    "search no duplicate city|tz",
    new Set(dupes.map((r) => `${r.city}|${r.timezone}`)).size === dupes.length
  );
  check("search 'chipre' finds Cyprus", searchLocations("chipre").some((r) => r.timezone === "Asia/Nicosia"));
  check("search 'cyprus' finds Cyprus", searchLocations("cyprus").some((r) => r.timezone === "Asia/Nicosia"));
  check("search 'albania' finds Albania", searchLocations("albania").some((r) => r.timezone === "Europe/Tirane"));
  check("search 'albânia' finds Albania", searchLocations("albânia").some((r) => r.timezone === "Europe/Tirane"));
  check("search 'peru' finds Lima", searchLocations("peru").some((r) => r.timezone === "America/Lima"));
  check("search 'Perú' finds Lima", searchLocations("Perú").some((r) => r.timezone === "America/Lima"));
  check("search 'españa' finds Madrid", searchLocations("españa").some((r) => r.timezone === "Europe/Madrid"));
  check("search 'spain' finds Madrid", searchLocations("spain").some((r) => r.timezone === "Europe/Madrid"));
}

console.log("theme");
{
  check("accents defined", Object.keys(ACCENTS).length >= 10, String(Object.keys(ACCENTS).length));
  check("orange c600", ACCENTS.orange.c600 === "#ea580c");
  check("friendlyCity", friendlyCity("America/Argentina/Buenos_Aires") === "Buenos Aires");
  check("friendlyCity simple", friendlyCity("Asia/Tokyo") === "Tokyo");
}

console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
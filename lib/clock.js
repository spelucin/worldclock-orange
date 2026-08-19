export const LOCAL_TIMEZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
})();

export function getTimeInZone(timeZone, date = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour").value);
  const minute = Number(parts.find((p) => p.type === "minute").value);
  return { hour, minute };
}

export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getOffsetMinutes(timeZone, date = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    });
    const tzName = dtf
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName").value;
    const m = tzName.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!m) return 0;
    const sign = m[1] === "-" ? -1 : 1;
    return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
  } catch {
    return 0;
  }
}

export function formatUtcOffset(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${h}:${m}`;
}

export function getHoursDiffMinutes(localZone, targetZone, date = new Date()) {
  return getOffsetMinutes(targetZone, date) - getOffsetMinutes(localZone, date);
}

export function formatDiff(minutes) {
  if (minutes === 0) return "0h";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${String(m).padStart(2, "0")}m`;
}

export function formatDiffNote(minutes) {
  if (minutes === 0) return "Mismo horario";
  return minutes > 0 ? "Por delante de ti" : "Por detrás de ti";
}

export function parseHHMM(value) {
  const [h, m] = String(value).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function isWithinRange(minutes, startMin, endMin) {
  if (startMin === endMin) return true;
  if (endMin > startMin) return minutes >= startMin && minutes < endMin;
  return minutes >= startMin || minutes < endMin;
}

export function getMinutesInZone(timeZone, date = new Date()) {
  const { hour, minute } = getTimeInZone(timeZone, date);
  return hour * 60 + minute;
}

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function getWeekdayInZone(timeZone, date = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });
    const name = dtf.formatToParts(date).find((p) => p.type === "weekday").value;
    return WEEKDAY_INDEX[name] ?? 0;
  } catch {
    return 0;
  }
}

export function isWithinWorkingHours(timeZone, workStart, workEnd, weekdaysOnly, date = new Date()) {
  if (weekdaysOnly) {
    const day = getWeekdayInZone(timeZone, date);
    if (day === 0 || day === 6) return false;
  }
  const minutes = getMinutesInZone(timeZone, date);
  return isWithinRange(minutes, parseHHMM(workStart), parseHHMM(workEnd));
}

export function formatDate(timeZone, date = new Date(), locale = "es-ES") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function friendlyCity(timeZone) {
  if (!timeZone) return "";
  const parts = timeZone.split("/");
  const city = parts[parts.length - 1].replace(/_/g, " ");
  return parts.length > 1 ? city : timeZone;
}
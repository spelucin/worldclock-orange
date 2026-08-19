import { friendlyCity } from "./clock.js";

export const CURATED_CITIES = [
  { city: "Madrid", country: "España", timezone: "Europe/Madrid" },
  { city: "Barcelona", country: "España", timezone: "Europe/Madrid" },
  { city: "Lisboa", country: "Portugal", timezone: "Europe/Lisbon" },
  { city: "Londres", country: "Reino Unido", timezone: "Europe/London" },
  { city: "Dublín", country: "Irlanda", timezone: "Europe/Dublin" },
  { city: "París", country: "Francia", timezone: "Europe/Paris" },
  { city: "Ámsterdam", country: "Países Bajos", timezone: "Europe/Amsterdam" },
  { city: "Berlín", country: "Alemania", timezone: "Europe/Berlin" },
  { city: "Roma", country: "Italia", timezone: "Europe/Rome" },
  { city: "Viena", country: "Austria", timezone: "Europe/Vienna" },
  { city: "Zúrich", country: "Suiza", timezone: "Europe/Zurich" },
  { city: "Estocolmo", country: "Suecia", timezone: "Europe/Stockholm" },
  { city: "Atenas", country: "Grecia", timezone: "Europe/Athens" },
  { city: "Estambul", country: "Turquía", timezone: "Europe/Istanbul" },
  { city: "Moscú", country: "Rusia", timezone: "Europe/Moscow" },
  { city: "Reikiavik", country: "Islandia", timezone: "Atlantic/Reykjavik" },
  { city: "Ciudad de México", country: "México", timezone: "America/Mexico_City" },
  { city: "Nueva York", country: "EE. UU.", timezone: "America/New_York" },
  { city: "Miami", country: "EE. UU.", timezone: "America/New_York" },
  { city: "Chicago", country: "EE. UU.", timezone: "America/Chicago" },
  { city: "Denver", country: "EE. UU.", timezone: "America/Denver" },
  { city: "Seattle", country: "EE. UU.", timezone: "America/Los_Angeles" },
  { city: "Los Ángeles", country: "EE. UU.", timezone: "America/Los_Angeles" },
  { city: "Houston", country: "EE. UU.", timezone: "America/Chicago" },
  { city: "Anchorage", country: "EE. UU.", timezone: "America/Anchorage" },
  { city: "Toronto", country: "Canadá", timezone: "America/Toronto" },
  { city: "Vancouver", country: "Canadá", timezone: "America/Vancouver" },
  { city: "Bogotá", country: "Colombia", timezone: "America/Bogota" },
  { city: "Lima", country: "Perú", timezone: "America/Lima" },
  { city: "Santiago", country: "Chile", timezone: "America/Santiago" },
  { city: "Buenos Aires", country: "Argentina", timezone: "America/Argentina/Buenos_Aires" },
  { city: "São Paulo", country: "Brasil", timezone: "America/Sao_Paulo" },
  { city: "Honolulu", country: "EE. UU.", timezone: "Pacific/Honolulu" },
  { city: "El Cairo", country: "Egipto", timezone: "Africa/Cairo" },
  { city: "Lagos", country: "Nigeria", timezone: "Africa/Lagos" },
  { city: "Nairobi", country: "Kenia", timezone: "Africa/Nairobi" },
  { city: "Johannesburgo", country: "Sudáfrica", timezone: "Africa/Johannesburg" },
  { city: "Dubái", country: "EAU", timezone: "Asia/Dubai" },
  { city: "Bombay", country: "India", timezone: "Asia/Kolkata" },
  { city: "Delhi", country: "India", timezone: "Asia/Kolkata" },
  { city: "Kabul", country: "Afganistán", timezone: "Asia/Kabul" },
  { city: "Bangkok", country: "Tailandia", timezone: "Asia/Bangkok" },
  { city: "Singapur", country: "Singapur", timezone: "Asia/Singapore" },
  { city: "Hong Kong", country: "China", timezone: "Asia/Hong_Kong" },
  { city: "Pekín", country: "China", timezone: "Asia/Shanghai" },
  { city: "Seúl", country: "Corea del Sur", timezone: "Asia/Seoul" },
  { city: "Tokio", country: "Japón", timezone: "Asia/Tokyo" },
  { city: "Sídney", country: "Australia", timezone: "Australia/Sydney" },
  { city: "Melbourne", country: "Australia", timezone: "Australia/Melbourne" },
  { city: "Auckland", country: "Nueva Zelanda", timezone: "Pacific/Auckland" },
];

let cachedAll = null;

export function allTimezones() {
  if (cachedAll) return cachedAll;
  cachedAll = Intl.supportedValuesOf("timeZone").map((tz) => {
    const parts = tz.split("/");
    const region = parts.length > 1 ? parts[0].replace(/_/g, " ") : "Zona UTC";
    return {
      city: friendlyCity(tz),
      region,
      timezone: tz,
      label: tz.replace(/_/g, " "),
    };
  });
  return cachedAll;
}

export function searchLocations(query) {
  const q = String(query || "").trim().toLowerCase();
  const seen = new Set();
  const out = [];
  const push = (item) => {
    const key = `${item.city}|${item.timezone}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  };
  if (!q) {
    CURATED_CITIES.forEach(push);
    return out;
  }
  CURATED_CITIES.filter((c) =>
    `${c.city} ${c.country} ${c.timezone}`.toLowerCase().includes(q)
  ).forEach(push);
  allTimezones()
    .filter((z) => `${z.city} ${z.region} ${z.label}`.toLowerCase().includes(q))
    .forEach(push);
  return out.slice(0, 40);
}
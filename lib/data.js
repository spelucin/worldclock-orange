import { friendlyCity } from "./clock.js";

export const COUNTRIES = {
  AE: { es: "Emiratos Árabes Unidos", en: "United Arab Emirates", pt: "Emirados Árabes Unidos" },
  AF: { es: "Afganistán", en: "Afghanistan", pt: "Afeganistão" },
  AL: { es: "Albania", en: "Albania", pt: "Albânia" },
  AM: { es: "Armenia", en: "Armenia", pt: "Armênia" },
  AR: { es: "Argentina", en: "Argentina", pt: "Argentina" },
  AT: { es: "Austria", en: "Austria", pt: "Áustria" },
  AU: { es: "Australia", en: "Australia", pt: "Austrália" },
  AZ: { es: "Azerbaiyán", en: "Azerbaijan", pt: "Azerbaijão" },
  BA: { es: "Bosnia y Herzegovina", en: "Bosnia and Herzegovina", pt: "Bósnia e Herzegovina" },
  BD: { es: "Bangladés", en: "Bangladesh", pt: "Bangladesh" },
  BE: { es: "Bélgica", en: "Belgium", pt: "Bélgica" },
  BG: { es: "Bulgaria", en: "Bulgaria", pt: "Bulgária" },
  BH: { es: "Baréin", en: "Bahrain", pt: "Barém" },
  BO: { es: "Bolivia", en: "Bolivia", pt: "Bolívia" },
  BR: { es: "Brasil", en: "Brazil", pt: "Brasil" },
  BY: { es: "Bielorrusia", en: "Belarus", pt: "Bielorrússia" },
  CA: { es: "Canadá", en: "Canada", pt: "Canadá" },
  CH: { es: "Suiza", en: "Switzerland", pt: "Suíça" },
  CL: { es: "Chile", en: "Chile", pt: "Chile" },
  CN: { es: "China", en: "China", pt: "China" },
  CO: { es: "Colombia", en: "Colombia", pt: "Colômbia" },
  CR: { es: "Costa Rica", en: "Costa Rica", pt: "Costa Rica" },
  CU: { es: "Cuba", en: "Cuba", pt: "Cuba" },
  CY: { es: "Chipre", en: "Cyprus", pt: "Chipre" },
  CZ: { es: "Chequia", en: "Czechia", pt: "Chéquia" },
  DE: { es: "Alemania", en: "Germany", pt: "Alemanha" },
  DK: { es: "Dinamarca", en: "Denmark", pt: "Dinamarca" },
  DO: { es: "República Dominicana", en: "Dominican Republic", pt: "República Dominicana" },
  DZ: { es: "Argelia", en: "Algeria", pt: "Argélia" },
  EC: { es: "Ecuador", en: "Ecuador", pt: "Equador" },
  EE: { es: "Estonia", en: "Estonia", pt: "Estônia" },
  EG: { es: "Egipto", en: "Egypt", pt: "Egito" },
  ES: { es: "España", en: "Spain", pt: "Espanha" },
  FI: { es: "Finlandia", en: "Finland", pt: "Finlândia" },
  FJ: { es: "Fiyi", en: "Fiji", pt: "Fiji" },
  FR: { es: "Francia", en: "France", pt: "França" },
  GB: { es: "Reino Unido", en: "United Kingdom", pt: "Reino Unido" },
  GE: { es: "Georgia", en: "Georgia", pt: "Geórgia" },
  GL: { es: "Groenlandia", en: "Greenland", pt: "Groenlândia" },
  GR: { es: "Grecia", en: "Greece", pt: "Grécia" },
  GT: { es: "Guatemala", en: "Guatemala", pt: "Guatemala" },
  HN: { es: "Honduras", en: "Honduras", pt: "Honduras" },
  HR: { es: "Croacia", en: "Croatia", pt: "Croácia" },
  HU: { es: "Hungría", en: "Hungary", pt: "Hungria" },
  ID: { es: "Indonesia", en: "Indonesia", pt: "Indonésia" },
  IE: { es: "Irlanda", en: "Ireland", pt: "Irlanda" },
  IL: { es: "Israel", en: "Israel", pt: "Israel" },
  IN: { es: "India", en: "India", pt: "Índia" },
  IQ: { es: "Irak", en: "Iraq", pt: "Iraque" },
  IR: { es: "Irán", en: "Iran", pt: "Irã" },
  IS: { es: "Islandia", en: "Iceland", pt: "Islândia" },
  IT: { es: "Italia", en: "Italy", pt: "Itália" },
  JM: { es: "Jamaica", en: "Jamaica", pt: "Jamaica" },
  JO: { es: "Jordania", en: "Jordan", pt: "Jordânia" },
  JP: { es: "Japón", en: "Japan", pt: "Japão" },
  KE: { es: "Kenia", en: "Kenya", pt: "Quênia" },
  KH: { es: "Camboya", en: "Cambodia", pt: "Camboja" },
  KR: { es: "Corea del Sur", en: "South Korea", pt: "Coreia do Sul" },
  KW: { es: "Kuwait", en: "Kuwait", pt: "Kuwait" },
  KZ: { es: "Kazajistán", en: "Kazakhstan", pt: "Cazaquistão" },
  LA: { es: "Laos", en: "Laos", pt: "Laos" },
  LB: { es: "Líbano", en: "Lebanon", pt: "Líbano" },
  LK: { es: "Sri Lanka", en: "Sri Lanka", pt: "Sri Lanka" },
  LT: { es: "Lituania", en: "Lithuania", pt: "Lituânia" },
  LU: { es: "Luxemburgo", en: "Luxembourg", pt: "Luxemburgo" },
  LV: { es: "Letonia", en: "Latvia", pt: "Letônia" },
  MA: { es: "Marruecos", en: "Morocco", pt: "Marrocos" },
  MD: { es: "Moldavia", en: "Moldova", pt: "Moldávia" },
  ME: { es: "Montenegro", en: "Montenegro", pt: "Montenegro" },
  MK: { es: "Macedonia del Norte", en: "North Macedonia", pt: "Macedônia do Norte" },
  MM: { es: "Birmania", en: "Myanmar", pt: "Mianmar" },
  MN: { es: "Mongolia", en: "Mongolia", pt: "Mongólia" },
  MX: { es: "México", en: "Mexico", pt: "México" },
  MY: { es: "Malasia", en: "Malaysia", pt: "Malásia" },
  NG: { es: "Nigeria", en: "Nigeria", pt: "Nigéria" },
  NI: { es: "Nicaragua", en: "Nicaragua", pt: "Nicarágua" },
  NL: { es: "Países Bajos", en: "Netherlands", pt: "Países Baixos" },
  NO: { es: "Noruega", en: "Norway", pt: "Noruega" },
  NP: { es: "Nepal", en: "Nepal", pt: "Nepal" },
  NZ: { es: "Nueva Zelanda", en: "New Zealand", pt: "Nova Zelândia" },
  OM: { es: "Omán", en: "Oman", pt: "Omã" },
  PA: { es: "Panamá", en: "Panama", pt: "Panamá" },
  PE: { es: "Perú", en: "Peru", pt: "Peru" },
  PG: { es: "Papúa Nueva Guinea", en: "Papua New Guinea", pt: "Papua-Nova Guiné" },
  PH: { es: "Filipinas", en: "Philippines", pt: "Filipinas" },
  PK: { es: "Pakistán", en: "Pakistan", pt: "Paquistão" },
  PL: { es: "Polonia", en: "Poland", pt: "Polônia" },
  PR: { es: "Puerto Rico", en: "Puerto Rico", pt: "Porto Rico" },
  PT: { es: "Portugal", en: "Portugal", pt: "Portugal" },
  PY: { es: "Paraguay", en: "Paraguay", pt: "Paraguai" },
  QA: { es: "Catar", en: "Qatar", pt: "Catar" },
  RO: { es: "Rumanía", en: "Romania", pt: "Romênia" },
  RS: { es: "Serbia", en: "Serbia", pt: "Sérvia" },
  RU: { es: "Rusia", en: "Russia", pt: "Rússia" },
  SA: { es: "Arabia Saudita", en: "Saudi Arabia", pt: "Arábia Saudita" },
  SE: { es: "Suecia", en: "Sweden", pt: "Suécia" },
  SG: { es: "Singapur", en: "Singapore", pt: "Singapura" },
  SI: { es: "Eslovenia", en: "Slovenia", pt: "Eslovênia" },
  SK: { es: "Eslovaquia", en: "Slovakia", pt: "Eslováquia" },
  SV: { es: "El Salvador", en: "El Salvador", pt: "El Salvador" },
  TH: { es: "Tailandia", en: "Thailand", pt: "Tailândia" },
  TN: { es: "Túnez", en: "Tunisia", pt: "Tunísia" },
  TR: { es: "Turquía", en: "Turkey", pt: "Turquia" },
  TW: { es: "Taiwán", en: "Taiwan", pt: "Taiwan" },
  UA: { es: "Ucrania", en: "Ukraine", pt: "Ucrânia" },
  US: { es: "Estados Unidos", en: "United States", pt: "Estados Unidos" },
  UY: { es: "Uruguay", en: "Uruguay", pt: "Uruguai" },
  UZ: { es: "Uzbekistán", en: "Uzbekistan", pt: "Uzbequistão" },
  VE: { es: "Venezuela", en: "Venezuela", pt: "Venezuela" },
  VN: { es: "Vietnam", en: "Vietnam", pt: "Vietnã" },
  YE: { es: "Yemen", en: "Yemen", pt: "Iêmen" },
  ZA: { es: "Sudáfrica", en: "South Africa", pt: "África do Sul" },
};

const REGIONS = {
  Europe: { es: "Europa", en: "Europe", pt: "Europa" },
  America: { es: "América", en: "America", pt: "América" },
  Asia: { es: "Asia", en: "Asia", pt: "Ásia" },
  Africa: { es: "África", en: "Africa", pt: "África" },
  Australia: { es: "Australia", en: "Australia", pt: "Austrália" },
  Pacific: { es: "Pacífico", en: "Pacific", pt: "Pacífico" },
  Atlantic: { es: "Atlántico", en: "Atlantic", pt: "Atlântico" },
  Indian: { es: "Índico", en: "Indian", pt: "Índico" },
  Etc: { es: "UTC", en: "UTC", pt: "UTC" },
  Antarctica: { es: "Antártida", en: "Antarctica", pt: "Antártida" },
};

export function getCountryName(code, lang) {
  return code ? COUNTRIES[code]?.[lang] || "" : "";
}

export function getRegionName(region, lang) {
  return region ? REGIONS[region]?.[lang] || region : "";
}

const TZ_COUNTRY = {
  "Africa/Cairo": "EG", "Africa/Casablanca": "MA", "Africa/Johannesburg": "ZA", "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE", "Africa/Tunis": "TN", "Africa/Algiers": "DZ",
  "America/Argentina/Buenos_Aires": "AR", "America/Argentina/Cordoba": "AR", "America/Argentina/Salta": "AR",
  "America/Argentina/San_Juan": "AR", "America/Argentina/Tucuman": "AR", "America/Argentina/Ushuaia": "AR",
  "America/Bogota": "CO", "America/Caracas": "VE", "America/Chicago": "US", "America/Costa_Rica": "CR",
  "America/Cuba": "CU", "America/Denver": "US", "America/Detroit": "US", "America/El_Salvador": "SV",
  "America/Godthab": "GL", "America/Guatemala": "GT", "America/Guayaquil": "EC", "America/Havana": "CU",
  "America/Honolulu": "US", "America/La_Paz": "BO", "America/Lima": "PE", "America/Los_Angeles": "US",
  "America/Managua": "NI", "America/Mexico_City": "MX", "America/Monterrey": "MX", "America/Montevideo": "UY",
  "America/New_York": "US", "America/Panama": "PA", "America/Phoenix": "US", "America/Puerto_Rico": "PR",
  "America/Santiago": "CL", "America/Santo_Domingo": "DO", "America/Sao_Paulo": "BR", "America/Toronto": "CA",
  "America/Vancouver": "CA", "America/Winnipeg": "CA", "America/Anchorage": "US", "America/Jamaica": "JM",
  "Asia/Almaty": "KZ", "Asia/Amman": "JO", "Asia/Baghdad": "IQ", "Asia/Bahrain": "BH",
  "Asia/Bangkok": "TH", "Asia/Beirut": "LB", "Asia/Chongqing": "CN", "Asia/Dhaka": "BD", "Asia/Dubai": "AE",
  "Asia/Ho_Chi_Minh": "VN", "Asia/Hong_Kong": "CN", "Asia/Irkutsk": "RU", "Asia/Jakarta": "ID",
  "Asia/Jayapura": "ID", "Asia/Jerusalem": "IL", "Asia/Kabul": "AF", "Asia/Karachi": "PK",
  "Asia/Kathmandu": "NP", "Asia/Kolkata": "IN", "Asia/Kuala_Lumpur": "MY", "Asia/Kuwait": "KW",
  "Asia/Makassar": "ID", "Asia/Manila": "PH", "Asia/Muscat": "OM", "Asia/Nicosia": "CY", "Asia/Qatar": "QA",
  "Asia/Riyadh": "SA", "Asia/Seoul": "KR", "Asia/Shanghai": "CN", "Asia/Singapore": "SG", "Asia/Taipei": "TW",
  "Asia/Tashkent": "UZ", "Asia/Tehran": "IR", "Asia/Tokyo": "JP", "Asia/Ulaanbaatar": "MN",
  "Asia/Vientiane": "LA", "Asia/Yangon": "MM", "Asia/Yerevan": "AM", "Asia/Famagusta": "CY",
  "Atlantic/Reykjavik": "IS", "Atlantic/Azores": "PT",
  "Australia/Adelaide": "AU", "Australia/Brisbane": "AU", "Australia/Canberra": "AU",
  "Australia/Darwin": "AU", "Australia/Hobart": "AU", "Australia/Melbourne": "AU", "Australia/Perth": "AU",
  "Australia/Sydney": "AU",
  "Europe/Amsterdam": "NL", "Europe/Andorra": "AD", "Europe/Athens": "GR", "Europe/Belgrade": "RS",
  "Europe/Berlin": "DE", "Europe/Bratislava": "SK", "Europe/Brussels": "BE", "Europe/Bucharest": "RO",
  "Europe/Budapest": "HU", "Europe/Chisinau": "MD", "Europe/Copenhagen": "DK", "Europe/Dublin": "IE",
  "Europe/Helsinki": "FI", "Europe/Istanbul": "TR", "Europe/Kiev": "UA", "Europe/Kyiv": "UA",
  "Europe/Lisbon": "PT", "Europe/Ljubljana": "SI", "Europe/London": "GB", "Europe/Luxembourg": "LU",
  "Europe/Madrid": "ES", "Europe/Minsk": "BY", "Europe/Monaco": "MC", "Europe/Moscow": "RU",
  "Europe/Nicosia": "CY", "Europe/Oslo": "NO", "Europe/Paris": "FR", "Europe/Prague": "CZ",
  "Europe/Riga": "LV", "Europe/Rome": "IT", "Europe/Samara": "RU", "Europe/Skopje": "MK",
  "Europe/Sofia": "BG", "Europe/Stockholm": "SE", "Europe/Tallinn": "EE", "Europe/Tirane": "AL",
  "Europe/Uzhgorod": "UA", "Europe/Vienna": "AT", "Europe/Vilnius": "LT", "Europe/Warsaw": "PL",
  "Europe/Zagreb": "HR", "Europe/Zaporozhye": "UA", "Europe/Zurich": "CH",
  "Pacific/Auckland": "NZ", "Pacific/Fiji": "FJ", "Pacific/Port_Moresby": "PG",
};

export const CURATED_CITIES = [
  { city: "Madrid", country: "ES", timezone: "Europe/Madrid" },
  { city: "Barcelona", country: "ES", timezone: "Europe/Madrid" },
  { city: "Lisboa", country: "PT", timezone: "Europe/Lisbon" },
  { city: "Londres", country: "GB", timezone: "Europe/London" },
  { city: "Dublín", country: "IE", timezone: "Europe/Dublin" },
  { city: "París", country: "FR", timezone: "Europe/Paris" },
  { city: "Ámsterdam", country: "NL", timezone: "Europe/Amsterdam" },
  { city: "Berlín", country: "DE", timezone: "Europe/Berlin" },
  { city: "Roma", country: "IT", timezone: "Europe/Rome" },
  { city: "Viena", country: "AT", timezone: "Europe/Vienna" },
  { city: "Zúrich", country: "CH", timezone: "Europe/Zurich" },
  { city: "Estocolmo", country: "SE", timezone: "Europe/Stockholm" },
  { city: "Atenas", country: "GR", timezone: "Europe/Athens" },
  { city: "Estambul", country: "TR", timezone: "Europe/Istanbul" },
  { city: "Moscú", country: "RU", timezone: "Europe/Moscow" },
  { city: "Reikiavik", country: "IS", timezone: "Atlantic/Reykjavik" },
  { city: "Ciudad de México", country: "MX", timezone: "America/Mexico_City" },
  { city: "Nueva York", country: "US", timezone: "America/New_York" },
  { city: "Miami", country: "US", timezone: "America/New_York" },
  { city: "Chicago", country: "US", timezone: "America/Chicago" },
  { city: "Denver", country: "US", timezone: "America/Denver" },
  { city: "Seattle", country: "US", timezone: "America/Los_Angeles" },
  { city: "Los Ángeles", country: "US", timezone: "America/Los_Angeles" },
  { city: "Houston", country: "US", timezone: "America/Chicago" },
  { city: "Anchorage", country: "US", timezone: "America/Anchorage" },
  { city: "Toronto", country: "CA", timezone: "America/Toronto" },
  { city: "Vancouver", country: "CA", timezone: "America/Vancouver" },
  { city: "Bogotá", country: "CO", timezone: "America/Bogota" },
  { city: "Lima", country: "PE", timezone: "America/Lima" },
  { city: "Santiago", country: "CL", timezone: "America/Santiago" },
  { city: "Buenos Aires", country: "AR", timezone: "America/Argentina/Buenos_Aires" },
  { city: "São Paulo", country: "BR", timezone: "America/Sao_Paulo" },
  { city: "Honolulu", country: "US", timezone: "Pacific/Honolulu" },
  { city: "El Cairo", country: "EG", timezone: "Africa/Cairo" },
  { city: "Lagos", country: "NG", timezone: "Africa/Lagos" },
  { city: "Nairobi", country: "KE", timezone: "Africa/Nairobi" },
  { city: "Johannesburgo", country: "ZA", timezone: "Africa/Johannesburg" },
  { city: "Dubái", country: "AE", timezone: "Asia/Dubai" },
  { city: "Bombay", country: "IN", timezone: "Asia/Kolkata" },
  { city: "Delhi", country: "IN", timezone: "Asia/Kolkata" },
  { city: "Kabul", country: "AF", timezone: "Asia/Kabul" },
  { city: "Bangkok", country: "TH", timezone: "Asia/Bangkok" },
  { city: "Singapur", country: "SG", timezone: "Asia/Singapore" },
  { city: "Hong Kong", country: "CN", timezone: "Asia/Hong_Kong" },
  { city: "Pekín", country: "CN", timezone: "Asia/Shanghai" },
  { city: "Seúl", country: "KR", timezone: "Asia/Seoul" },
  { city: "Tokio", country: "JP", timezone: "Asia/Tokyo" },
  { city: "Sídney", country: "AU", timezone: "Australia/Sydney" },
  { city: "Melbourne", country: "AU", timezone: "Australia/Melbourne" },
  { city: "Auckland", country: "NZ", timezone: "Pacific/Auckland" },
];

let cachedAll = null;

function fold(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function countryText(code) {
  const cc = COUNTRIES[code];
  return cc ? `${cc.es} ${cc.en} ${cc.pt}` : "";
}

function regionText(region) {
  const r = REGIONS[region];
  return r ? `${r.es} ${r.en} ${r.pt}` : region;
}

export function allTimezones() {
  if (cachedAll) return cachedAll;
  cachedAll = Intl.supportedValuesOf("timeZone").map((tz) => {
    const parts = tz.split("/");
    const region = parts.length > 1 ? parts[0].replace(/_/g, " ") : "Etc";
    return {
      city: friendlyCity(tz),
      region,
      timezone: tz,
      label: tz.replace(/_/g, " "),
      country: TZ_COUNTRY[tz] || "",
    };
  });
  return cachedAll;
}

export function searchLocations(query) {
  const q = fold(String(query || "").trim());
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
    fold(`${c.city} ${c.timezone} ${countryText(c.country)}`).includes(q)
  ).forEach(push);
  allTimezones()
    .filter((z) =>
      fold(`${z.city} ${z.label} ${countryText(z.country)} ${regionText(z.region)}`).includes(q)
    )
    .forEach(push);
  return out.slice(0, 40);
}
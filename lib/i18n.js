export const APP_NAME = "WorkClock Orange";
export const DEFAULT_LANG = "en";
export const LANGS = ["en", "es", "pt"];

const MESSAGES = {
  en: {
    docTitle: "WorkClock Orange",
    yourZone: "Your zone",
    location: "Location",
    primaryLocation: "Primary location",
    locations: "Locations",
    add: "Add",
    addFirst: "Add first location",
    addLocation: "Add a location",
    searchPlaceholder: "Search city, country or time zone…",
    noResults: "No results",
    clear: "Clear",
    emptyTitle: "No locations yet",
    emptyText: "Add cities to compare times and working hours instantly.",
    inHours: "Within working hours",
    outHours: "Outside working hours",
    sameTime: "Same time",
    ahead: "Ahead of you",
    behind: "Behind you",
    setPrimary: "Set as primary",
    remove: "Remove",
    changeTheme: "Change theme",
    settings: "Settings",
    optionsTitle: "WorkClock Orange settings",
    optionsSub: "Theme, language, working hours and your locations.",
    theme: "Theme",
    themeDesc: "Choose an accent color and light or dark mode.",
    accentColor: "Accent color",
    mode: "Mode",
    auto: "Auto",
    light: "Light",
    dark: "Dark",
    language: "Language",
    languageDesc: "Interface language for the whole extension.",
    yourWorkHours: "Your working hours",
    yourWorkHoursDesc: "Used to indicate whether your zone is within working hours (weekdays only).",
    start: "Start",
    end: "End",
    locationsSettings: "Locations",
    locationsDesc: "Each location has its own working hours. The starred one appears on the extension icon.",
    noLocationsYet: "No locations yet. Add one above to get started.",
    weekdaysOnly: "Weekdays only",
  },
  es: {
    docTitle: "WorkClock Orange",
    yourZone: "Tu zona",
    location: "Ubicación",
    primaryLocation: "Ubicación principal",
    locations: "Ubicaciones",
    add: "Añadir",
    addFirst: "Añadir primera ubicación",
    addLocation: "Añade una ubicación",
    searchPlaceholder: "Buscar ciudad, país o zona horaria…",
    noResults: "Sin resultados",
    clear: "Limpiar",
    emptyTitle: "Sin ubicaciones todavía",
    emptyText: "Añade ciudades para comparar horas y horario laboral al instante.",
    inHours: "En horario",
    outHours: "Fuera de horario",
    sameTime: "Mismo horario",
    ahead: "Por delante de ti",
    behind: "Por detrás de ti",
    setPrimary: "Marcar como principal",
    remove: "Eliminar",
    changeTheme: "Cambiar tema",
    settings: "Ajustes",
    optionsTitle: "Ajustes de WorkClock Orange",
    optionsSub: "Tema, idioma, horario laboral y tus ubicaciones.",
    theme: "Tema",
    themeDesc: "Elige un color de acento y el modo claro u oscuro.",
    accentColor: "Color de acento",
    mode: "Modo",
    auto: "Automático",
    light: "Claro",
    dark: "Oscuro",
    language: "Idioma",
    languageDesc: "Idioma de la interfaz para toda la extensión.",
    yourWorkHours: "Tu horario laboral",
    yourWorkHoursDesc: "Se usa para indicar si tu zona está dentro de horario laboral (de lunes a viernes).",
    start: "Inicio",
    end: "Fin",
    locationsSettings: "Ubicaciones",
    locationsDesc: "Cada ubicación tiene su propio horario laboral. La que marques con estrella aparece en el icono de la extensión.",
    noLocationsYet: "Aún no hay ubicaciones. Añade una arriba para empezar.",
    weekdaysOnly: "Solo lunes a viernes",
  },
  pt: {
    docTitle: "WorkClock Orange",
    yourZone: "Sua zona",
    location: "Localização",
    primaryLocation: "Localização principal",
    locations: "Localizações",
    add: "Adicionar",
    addFirst: "Adicionar primeira localização",
    addLocation: "Adicione uma localização",
    searchPlaceholder: "Buscar cidade, país ou fuso horário…",
    noResults: "Sem resultados",
    clear: "Limpar",
    emptyTitle: "Ainda sem localizações",
    emptyText: "Adicione cidades para comparar horários e horário comercial instantaneamente.",
    inHours: "Em horário",
    outHours: "Fora do horário",
    sameTime: "Mesmo horário",
    ahead: "À frente de você",
    behind: "Atrás de você",
    setPrimary: "Definir como principal",
    remove: "Remover",
    changeTheme: "Alterar tema",
    settings: "Configurações",
    optionsTitle: "Configurações do WorkClock Orange",
    optionsSub: "Tema, idioma, horário comercial e suas localizações.",
    theme: "Tema",
    themeDesc: "Escolha uma cor de destaque e o modo claro ou escuro.",
    accentColor: "Cor de destaque",
    mode: "Modo",
    auto: "Automático",
    light: "Claro",
    dark: "Escuro",
    language: "Idioma",
    languageDesc: "Idioma da interface para toda a extensão.",
    yourWorkHours: "Seu horário comercial",
    yourWorkHoursDesc: "Usado para indicar se a sua zona está dentro do horário comercial (somente dias úteis).",
    start: "Início",
    end: "Fim",
    locationsSettings: "Localizações",
    locationsDesc: "Cada localização tem seu próprio horário comercial. A marcada com estrela aparece no ícone da extensão.",
    noLocationsYet: "Ainda não há localizações. Adicione uma acima para começar.",
    weekdaysOnly: "Somente dias úteis",
  },
};

let current = DEFAULT_LANG;

export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

export function getLang() {
  return current;
}

export function locale() {
  return { en: "en-GB", es: "es-ES", pt: "pt-PT" }[current];
}

export function t(key) {
  return MESSAGES[current]?.[key] ?? MESSAGES[DEFAULT_LANG][key] ?? key;
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  document.documentElement.lang = current;
  document.title = t("docTitle");
}
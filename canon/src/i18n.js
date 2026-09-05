import { MESSAGES } from "./i18n-messages.js";

export { MESSAGES };

export const LOCALE_KEY = "canon.ui.locale";

export const LANGUAGES = [
  { id: "en", native: "English", dir: "ltr", date: "en-GB" },
  { id: "zh", native: "中文", dir: "ltr", date: "zh-CN" },
  { id: "hi", native: "हिन्दी", dir: "ltr", date: "hi-IN" },
  { id: "es", native: "Español", dir: "ltr", date: "es" },
  { id: "fr", native: "Français", dir: "ltr", date: "fr" },
  { id: "ar", native: "العربية", dir: "rtl", date: "ar" },
  { id: "bn", native: "বাংলা", dir: "ltr", date: "bn-BD" },
  { id: "pt", native: "Português", dir: "ltr", date: "pt-BR" },
];

export const LANGUAGE_IDS = LANGUAGES.map((item) => item.id);

export function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    params[key] == null ? `{${key}}` : String(params[key])
  );
}

export function dateTag(locale) {
  return LANGUAGES.find((item) => item.id === locale)?.date || "en-GB";
}

export function languageMeta(locale) {
  return LANGUAGES.find((item) => item.id === locale) || LANGUAGES[0];
}

export function detectLocale(stored, navigatorLanguage = "") {
  if (stored && LANGUAGE_IDS.includes(stored)) return stored;
  const nav = String(navigatorLanguage || "").toLowerCase();
  const short = nav.slice(0, 2);
  if (short === "zh") return "zh";
  if (LANGUAGE_IDS.includes(short)) return short;
  return "en";
}

export function loadLocale(storage, navigatorLanguage) {
  try {
    const store = storage || globalThis.localStorage;
    const stored = store?.getItem?.(LOCALE_KEY);
    const nav =
      navigatorLanguage ||
      (typeof navigator !== "undefined" ? navigator.language : "");
    return detectLocale(stored, nav);
  } catch {
    return "en";
  }
}

export function saveLocale(locale, storage) {
  const store = storage || globalThis.localStorage;
  if (LANGUAGE_IDS.includes(locale)) store?.setItem?.(LOCALE_KEY, locale);
}

export function t(locale, key, params) {
  const table = MESSAGES[locale] || MESSAGES.en;
  const template = table[key] || MESSAGES.en[key] || key;
  return interpolate(template, params);
}

export function formatStatus(locale, status) {
  if (!status) return "";
  if (typeof status === "string") return status;
  return t(locale, status.key, status.params);
}

export function applyDocumentLocale(locale, doc = globalThis.document) {
  if (!doc?.documentElement) return;
  const meta = languageMeta(locale);
  doc.documentElement.lang = locale;
  doc.documentElement.dir = meta.dir;
  if (doc.title !== undefined) doc.title = t(locale, "docTitle");
}

export function displayEra(era, translate) {
  if (era === "Unknown era") return translate("unknownEra");
  if (era === "Before 1600") return translate("before1600");
  return era;
}

export function moodChipKey(chip) {
  return `mood.${String(chip || "").toLowerCase()}`;
}

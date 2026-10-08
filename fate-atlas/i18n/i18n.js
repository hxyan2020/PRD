/**
 * Fatum Atlas i18n — locale switcher + string lookup.
 * Country names use Intl.DisplayNames via FatumCountries.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "fatum-atlas-locale-v1";

  const LOCALES = [
    { id: "en", label: "English", native: "English", flag: "🇬🇧", dir: "ltr" },
    { id: "zh-Hans", label: "Chinese (Simplified)", native: "简体中文", flag: "🇨🇳", dir: "ltr" },
    { id: "zh-Hant", label: "Chinese (Traditional)", native: "繁體中文", flag: "🇹🇼", dir: "ltr" },
    { id: "es", label: "Spanish", native: "Español", flag: "🇪🇸", dir: "ltr" },
    { id: "fr", label: "French", native: "Français", flag: "🇫🇷", dir: "ltr" },
    { id: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦", dir: "rtl" },
    { id: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
    { id: "pt", label: "Portuguese", native: "Português", flag: "🇵🇹", dir: "ltr" },
    { id: "ru", label: "Russian", native: "Русский", flag: "🇷🇺", dir: "ltr" },
    { id: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵", dir: "ltr" },
    { id: "de", label: "German", native: "Deutsch", flag: "🇩🇪", dir: "ltr" },
    { id: "ko", label: "Korean", native: "한국어", flag: "🇰🇷", dir: "ltr" },
    { id: "it", label: "Italian", native: "Italiano", flag: "🇮🇹", dir: "ltr" },
    { id: "tr", label: "Turkish", native: "Türkçe", flag: "🇹🇷", dir: "ltr" },
    { id: "id", label: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩", dir: "ltr" },
    { id: "vi", label: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳", dir: "ltr" },
  ];

  let locale = "en";
  const listeners = new Set();

  function detect() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LOCALES.some((l) => l.id === saved)) return saved;
    } catch (_) {}
    const nav = (navigator.languages || [navigator.language || "en"]).map(String);
    for (const raw of nav) {
      const tag = raw.replace("_", "-");
      if (LOCALES.some((l) => l.id === tag)) return tag;
      const base = tag.split("-")[0];
      if (base === "zh") {
        if (/Hant|TW|HK|MO/i.test(tag)) return "zh-Hant";
        return "zh-Hans";
      }
      const hit = LOCALES.find((l) => l.id === base || l.id.startsWith(base + "-"));
      if (hit) return hit.id;
    }
    return "en";
  }

  function meta(id) {
    return LOCALES.find((l) => l.id === id) || LOCALES[0];
  }

  function t(key, vars) {
    const pack = (window.FATE_I18N_STRINGS || {})[locale] || {};
    const fallback = (window.FATE_I18N_STRINGS || {}).en || {};
    let str = pack[key] ?? fallback[key] ?? key;
    if (vars && typeof str === "string") {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return str;
  }

  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const val = t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.hasAttribute("data-i18n-placeholder")) el.placeholder = val;
        else el.value = val;
      } else if (el.hasAttribute("data-i18n-html")) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) el.placeholder = t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (key) el.title = t(key);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (key) el.setAttribute("aria-label", t(key));
    });
    document.querySelectorAll("[data-i18n-closed]").forEach((el) => {
      const key = el.getAttribute("data-i18n-closed");
      if (key) el.setAttribute("data-closed", t(key));
    });
    document.querySelectorAll("[data-i18n-open]").forEach((el) => {
      const key = el.getAttribute("data-i18n-open");
      if (key) el.setAttribute("data-open", t(key));
    });
  }

  function setLocale(next) {
    if (!LOCALES.some((l) => l.id === next)) next = "en";
    locale = next;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch (_) {}
    const m = meta(locale);
    document.documentElement.lang = locale === "zh-Hans" ? "zh-CN" : locale === "zh-Hant" ? "zh-TW" : locale;
    document.documentElement.dir = m.dir;
    document.title = t("meta.title");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.description"));
    applyStatic();
    const sel = document.getElementById("lang-select");
    if (sel && sel.value !== locale) sel.value = locale;
    listeners.forEach((fn) => {
      try {
        fn(locale);
      } catch (_) {}
    });
    document.dispatchEvent(new CustomEvent("fatum:locale-changed", { detail: { locale } }));
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function localeLabel(l) {
    return `${l.flag || ""} ${l.native}`.trim();
  }

  function fillLangSelect(select) {
    if (!select) return;
    select.innerHTML = LOCALES.map(
      (l) => `<option value="${l.id}">${localeLabel(l)}</option>`
    ).join("");
    select.value = locale;
    select.addEventListener("change", () => setLocale(select.value));
  }

  function init() {
    locale = detect();
    fillLangSelect(document.getElementById("lang-select"));
    setLocale(locale);
  }

  window.FatumI18n = {
    LOCALES,
    t,
    getLocale: () => locale,
    setLocale,
    onChange,
    meta,
    applyStatic,
    init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

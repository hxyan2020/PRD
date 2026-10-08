/**
 * Fatum Atlas i18n — locale switcher + string lookup.
 * Country names use Intl.DisplayNames via FatumCountries.
 * Language picker uses flagcdn images (not emoji — those become "US"/"CA" on many OSes).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "fatum-atlas-locale-v1";

  const LOCALES = [
    { id: "en", label: "English", native: "English", flag: "gb", dir: "ltr" },
    { id: "zh-Hans", label: "Chinese (Simplified)", native: "简体中文", flag: "cn", dir: "ltr" },
    { id: "zh-Hant", label: "Chinese (Traditional)", native: "繁體中文", flag: "tw", dir: "ltr" },
    { id: "es", label: "Spanish", native: "Español", flag: "es", dir: "ltr" },
    { id: "fr", label: "French", native: "Français", flag: "fr", dir: "ltr" },
    { id: "ar", label: "Arabic", native: "العربية", flag: "sa", dir: "rtl" },
    { id: "hi", label: "Hindi", native: "हिन्दी", flag: "in", dir: "ltr" },
    { id: "pt", label: "Portuguese", native: "Português", flag: "pt", dir: "ltr" },
    { id: "ru", label: "Russian", native: "Русский", flag: "ru", dir: "ltr" },
    { id: "ja", label: "Japanese", native: "日本語", flag: "jp", dir: "ltr" },
    { id: "de", label: "German", native: "Deutsch", flag: "de", dir: "ltr" },
    { id: "ko", label: "Korean", native: "한국어", flag: "kr", dir: "ltr" },
    { id: "it", label: "Italian", native: "Italiano", flag: "it", dir: "ltr" },
    { id: "tr", label: "Turkish", native: "Türkçe", flag: "tr", dir: "ltr" },
    { id: "id", label: "Indonesian", native: "Bahasa Indonesia", flag: "id", dir: "ltr" },
    { id: "vi", label: "Vietnamese", native: "Tiếng Việt", flag: "vn", dir: "ltr" },
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

  function flagImg(code, cls) {
    const cc = String(code || "un").toLowerCase();
    return `<img class="${cls || "lang-picker__flag"}" src="https://flagcdn.com/24x18/${cc}.png" srcset="https://flagcdn.com/48x36/${cc}.png 2x" width="24" height="18" alt="" loading="lazy" decoding="async" />`;
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

  function syncLangPickerUI() {
    const m = meta(locale);
    const btn = document.getElementById("lang-picker-btn");
    const flagEl = document.getElementById("lang-picker-flag");
    const labelEl = document.getElementById("lang-picker-label");
    const menu = document.getElementById("lang-picker-menu");
    if (flagEl) {
      flagEl.src = `https://flagcdn.com/24x18/${m.flag}.png`;
      flagEl.srcset = `https://flagcdn.com/48x36/${m.flag}.png 2x`;
    }
    if (labelEl) labelEl.textContent = m.native;
    if (btn) btn.setAttribute("aria-label", `${t("hud.lang")}: ${m.native}`);
    if (menu) {
      menu.querySelectorAll("[data-locale]").forEach((opt) => {
        const on = opt.getAttribute("data-locale") === locale;
        opt.classList.toggle("is-active", on);
        if (on) opt.setAttribute("aria-selected", "true");
        else opt.removeAttribute("aria-selected");
      });
    }
    const sel = document.getElementById("lang-select");
    if (sel && sel.value !== locale) sel.value = locale;
  }

  function closeLangMenu() {
    const root = document.getElementById("lang-picker");
    const btn = document.getElementById("lang-picker-btn");
    const menu = document.getElementById("lang-picker-menu");
    if (root) root.classList.remove("is-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (menu) menu.hidden = true;
  }

  function openLangMenu() {
    const root = document.getElementById("lang-picker");
    const btn = document.getElementById("lang-picker-btn");
    const menu = document.getElementById("lang-picker-menu");
    if (root) root.classList.add("is-open");
    if (btn) btn.setAttribute("aria-expanded", "true");
    if (menu) menu.hidden = false;
  }

  function fillLangSelect(select) {
    if (!select) return;
    select.innerHTML = LOCALES.map(
      (l) => `<option value="${l.id}">${l.native}</option>`
    ).join("");
    select.value = locale;
    if (!select.dataset.bound) {
      select.dataset.bound = "1";
      select.addEventListener("change", () => setLocale(select.value));
    }

    const menu = document.getElementById("lang-picker-menu");
    const btn = document.getElementById("lang-picker-btn");
    if (menu && !menu.dataset.bound) {
      menu.dataset.bound = "1";
      menu.innerHTML = LOCALES.map(
        (l) => `<li role="option" tabindex="-1" data-locale="${l.id}" class="lang-picker__option">
          ${flagImg(l.flag)}
          <span>${l.native}</span>
        </li>`
      ).join("");
      menu.addEventListener("click", (e) => {
        const opt = e.target.closest("[data-locale]");
        if (!opt) return;
        setLocale(opt.getAttribute("data-locale"));
        closeLangMenu();
      });
    }
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const root = document.getElementById("lang-picker");
        if (root && root.classList.contains("is-open")) closeLangMenu();
        else openLangMenu();
      });
      document.addEventListener("click", (e) => {
        const root = document.getElementById("lang-picker");
        if (!root || !root.classList.contains("is-open")) return;
        if (!root.contains(e.target)) closeLangMenu();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLangMenu();
      });
    }
    syncLangPickerUI();
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
    syncLangPickerUI();
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

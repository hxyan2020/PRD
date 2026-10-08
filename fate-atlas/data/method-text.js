/**
 * Locale-aware method text. Strips foreign-script leaks and prefers i18n packs.
 */
(function () {
  "use strict";

  const CJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;
  const ARABIC = /[\u0600-\u06FF]/;
  const DEVANAGARI = /[\u0900-\u097F]/;
  const CYRILLIC = /[\u0400-\u04FF]/;
  const HANGUL = /[\uAC00-\uD7AF]/;

  function locale() {
    return window.FatumI18n ? window.FatumI18n.getLocale() : "en";
  }

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function has(key) {
    if (!window.FatumI18n || !window.FATE_I18N_STRINGS) return false;
    const loc = locale();
    const pack = window.FATE_I18N_STRINGS[loc] || {};
    const en = window.FATE_I18N_STRINGS.en || {};
    const val = pack[key] ?? en[key];
    return typeof val === "string" && val !== key;
  }

  function isZh(loc) {
    return String(loc || "").startsWith("zh");
  }

  /** Split "中文 / English" style titles for the active locale. */
  function pickBilingual(text, loc) {
    if (!text) return "";
    const raw = String(text);
    const parts = raw.split(/\s*\/\s*/);
    if (parts.length >= 2) {
      const left = parts[0].trim();
      const right = parts.slice(1).join(" / ").trim();
      if (CJK.test(left) && right && !CJK.test(right)) {
        return isZh(loc) ? left : right;
      }
      if (!CJK.test(left) && CJK.test(right)) {
        return isZh(loc) ? right : left;
      }
    }
    // "中文 · English" or "English · 中文"
    const dotParts = raw.split(/\s*[·•]\s*/);
    if (dotParts.length === 2) {
      const [a, b] = dotParts.map((p) => p.trim());
      if (CJK.test(a) !== CJK.test(b)) {
        if (isZh(loc)) return CJK.test(a) ? a : b;
        return CJK.test(a) ? b : a;
      }
    }
    return raw;
  }

  /** Drop scripts that do not belong to the active locale. */
  function scrubForeignScripts(text, loc) {
    if (!text) return "";
    let out = String(text);
    const zh = isZh(loc);
    if (!zh && CJK.test(out)) {
      // Remove CJK runs and tidy separators left behind
      out = out
        .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]+/g, "")
        .replace(/\s*[·•|/]\s*[·•|/]\s*/g, " · ")
        .replace(/^\s*[·•|/]\s*|\s*[·•|/]\s*$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
    if (zh) {
      // Prefer Chinese; keep Latin proper nouns but drop if leftover bilingual junk already handled
    }
    if (loc !== "ar" && ARABIC.test(out) && !/If[aá]|Qur'?an|Allah/i.test(out)) {
      // keep Arabic method names that are proper nouns — do not strip indiscriminately
    }
    if (!loc.startsWith("ru") && false) {
      out = out.replace(CYRILLIC, "");
    }
    return out.trim();
  }

  function field(method, fieldName) {
    if (!method) return "";
    const loc = locale();
    const id = method.id || method.guided || "";
    const key = `method.${id}.${fieldName}`;
    if (id && has(key)) return t(key);

    // Featured guided aliases
    if (method.guided) {
      const gKey = `method.${method.guided}.${fieldName}`;
      if (has(gKey)) return t(gKey);
    }

    let value = method[fieldName] || "";
    if (fieldName === "name" && method.nameEn && !isZh(loc) && CJK.test(value)) {
      value = method.nameEn;
    }
    if (fieldName === "summary" && method.summaryEn && !isZh(loc) && CJK.test(value)) {
      value = method.summaryEn;
    }
    if (fieldName === "name" && method.nameZh && isZh(loc)) {
      value = loc === "zh-Hant" && method.nameZhHant ? method.nameZhHant : method.nameZh;
    }
    if (fieldName === "summary" && method.summaryZh && isZh(loc)) {
      value = loc === "zh-Hant" && method.summaryZhHant ? method.summaryZhHant : method.summaryZh;
    }

    value = pickBilingual(value, loc);
    value = scrubForeignScripts(value, loc);
    return value || method[fieldName] || "";
  }

  function localize(method) {
    return {
      name: field(method, "name"),
      summary: field(method, "summary"),
      region: field(method, "region") || method.region || "",
      source: scrubForeignScripts(pickBilingual(method.source || "", locale()), locale()) || method.source || "",
    };
  }

  function processLabel(method) {
    if (!method) return "";
    if (method.guided === "bagua" || method.id === "bagua" || method.id === "iching") {
      return t("process.guided.bagua");
    }
    if (method.guided === "tarot" || method.id === "tarot") {
      return t("process.guided.tarot");
    }
    if (method.guided === "mbti" || method.id === "mbti") {
      return t("process.guided.mbti");
    }
    try {
      if (window.fatePhotoSubjectFor) {
        const photo = window.fatePhotoSubjectFor(method);
        if (photo) return photo.required ? t("process.photoRequired") : t("process.photoOptional");
      }
      if (window.fateProcessForMethod) {
        const label = window.fateProcessForMethod(method).label || "";
        const key = `process.label.${label}`;
        if (has(key)) return t(key);
        return label;
      }
    } catch (_) {}
    return method.type || "";
  }

  window.FatumMethodText = {
    localize,
    field,
    processLabel,
    pickBilingual,
    scrubForeignScripts,
  };
})();

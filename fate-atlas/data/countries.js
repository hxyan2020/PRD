/**
 * Country catalog keys → ISO 3166-1 alpha-2 for flags & Intl.DisplayNames.
 * Ancient regions map to successor-state flags + an emblem glyph.
 * Flag images: self-hosted PNGs under assets/flags/ (emoji fallback only).
 */
(function () {
  "use strict";

  function flagAssetBase() {
    try {
      const scripts = document.getElementsByTagName("script");
      for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i].src || "";
        if (/\/data\/countries\.js(\?|$)/.test(src)) {
          return src.replace(/data\/countries\.js(\?.*)?$/, "assets/flags/");
        }
      }
    } catch (_) {}
    try {
      return new URL("assets/flags/", window.location.href).href;
    } catch (_) {
      return "assets/flags/";
    }
  }

  function flagUrls(code) {
    const cc = String(code || "").toLowerCase().replace(/[^a-z]/g, "");
    const base = flagAssetBase();
    return {
      src: `${base}${cc}.png`,
      srcset: `${base}${cc}-2x.png 2x`,
    };
  }

  const COUNTRY_ISO = {
    Algeria: "DZ",
    Argentina: "AR",
    Armenia: "AM",
    Australia: "AU",
    Austria: "AT",
    Bangladesh: "BD",
    Belarus: "BY",
    Belgium: "BE",
    Belize: "BZ",
    Benin: "BJ",
    Bhutan: "BT",
    Bolivia: "BO",
    Botswana: "BW",
    Brazil: "BR",
    Cambodia: "KH",
    Cameroon: "CM",
    Canada: "CA",
    "Central African Republic": "CF",
    Chile: "CL",
    China: "CN",
    "China (Tibet)": "CN",
    Colombia: "CO",
    Cuba: "CU",
    "Côte d'Ivoire": "CI",
    "DR Congo": "CD",
    Denmark: "DK",
    "Dominican Republic": "DO",
    Ecuador: "EC",
    Egypt: "EG",
    Estonia: "EE",
    Ethiopia: "ET",
    "Federated States of Micronesia": "FM",
    Fiji: "FJ",
    Finland: "FI",
    France: "FR",
    "French Polynesia": "PF",
    Germany: "DE",
    Ghana: "GH",
    Greece: "GR",
    Guatemala: "GT",
    Guinea: "GN",
    Honduras: "HN",
    "Hong Kong": "HK",
    Iceland: "IS",
    India: "IN",
    Indonesia: "ID",
    Iran: "IR",
    Iraq: "IQ",
    Ireland: "IE",
    Israel: "IL",
    Italy: "IT",
    Japan: "JP",
    Kazakhstan: "KZ",
    Kenya: "KE",
    Kiribati: "KI",
    Korea: "KR",
    Kyrgyzstan: "KG",
    Laos: "LA",
    Latvia: "LV",
    Lebanon: "LB",
    Lithuania: "LT",
    Madagascar: "MG",
    Malaysia: "MY",
    Mali: "ML",
    "Marshall Islands": "MH",
    Mexico: "MX",
    Mongolia: "MN",
    Morocco: "MA",
    Mozambique: "MZ",
    Myanmar: "MM",
    Nepal: "NP",
    "New Zealand": "NZ",
    Nigeria: "NG",
    "North Korea": "KP",
    Norway: "NO",
    Oman: "OM",
    Pakistan: "PK",
    "Papua New Guinea": "PG",
    Peru: "PE",
    Philippines: "PH",
    Poland: "PL",
    "Puerto Rico": "PR",
    Russia: "RU",
    Samoa: "WS",
    "Saudi Arabia": "SA",
    Senegal: "SN",
    Serbia: "RS",
    Singapore: "SG",
    Somalia: "SO",
    "South Africa": "ZA",
    "South Korea": "KR",
    "South Sudan": "SS",
    Spain: "ES",
    "Sri Lanka": "LK",
    Sudan: "SD",
    Sweden: "SE",
    Switzerland: "CH",
    Syria: "SY",
    Taiwan: "TW",
    Tanzania: "TZ",
    Thailand: "TH",
    Togo: "TG",
    Tunisia: "TN",
    Turkey: "TR",
    UAE: "AE",
    Ukraine: "UA",
    "United Kingdom": "GB",
    "United States": "US",
    Vietnam: "VN",
    Yemen: "YE",
    Zimbabwe: "ZW",
  };

  /** Ancient / historical place labels → successor flag + emblem */
  const ANCIENT_FLAGS = {
    "Ancient Egypt": { code: "EG", emblem: "𓂀", labelKey: "ancient.egypt" },
    "Ancient China": { code: "CN", emblem: "龍", labelKey: "ancient.china" },
    "Ancient Japan": { code: "JP", emblem: "⛩", labelKey: "ancient.japan" },
    "Ancient Mesopotamia": { code: "IQ", emblem: "𒀭", labelKey: "ancient.mesopotamia" },
    "Ancient Greece": { code: "GR", emblem: "ΑΩ", labelKey: "ancient.greece" },
    "Ancient Rome": { code: "IT", emblem: "🦅", labelKey: "ancient.rome" },
    "Ancient Rome / Greece": { code: "IT", emblem: "🦅", labelKey: "ancient.rome" },
    "Ancient Israel": { code: "IL", emblem: "✡", labelKey: "ancient.israel" },
    "Ancient Arabia / Scythia": { code: "SA", emblem: "☪", labelKey: "ancient.arabia" },
    "Shang Oracle": { code: "CN", emblem: "甲骨", labelKey: "ancient.china" },
    "Ancient Near East": { code: "IQ", emblem: "𒀭", labelKey: "ancient.mesopotamia" },
    "Aztec / Mexica": { code: "MX", emblem: "☀", labelKey: "ancient.aztec" },
    Maya: { code: "MX", emblem: "◈", labelKey: "ancient.maya" },
    Inca: { code: "PE", emblem: "⛰", labelKey: "ancient.inca" },
    "Celtic Europe": { code: "IE", emblem: "☘", labelKey: "ancient.celt" },
    "Norse / Viking": { code: "NO", emblem: "ᚠ", labelKey: "ancient.norse" },
    "Scythian": { code: "KZ", emblem: "🐎", labelKey: "ancient.scythia" },
  };

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function flagEmoji(code) {
    if (!code || code.length !== 2) return "🏳️";
    const cc = code.toUpperCase();
    return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
  }

  function countryCode(name) {
    return COUNTRY_ISO[name] || "";
  }

  function flagImgHTML(code, alt) {
    const cc = (code || "").toUpperCase();
    const safeAlt = escapeHTML(alt || cc || "");
    if (!cc || cc.length !== 2) {
      return `<span class="flag-icon" title="${safeAlt}"><span class="flag-emoji" aria-hidden="true">🏳️</span></span>`;
    }
    const emoji = flagEmoji(cc);
    const u = flagUrls(cc);
    // Prefer local raster flags — emoji regional indicators render as "US"/"CA" on many systems.
    return `<span class="flag-icon" title="${safeAlt}"><img class="flag-img" src="${u.src}" srcset="${u.srcset}" width="24" height="18" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.hidden=false)" /><span class="flag-emoji" hidden aria-hidden="true">${emoji}</span></span>`;
  }

  function localizedCountryName(name, locale) {
    const code = countryCode(name);
    if (!code) return name;
    try {
      const dn = new Intl.DisplayNames([locale || "en"], { type: "region" });
      return dn.of(code) || name;
    } catch (_) {
      return name;
    }
  }

  function ancientForRegion(region) {
    if (!region) return null;
    if (ANCIENT_FLAGS[region]) return ANCIENT_FLAGS[region];
    // Prefer longest exact substring match among ancient keys only
    const keys = Object.keys(ANCIENT_FLAGS).sort((a, b) => b.length - a.length);
    for (let i = 0; i < keys.length; i++) {
      if (region === keys[i] || region.includes(keys[i])) {
        return ANCIENT_FLAGS[keys[i]];
      }
    }
    const r = region.toLowerCase();
    // Require an "ancient / historical culture" signal — do not match modern country names alone
    const isAncientCue = /ancient|oracle|pharaoh|shang|hellenic|viking|norse|celtic|aztec|mexica|\bmaya\b|\binca\b|mesopotam|sumer|babylon|assyria|scythia|rome\b|roman\b/.test(r);
    if (!isAncientCue) return null;
    if (/\begypt\b/.test(r)) return ANCIENT_FLAGS["Ancient Egypt"];
    if (/mesopotam|sumer|babylon|assyria/.test(r)) return ANCIENT_FLAGS["Ancient Mesopotamia"];
    if (/\bchina\b|shang|oracle bone/.test(r)) return ANCIENT_FLAGS["Ancient China"];
    if (/\bjapan\b/.test(r)) return ANCIENT_FLAGS["Ancient Japan"];
    if (/\bgreece\b|hellenic/.test(r)) return ANCIENT_FLAGS["Ancient Greece"];
    if (/rome|roman/.test(r)) return ANCIENT_FLAGS["Ancient Rome"];
    if (/aztec|mexica/.test(r)) return ANCIENT_FLAGS["Aztec / Mexica"];
    if (/\bmaya\b/.test(r)) return ANCIENT_FLAGS.Maya;
    if (/\binca\b/.test(r)) return ANCIENT_FLAGS.Inca;
    if (/norse|viking/.test(r)) return ANCIENT_FLAGS["Norse / Viking"];
    if (/celtic/.test(r)) return ANCIENT_FLAGS["Celtic Europe"];
    if (/scythia|arabia/.test(r)) return ANCIENT_FLAGS["Ancient Arabia / Scythia"];
    if (/\bisrael\b/.test(r)) return ANCIENT_FLAGS["Ancient Israel"];
    return null;
  }

  function ancientChipHTML(ancient, locale) {
    if (!ancient) return "";
    const label =
      (window.FatumI18n && ancient.labelKey && window.FatumI18n.t(ancient.labelKey) !== ancient.labelKey
        ? window.FatumI18n.t(ancient.labelKey)
        : null) ||
      Object.keys(ANCIENT_FLAGS).find((k) => ANCIENT_FLAGS[k] === ancient) ||
      "Ancient";
    const safe = escapeHTML(label);
    return `<span class="country-chip country-chip--ancient" title="${safe}">` +
      flagImgHTML(ancient.code, label) +
      `<span class="country-chip__ancient" aria-hidden="true">${escapeHTML(ancient.emblem)}</span>` +
      `<span class="country-chip__name">${safe}</span>` +
      `</span>`;
  }

  function countryChipHTML(name, locale) {
    const code = countryCode(name);
    const label = localizedCountryName(name, locale);
    const safe = escapeHTML(label);
    return `<span class="country-chip" title="${safe}">` +
      flagImgHTML(code, label) +
      `<span class="country-chip__name">${safe}</span>` +
      `</span>`;
  }

  function countriesHTML(list, locale, region) {
    const chips = (list || []).map((n) => countryChipHTML(n, locale));
    const ancient = ancientForRegion(region);
    if (ancient) chips.unshift(ancientChipHTML(ancient, locale));
    return chips.join(" ");
  }

  /** Compact flag strip for picker rows (countries + optional ancient). */
  function flagsStripHTML(countries, region, max) {
    const limit = max || 4;
    const entries = [];
    const ancient = ancientForRegion(region);
    if (ancient && ancient.code) {
      entries.push({
        html:
          `<span class="picker-flag picker-flag--ancient" title="Ancient">` +
          flagImgHTML(ancient.code, "Ancient") +
          `<span class="picker-flag__emblem" aria-hidden="true">${escapeHTML(ancient.emblem)}</span>` +
          `</span>`,
        code: "ancient:" + ancient.code,
      });
    }
    const seenCodes = new Set();
    if (ancient && ancient.code) seenCodes.add(ancient.code);
    (countries || []).forEach((name) => {
      const code = countryCode(name);
      if (!code || seenCodes.has(code)) return;
      seenCodes.add(code);
      entries.push({
        html: `<span class="picker-flag" title="${escapeHTML(localizedCountryName(name))}">${flagImgHTML(code, name)}</span>`,
        code,
      });
    });
    const shown = entries.slice(0, limit);
    const extra = entries.length - shown.length;
    let html = shown.map((e) => e.html).join("");
    if (extra > 0) html += `<span class="picker-flag picker-flag--more">+${extra}</span>`;
    return `<span class="picker-flags">${html}</span>`;
  }

  function optionFlagsPrefix(countries, region) {
    // Plain-text emoji prefix for native <option> elements
    const ancient = ancientForRegion(region);
    const codes = [];
    if (ancient?.code) codes.push(ancient.code);
    (countries || []).forEach((n) => {
      const c = countryCode(n);
      if (c && !codes.includes(c)) codes.push(c);
    });
    return codes
      .slice(0, 3)
      .map((c) => flagEmoji(c))
      .join("");
  }

  window.FatumCountries = {
    COUNTRY_ISO,
    ANCIENT_FLAGS,
    flagEmoji,
    flagImgHTML,
    countryCode,
    localizedCountryName,
    countryChipHTML,
    countriesHTML,
    ancientForRegion,
    ancientChipHTML,
    flagsStripHTML,
    optionFlagsPrefix,
  };
})();

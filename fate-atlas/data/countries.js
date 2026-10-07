/**
 * Country catalog keys → ISO 3166-1 alpha-2 for flags & Intl.DisplayNames.
 * Catalog English names stay stable; UI shows localized names + flag emoji.
 */
(function () {
  "use strict";

  const COUNTRY_ISO = {
  "Algeria": "DZ",
  "Argentina": "AR",
  "Armenia": "AM",
  "Australia": "AU",
  "Austria": "AT",
  "Bangladesh": "BD",
  "Belarus": "BY",
  "Belgium": "BE",
  "Belize": "BZ",
  "Benin": "BJ",
  "Bhutan": "BT",
  "Bolivia": "BO",
  "Botswana": "BW",
  "Brazil": "BR",
  "Cambodia": "KH",
  "Cameroon": "CM",
  "Canada": "CA",
  "Central African Republic": "CF",
  "Chile": "CL",
  "China": "CN",
  "China (Tibet)": "CN",
  "Colombia": "CO",
  "Cuba": "CU",
  "Côte d'Ivoire": "CI",
  "DR Congo": "CD",
  "Denmark": "DK",
  "Dominican Republic": "DO",
  "Ecuador": "EC",
  "Egypt": "EG",
  "Estonia": "EE",
  "Ethiopia": "ET",
  "Federated States of Micronesia": "FM",
  "Fiji": "FJ",
  "Finland": "FI",
  "France": "FR",
  "French Polynesia": "PF",
  "Germany": "DE",
  "Ghana": "GH",
  "Greece": "GR",
  "Guatemala": "GT",
  "Guinea": "GN",
  "Honduras": "HN",
  "Hong Kong": "HK",
  "Iceland": "IS",
  "India": "IN",
  "Indonesia": "ID",
  "Iran": "IR",
  "Iraq": "IQ",
  "Ireland": "IE",
  "Israel": "IL",
  "Italy": "IT",
  "Japan": "JP",
  "Kazakhstan": "KZ",
  "Kenya": "KE",
  "Kiribati": "KI",
  "Korea": "KR",
  "Kyrgyzstan": "KG",
  "Laos": "LA",
  "Latvia": "LV",
  "Lebanon": "LB",
  "Lithuania": "LT",
  "Madagascar": "MG",
  "Malaysia": "MY",
  "Mali": "ML",
  "Marshall Islands": "MH",
  "Mexico": "MX",
  "Mongolia": "MN",
  "Morocco": "MA",
  "Mozambique": "MZ",
  "Myanmar": "MM",
  "Nepal": "NP",
  "New Zealand": "NZ",
  "Nigeria": "NG",
  "North Korea": "KP",
  "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK",
  "Papua New Guinea": "PG",
  "Peru": "PE",
  "Philippines": "PH",
  "Poland": "PL",
  "Puerto Rico": "PR",
  "Russia": "RU",
  "Samoa": "WS",
  "Saudi Arabia": "SA",
  "Senegal": "SN",
  "Serbia": "RS",
  "Singapore": "SG",
  "Somalia": "SO",
  "South Africa": "ZA",
  "South Korea": "KR",
  "South Sudan": "SS",
  "Spain": "ES",
  "Sri Lanka": "LK",
  "Sudan": "SD",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Syria": "SY",
  "Taiwan": "TW",
  "Tanzania": "TZ",
  "Thailand": "TH",
  "Togo": "TG",
  "Tunisia": "TN",
  "Turkey": "TR",
  "UAE": "AE",
  "Ukraine": "UA",
  "United Kingdom": "GB",
  "United States": "US",
  "Vietnam": "VN",
  "Yemen": "YE",
  "Zimbabwe": "ZW"
};

  function flagEmoji(code) {
    if (!code || code.length !== 2) return "🏳️";
    const cc = code.toUpperCase();
    return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
  }

  function countryCode(name) {
    return COUNTRY_ISO[name] || "";
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

  function countryChipHTML(name, locale) {
    const code = countryCode(name);
    const label = localizedCountryName(name, locale);
    const flag = flagEmoji(code || "UN");
    const safe = String(label)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return `<span class="country-chip" title="${safe}"><span class="country-chip__flag" aria-hidden="true">${flag}</span><span class="country-chip__name">${safe}</span></span>`;
  }

  function countriesHTML(list, locale) {
    return (list || []).map((n) => countryChipHTML(n, locale)).join(" ");
  }

  window.FatumCountries = {
    COUNTRY_ISO,
    flagEmoji,
    countryCode,
    localizedCountryName,
    countryChipHTML,
    countriesHTML,
  };
})();

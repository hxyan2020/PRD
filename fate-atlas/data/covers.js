/**
 * Cover art for rite cards.
 * Each rite gets a thematically matched photo plus a unique SVG overlay
 * (glyph + motif seeded by id) so no two cards share the same look.
 */
(function () {
  "use strict";

  const BASE = "assets/covers";

  const FEATURED = {
    bagua: "cover-bagua.jpg",
    tarot: "cover-tarot.jpg",
    mbti: "cover-mbti.jpg",
  };

  const THEME_FILES = {
    cards: "cover-cards.jpg",
    coins: "cover-coins.jpg",
    astrology: "cover-astrology.jpg",
    palmistry: "cover-palmistry.jpg",
    runes: "cover-runes.jpg",
    lots: "cover-lots.jpg",
    omens: "cover-omens.jpg",
    dreams: "cover-dreams.jpg",
    scrying: "cover-scrying.jpg",
    cups: "cover-cups.jpg",
    numbers: "cover-numbers.jpg",
    form: "cover-form.jpg",
    mesoamerica: "cover-mesoamerica.jpg",
    fate: "cover-fate.jpg",
    egypt: "cover-egypt.jpg",
    personality: "cover-mbti.jpg",
    eastasia: "cover-bagua.jpg",
  };

  function hashId(id) {
    const s = String(id || "");
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function themeFor(method) {
    if (!method) return "fate";
    if (method.guided && FEATURED[method.guided]) return method.guided;
    if (method.id && FEATURED[method.id]) return method.id;

    const s = [
      method.id,
      method.name,
      method.region,
      method.summary,
      method.type,
      ...(method.countries || []),
    ]
      .join(" ")
      .toLowerCase();

    if (/tarot|cartoman|lenormand|kipper|sibilla|playing.?card|oracle card|baraja|parrot card/.test(s))
      return "cards";
    if (/coin|bagua|i ching|iching|hexagram|yarrow|六爻|liu yao|qimen|na jia|zhou yi|meihua|plum blossom/.test(s))
      return "coins";
    if (/mbti|personality|myers|briggs|enneagram|temperament|blood type/.test(s)) return "personality";
    if (
      /\bif[aá]\b|odu|opele|afa\b|igba afa|geomanc|cleroman|cowrie|oracle bone|scapul|\bdice\b|casting lots|beloman|arrow lot|hakata|ngombo|obi\b|sikidy|jiaobei|kau chim|chi chi|shagai|astragal|knuckle/.test(
        s
      )
    )
      return "lots";
    if (/rune|futhark|ogham/.test(s)) return "runes";
    if (
      /astro|zodiac|horoscope|planet|decan|bazi|zi wei|ziwei|natal|birth chart|星|紫微|四柱|jyotish|vedic|horary|firdaria|falak|saju|tử vi|tu vi|western astrology|celtic tree|nine star|sukuyo|sanmeigaku|mongolian zurhai|khmer horas|thai horas|taksa|panchanga|weton|pawukon|maramataka|lunar mansion|manāzil|mazalot/.test(
        s
      )
    )
      return "astrology";
    if (/palmistry|chiromanc|palm reading|手相|\bpalms?\b|shou xiang|mogu|onychomanc/.test(s))
      return "palmistry";
    if (/tea leaf|tasseo|coffee cup|coffee ground|茶叶|turkish coffee|ceromanc|wax/.test(s))
      return "cups";
    if (/mirror|crystal ball|scry|gazing|aura|hydromanc|capnomanc|pyromanc|nephomanc/.test(s))
      return "scrying";
    if (/dream|incub|梦|svyatki|shaking tent|vision/.test(s)) return "dreams";
    if (/numerolog|abjad|gematria|数术|isopsephy|angel number|tamil numer|anka jyoti/.test(s))
      return "numbers";
    if (/hieroglyph|scarab|pharaoh|ancient egypt|egyptian dream|egyptian decan/.test(s)) return "egypt";
    if (/maya|aztec|mexica|inca|tzolk|tonalpohualli|calendar stone|mesoamerican|zapotec|mixtec/.test(s))
      return "mesoamerica";
    if (/bone|shell|lot casting|\blots\b|amathambo|zulu/.test(s)) return "lots";
    if (/physiogn|phrenolog|面相|骨相|face reading|body reading|metoposcop|grapholog|moleosoph|sāmudrika|samudrika/.test(s))
      return "form";
    if (/feng shui|vastu|kasō|kaso|ba zhai|flying star|xuan kong|onmyō|onmyo|rokuyō|rokuyo|seimei|name divin/.test(s))
      return "eastasia";
    if (/bird|augur|omen|weather|cloud|lightning|thunder|auspice|sky knowledge|stellar|star path|smoke/.test(s))
      return "omens";
    if (/chinese|japan|korea|shinto/.test(s)) return "eastasia";
    if (method.type === "Form") return "form";
    if (method.type === "Fate") return "fate";
    return "omens";
  }

  function iconEntry(method) {
    if (window.FatumRiteIcons && window.FatumRiteIcons.entryFor) {
      return window.FatumRiteIcons.entryFor(method);
    }
    const id = method && method.id ? method.id : "";
    return { glyph: "✦", hue: hashId(id) % 360, motif: hashId(id) % 5 };
  }

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function themeMotif(theme, accent, soft, seed) {
    const ox = 160 + (seed % 120);
    const oy = 120 + ((seed >>> 3) % 80);
    switch (theme) {
      case "cards":
      case "tarot":
        return `<g opacity="0.55" fill="none" stroke="${soft}" stroke-width="10">
          <rect x="210" y="90" width="200" height="300" rx="18" transform="rotate(-12 310 240)"/>
          <rect x="520" y="110" width="200" height="300" rx="18" transform="rotate(10 620 260)"/>
        </g>`;
      case "coins":
      case "bagua":
        return `<g opacity="0.5" fill="none" stroke="${accent}" stroke-width="12">
          <circle cx="280" cy="200" r="70"/><circle cx="280" cy="200" r="28"/>
          <circle cx="520" cy="320" r="55"/><circle cx="700" cy="180" r="48"/>
          <path d="M430 140h110M430 170h110M450 200h70M430 230h110M430 260h110M450 290h70"/>
        </g>`;
      case "astrology":
      case "fate":
        return `<g opacity="0.55" fill="${soft}" stroke="${accent}" stroke-width="4">
          <circle cx="720" cy="140" r="8"/><circle cx="640" cy="210" r="5"/>
          <circle cx="780" cy="250" r="6"/><circle cx="200" cy="120" r="7"/>
          <path d="M200 120 L640 210 L720 140 L780 250" fill="none" stroke-width="5" opacity="0.7"/>
          <circle cx="480" cy="300" r="120" fill="none" stroke-width="8" opacity="0.35"/>
        </g>`;
      case "palmistry":
      case "form":
        return `<g opacity="0.5" fill="none" stroke="${soft}" stroke-width="10" stroke-linecap="round">
          <path d="M380 460c20-120 30-220 20-300 40-10 70 40 75 110 35-70 90-50 95 20 30-55 85-35 80 40 25-40 70-20 65 45"/>
          <path d="M400 280c40 30 90 40 140 20M410 340c50 20 110 15 160-10"/>
        </g>`;
      case "runes":
        return `<g opacity="0.55" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round">
          <path d="M250 120v280M250 120l90 90M250 260l80 80"/>
          <path d="M480 140v260M480 140l100 70M480 210l90 60"/>
          <path d="M720 130v270M720 260l-80 70M720 260l80 70"/>
        </g>`;
      case "lots":
        return `<g opacity="0.5">
          <ellipse cx="260" cy="220" rx="70" ry="42" fill="none" stroke="${soft}" stroke-width="10" transform="rotate(-20 260 220)"/>
          <ellipse cx="420" cy="300" rx="55" ry="34" fill="none" stroke="${accent}" stroke-width="10" transform="rotate(15 420 300)"/>
          <ellipse cx="620" cy="200" rx="62" ry="38" fill="none" stroke="${soft}" stroke-width="10" transform="rotate(-8 620 200)"/>
          <circle cx="720" cy="340" r="34" fill="none" stroke="${accent}" stroke-width="10"/>
        </g>`;
      case "numbers":
        return `<g opacity="0.45" fill="none" stroke="${soft}" stroke-width="8">
          <path d="M180 140h160v160H180zM400 140h160v160H400zM620 140h160v160H620zM290 320h160v160H290zM510 320h160v160H510z"/>
        </g>`;
      case "cups":
        return `<g opacity="0.5" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round">
          <path d="M360 140h240l-30 180a90 90 0 0 1-180 0z"/>
          <path d="M600 180c50 10 70 60 40 100"/>
          <path d="M300 380h360"/>
        </g>`;
      case "scrying":
        return `<g opacity="0.5" fill="none" stroke="${soft}" stroke-width="12">
          <circle cx="480" cy="250" r="140"/>
          <circle cx="480" cy="250" r="90" stroke="${accent}"/>
          <path d="M480 390v70M420 460h120"/>
        </g>`;
      case "dreams":
      case "omens":
        return `<g opacity="0.5" fill="none" stroke="${soft}" stroke-width="10">
          <path d="M180 300c80-120 160-120 240 0s160 120 240 0 160-120 240 0" stroke="${accent}"/>
          <path d="M180 360c80-90 160-90 240 0s160 90 240 0 160-90 240 0"/>
          <circle cx="700" cy="140" r="36" fill="${soft}" opacity="0.35" stroke="none"/>
        </g>`;
      case "egypt":
        return `<g opacity="0.5" fill="none" stroke="${accent}" stroke-width="12">
          <path d="M480 100l220 300H260z"/>
          <path d="M200 420h560" stroke="${soft}"/>
        </g>`;
      case "mesoamerica":
        return `<g opacity="0.5" fill="none" stroke="${soft}" stroke-width="10">
          <circle cx="480" cy="260" r="150"/><circle cx="480" cy="260" r="100" stroke="${accent}"/>
          <circle cx="480" cy="260" r="50"/><path d="M480 110v300M330 260h300"/>
        </g>`;
      case "eastasia":
        return `<g opacity="0.5" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round">
          <path d="M240 360c80-160 160-200 240-200s160 40 240 200"/>
          <path d="M300 300c60-40 120-60 180-60s120 20 180 60" stroke="${soft}"/>
          <circle cx="480" cy="160" r="28" fill="${soft}" opacity="0.35" stroke="none"/>
        </g>`;
      default:
        return `<g opacity="0.4" fill="${accent}">
          <circle cx="${ox}" cy="${oy}" r="90" opacity="0.35"/>
          <circle cx="${960 - ox}" cy="${540 - oy}" r="70" fill="${soft}" opacity="0.25"/>
        </g>`;
    }
  }

  /** Unique translucent SVG overlay — thematic motif only (no rite-symbol glyph). */
  function uniqueOverlayDataUrl(method, theme) {
    const id = (method && method.id) || "rite";
    const e = iconEntry(method);
    const h = ((e.hue % 360) + 360) % 360;
    const seed = hashId(id);
    const accent = `hsl(${(h + 40) % 360} 62% 62%)`;
    const soft = `hsl(${h} 28% 88%)`;
    const gid = `ov-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const motif = themeMotif(theme === "tarot" ? "cards" : theme === "bagua" ? "coins" : theme === "mbti" ? "personality" : theme, accent, soft, seed);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="100%" x2="85%" y2="0%">
      <stop offset="0%" stop-color="hsl(${h} 32% 7%)" stop-opacity="0.82"/>
      <stop offset="42%" stop-color="hsl(${(h + 24) % 360} 28% 12%)" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="hsl(${(h + 48) % 360} 35% 16%)" stop-opacity="0.18"/>
    </linearGradient>
    <radialGradient id="${gid}-spot" cx="72%" cy="28%" r="48%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="960" height="540" fill="url(#${gid})"/>
  <rect width="960" height="540" fill="url(#${gid}-spot)"/>
  ${motif}
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function photoFileFor(method) {
    const theme = themeFor(method);
    if (FEATURED[theme]) return FEATURED[theme];
    return THEME_FILES[theme] || THEME_FILES.fate;
  }

  function photoUrlFor(method) {
    return `${BASE}/${photoFileFor(method)}`;
  }

  function urlFor(method) {
    // Featured guided rites: full photo, no overlay needed for identity.
    if (method && method.id && FEATURED[method.id]) return photoUrlFor(method);
    if (method && method.guided && FEATURED[method.guided]) return photoUrlFor(method);
    return uniqueOverlayDataUrl(method, themeFor(method));
  }

  function photoStyleFor(method) {
    const seed = hashId(method && method.id);
    const x = 20 + (seed % 60);
    const y = 25 + ((seed >>> 6) % 50);
    const hue = (seed % 24) - 12;
    const sat = 92 + (seed % 18);
    const contrast = 100 + (seed % 12);
    return `object-position:${x}% ${y}%;filter:hue-rotate(${hue}deg) saturate(${sat}%) contrast(${contrast}%)`;
  }

  function coverHTML(method, className) {
    const theme = themeFor(method);
    const photo = photoUrlFor(method);
    const featured =
      (method && method.id && FEATURED[method.id]) ||
      (method && method.guided && FEATURED[method.guided]);
    const alt = method && method.name ? String(method.name) : "Rite cover";
    const safeAlt = escapeXml(alt);
    const cls = className || "rite-cover";

    if (featured) {
      return `<div class="${cls}" aria-hidden="true">
      <img class="${cls}__img" src="${photo}" alt="${safeAlt}" width="960" height="540" loading="lazy" decoding="async" />
    </div>`;
    }

    const overlay = uniqueOverlayDataUrl(method, theme);
    const photoStyle = photoStyleFor(method);
    return `<div class="${cls} ${cls}--hybrid" aria-hidden="true">
      <img class="${cls}__photo" src="${photo}" alt="" width="960" height="540" loading="lazy" decoding="async" style="${photoStyle}" />
      <img class="${cls}__art" src="${overlay}" alt="${safeAlt}" width="960" height="540" loading="lazy" decoding="async" />
    </div>`;
  }

  window.FatumCovers = {
    BASE,
    FEATURED,
    THEME_FILES,
    themeFor,
    fileFor: photoFileFor,
    urlFor,
    photoUrlFor,
    uniqueOverlayDataUrl,
    coverHTML,
  };
})();

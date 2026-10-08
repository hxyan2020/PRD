/**
 * Cover art for rite cards.
 * Featured quests keep dedicated photos; every other rite gets a unique
 * SVG cover seeded by its id (hue + glyph + motif) so no two share art.
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

    if (/tarot|cartoman|lenormand|playing card|oracle card/.test(s)) return "cards";
    if (/coin|bagua|i ching|iching|hexagram|yarrow|六爻|liu yao|qimen|na jia|zhou yi/.test(s)) return "coins";
    if (/mbti|personality|myers|briggs|enneagram|temperament/.test(s)) return "personality";
    if (/\bif[aá]\b|odu|opele|afa\b|igba afa|geomanc|cleroman|cowrie|oracle bone|scapul|\bdice\b|casting lots|beloman|arrow lot/.test(s))
      return "lots";
    if (/rune|futhark|ogham/.test(s)) return "runes";
    if (/astro|zodiac|horoscope|planet|decan|bazi|zi wei|natal|birth chart|星|紫微|四柱/.test(s)) return "astrology";
    if (/palmistry|chiromanc|palm reading|手相|\bpalms?\b/.test(s)) return "palmistry";
    if (/tea leaf|tasseo|coffee cup|coffee ground|茶叶/.test(s)) return "cups";
    if (/mirror|crystal ball|scry|gazing/.test(s)) return "scrying";
    if (/dream|incub|梦/.test(s)) return "dreams";
    if (/numerolog|abjad|gematria|数术/.test(s)) return "numbers";
    if (/hieroglyph|scarab|pharaoh|ancient egypt|egyptian dream|egyptian decan/.test(s)) return "egypt";
    if (/maya|aztec|mexica|inca|tzolk|calendar stone|mesoamerican/.test(s)) return "mesoamerica";
    if (/bone|shell|lot casting|\blots\b/.test(s)) return "lots";
    if (/physiogn|phrenolog|面相|骨相|face reading|body reading/.test(s)) return "form";
    if (/bird|augur|omen|weather|cloud|lightning|thunder|auspice/.test(s)) return "omens";
    if (/chinese|japan|korea|feng shui|shinto|onmyo/.test(s)) return "eastasia";
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

  /** Unique SVG cover per rite — never reuses another method's artwork. */
  function uniqueSvgDataUrl(method) {
    const id = (method && method.id) || "rite";
    const e = iconEntry(method);
    const h = ((e.hue % 360) + 360) % 360;
    const seed = hashId(id);
    const motif = (e.motif != null ? e.motif : seed) % 5;
    const a1 = 18 + (seed % 40);
    const a2 = 55 + ((seed >>> 8) % 30);
    const ox = 120 + (seed % 700);
    const oy = 80 + ((seed >>> 5) % 360);
    const r1 = 90 + ((seed >>> 11) % 160);
    const r2 = 60 + ((seed >>> 17) % 120);
    const angle = (seed % 360);
    const c1 = `hsl(${h} 38% 18%)`;
    const c2 = `hsl(${(h + 28) % 360} 42% 28%)`;
    const c3 = `hsl(${(h + 200) % 360} 28% 14%)`;
    const accent = `hsl(${(h + 48) % 360} 55% 58%)`;
    const soft = `hsl(${h} 32% 78%)`;
    const glyph = escapeXml(e.glyph || "✦");
    const gid = `g-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    const shapes = [
      `<circle cx="${ox}" cy="${oy}" r="${r1}" fill="${accent}" opacity="0.18"/>
       <circle cx="${960 - ox}" cy="${540 - oy}" r="${r2}" fill="${soft}" opacity="0.12"/>`,
      `<ellipse cx="${ox}" cy="${oy}" rx="${r1}" ry="${r2}" fill="${accent}" opacity="0.16" transform="rotate(${angle} ${ox} ${oy})"/>
       <ellipse cx="${480}" cy="${270}" rx="${r2 + 40}" ry="${r1}" fill="${soft}" opacity="0.1"/>`,
      `<polygon points="${ox},${oy - r1} ${ox + r1},${oy} ${ox},${oy + r1} ${ox - r1},${oy}" fill="${accent}" opacity="0.15"/>
       <polygon points="${960 - ox},${540 - oy - r2} ${960 - ox + r2},${540 - oy} ${960 - ox},${540 - oy + r2} ${960 - ox - r2},${540 - oy}" fill="${soft}" opacity="0.1"/>`,
      `<path d="M${ox} ${oy} L${ox + r1} ${oy + r2} L${ox - r2} ${oy + r1} Z" fill="${accent}" opacity="0.16"/>
       <path d="M${480} 60 Q${ox} ${oy} 900 480" fill="none" stroke="${soft}" stroke-width="28" opacity="0.12"/>`,
      `<rect x="${ox - r1 / 2}" y="${oy - r2 / 2}" width="${r1}" height="${r2}" rx="18" fill="${accent}" opacity="0.14" transform="rotate(${angle % 45} ${ox} ${oy})"/>
       <rect x="${700 - (seed % 200)}" y="${80 + (seed % 120)}" width="${140 + (seed % 80)}" height="${90 + (seed % 60)}" rx="12" fill="${soft}" opacity="0.1"/>`,
    ];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540" role="img">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="${a1}%" stop-color="${c2}"/>
      <stop offset="${a2}%" stop-color="${c3}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>
    <radialGradient id="${gid}-glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="960" height="540" fill="url(#${gid})"/>
  <rect width="960" height="540" fill="url(#${gid}-glow)"/>
  ${shapes[motif]}
  <text x="480" y="292" text-anchor="middle" dominant-baseline="middle"
    font-family="Georgia, 'Times New Roman', serif" font-size="132" fill="${soft}" opacity="0.92">${glyph}</text>
  <text x="48" y="508" font-family="system-ui, sans-serif" font-size="18" fill="${soft}" opacity="0.35">${escapeXml(id)}</text>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function fileFor(method) {
    const theme = themeFor(method);
    if (FEATURED[theme]) return FEATURED[theme];
    return THEME_FILES[theme] || THEME_FILES.fate;
  }

  function urlFor(method) {
    if (method && method.id && FEATURED[method.id]) {
      return `${BASE}/${FEATURED[method.id]}`;
    }
    if (method && method.guided && FEATURED[method.guided]) {
      return `${BASE}/${FEATURED[method.guided]}`;
    }
    return uniqueSvgDataUrl(method);
  }

  function coverHTML(method, className) {
    const src = urlFor(method);
    const alt = method && method.name ? String(method.name) : "Rite cover";
    const safeAlt = alt
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const cls = className || "rite-cover";
    return `<div class="${cls}" aria-hidden="true">
      <img class="${cls}__img" src="${src}" alt="${safeAlt}" width="960" height="540" loading="lazy" decoding="async" />
    </div>`;
  }

  window.FatumCovers = {
    BASE,
    FEATURED,
    THEME_FILES,
    themeFor,
    fileFor,
    urlFor,
    uniqueSvgDataUrl,
    coverHTML,
  };
})();

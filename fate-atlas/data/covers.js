/**
 * Thematic high-res cover images for rite cards.
 * Featured quests get dedicated art; catalog rites map to a relevant theme.
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

  function fileFor(method) {
    const theme = themeFor(method);
    if (FEATURED[theme]) return FEATURED[theme];
    return THEME_FILES[theme] || THEME_FILES.fate;
  }

  function urlFor(method) {
    return `${BASE}/${fileFor(method)}`;
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
    coverHTML,
  };
})();

/**
 * Unique icon glyph + color motif for every rite.
 * Auto-assigned thematically; each id has a distinct glyph.
 */
(function () {
  "use strict";

  const ICONS = {
  "abjad": {
    "glyph": "🔢",
    "hue": 45,
    "motif": 0
  },
  "bagua": {
    "glyph": "☰",
    "hue": 111,
    "motif": 2
  },
  "iching": {
    "glyph": "☯",
    "hue": 249,
    "motif": 0
  },
  "ifa": {
    "glyph": "🌴",
    "hue": 261,
    "motif": 2
  },
  "ifa-cuba": {
    "glyph": "🌿",
    "hue": 273,
    "motif": 1
  },
  "mbti": {
    "glyph": "🧭",
    "hue": 245,
    "motif": 0
  },
  "tarot": {
    "glyph": "🃏",
    "hue": 7,
    "motif": 1
  },
  "aboriginal-sky": {
    "glyph": "☽",
    "hue": 113,
    "motif": 0
  },
  "afa": {
    "glyph": "🪵",
    "hue": 221,
    "motif": 0
  },
  "akan-day": {
    "glyph": "🗓",
    "hue": 1,
    "motif": 1
  },
  "andean-wata": {
    "glyph": "🌞",
    "hue": 142,
    "motif": 3
  },
  "angel-numbers": {
    "glyph": "⑧",
    "hue": 289,
    "motif": 2
  },
  "anka-jyotisha": {
    "glyph": "③",
    "hue": 352,
    "motif": 3
  },
  "apple-peel": {
    "glyph": "🦅",
    "hue": 156,
    "motif": 1
  },
  "ashtamangala": {
    "glyph": "♄",
    "hue": 39,
    "motif": 2
  },
  "astragalomancy": {
    "glyph": "🎲",
    "hue": 17,
    "motif": 1
  },
  "astrocartography": {
    "glyph": "☉",
    "hue": 228,
    "motif": 0
  },
  "augury": {
    "glyph": "🌪️",
    "hue": 334,
    "motif": 1
  },
  "aura-reading": {
    "glyph": "👤",
    "hue": 199,
    "motif": 4
  },
  "awdunigist": {
    "glyph": "⑦",
    "hue": 248,
    "motif": 0
  },
  "ayahuasca-vision": {
    "glyph": "☎",
    "hue": 280,
    "motif": 1
  },
  "aztec-tonalpohualli": {
    "glyph": "🔷",
    "hue": 51,
    "motif": 4
  },
  "baltic-finnic": {
    "glyph": "🌌",
    "hue": 322,
    "motif": 2
  },
  "baraja": {
    "glyph": "🃞",
    "hue": 312,
    "motif": 2
  },
  "bazhai": {
    "glyph": "✫",
    "hue": 180,
    "motif": 4
  },
  "bazi": {
    "glyph": "♍",
    "hue": 265,
    "motif": 4
  },
  "belomancy": {
    "glyph": "🐚",
    "hue": 91,
    "motif": 0
  },
  "benge": {
    "glyph": "❄",
    "hue": 334,
    "motif": 2
  },
  "benin-fa": {
    "glyph": "☿",
    "hue": 89,
    "motif": 1
  },
  "benmingnian": {
    "glyph": "♾️",
    "hue": 333,
    "motif": 4
  },
  "bibliomancy": {
    "glyph": "📖",
    "hue": 130,
    "motif": 3
  },
  "biorhythm": {
    "glyph": "🎋",
    "hue": 341,
    "motif": 2
  },
  "blood-type": {
    "glyph": "◈",
    "hue": 206,
    "motif": 3
  },
  "boi-kieu": {
    "glyph": "☺",
    "hue": 198,
    "motif": 4
  },
  "buzios": {
    "glyph": "🧿",
    "hue": 311,
    "motif": 4
  },
  "capnomancy": {
    "glyph": "☬",
    "hue": 92,
    "motif": 1
  },
  "cartomancy": {
    "glyph": "🃎",
    "hue": 44,
    "motif": 1
  },
  "celtic-tree": {
    "glyph": "ᚁ",
    "hue": 16,
    "motif": 3
  },
  "ceromancy": {
    "glyph": "▼",
    "hue": 174,
    "motif": 1
  },
  "cezi": {
    "glyph": "✵",
    "hue": 164,
    "motif": 2
  },
  "chabashira": {
    "glyph": "●",
    "hue": 291,
    "motif": 0
  },
  "chenggu": {
    "glyph": "♎",
    "hue": 50,
    "motif": 4
  },
  "chinese-zodiac": {
    "glyph": "◎",
    "hue": 35,
    "motif": 0
  },
  "cleromancy": {
    "glyph": "☷",
    "hue": 166,
    "motif": 0
  },
  "coca-leaves": {
    "glyph": "✱",
    "hue": 274,
    "motif": 4
  },
  "coffee-tasseography": {
    "glyph": "🫖",
    "hue": 158,
    "motif": 2
  },
  "daliuren": {
    "glyph": "✻",
    "hue": 13,
    "motif": 4
  },
  "delphi": {
    "glyph": "♝",
    "hue": 81,
    "motif": 2
  },
  "dene-stars": {
    "glyph": "♗",
    "hue": 123,
    "motif": 3
  },
  "dilogun": {
    "glyph": "♤",
    "hue": 215,
    "motif": 0
  },
  "dlera": {
    "glyph": "☩",
    "hue": 85,
    "motif": 1
  },
  "dogon-fox": {
    "glyph": "◓",
    "hue": 344,
    "motif": 3
  },
  "domino": {
    "glyph": "▽",
    "hue": 325,
    "motif": 1
  },
  "dowsing": {
    "glyph": "📍",
    "hue": 50,
    "motif": 0
  },
  "dream-interp": {
    "glyph": "💤",
    "hue": 137,
    "motif": 2
  },
  "egyptian-decan": {
    "glyph": "♃",
    "hue": 310,
    "motif": 4
  },
  "egyptian-dream": {
    "glyph": "🌛",
    "hue": 22,
    "motif": 4
  },
  "fal-hafez": {
    "glyph": "◇",
    "hue": 325,
    "motif": 2
  },
  "falak": {
    "glyph": "⑥",
    "hue": 324,
    "motif": 0
  },
  "fengshui": {
    "glyph": "🏯",
    "hue": 82,
    "motif": 3
  },
  "fijian-draunikau": {
    "glyph": "🌜",
    "hue": 263,
    "motif": 2
  },
  "firdaria": {
    "glyph": "♏",
    "hue": 95,
    "motif": 3
  },
  "flying-star": {
    "glyph": "☘",
    "hue": 317,
    "motif": 2
  },
  "futomani": {
    "glyph": "🦴",
    "hue": 162,
    "motif": 2
  },
  "geomancy-west": {
    "glyph": "✥",
    "hue": 190,
    "motif": 3
  },
  "giriama": {
    "glyph": "♇",
    "hue": 13,
    "motif": 0
  },
  "goralot": {
    "glyph": "♥",
    "hue": 53,
    "motif": 0
  },
  "graphology": {
    "glyph": "🧠",
    "hue": 297,
    "motif": 4
  },
  "gunghap": {
    "glyph": "♋",
    "hue": 51,
    "motif": 3
  },
  "hakata": {
    "glyph": "◆",
    "hue": 101,
    "motif": 1
  },
  "haruspicy": {
    "glyph": "✸",
    "hue": 223,
    "motif": 3
  },
  "hawaiian-kilo": {
    "glyph": "💭",
    "hue": 175,
    "motif": 2
  },
  "horary": {
    "glyph": "♈",
    "hue": 316,
    "motif": 0
  },
  "human-design": {
    "glyph": "☵",
    "hue": 335,
    "motif": 4
  },
  "hydromancy": {
    "glyph": "💧",
    "hue": 151,
    "motif": 0
  },
  "ikhtiyarat": {
    "glyph": "♒",
    "hue": 25,
    "motif": 0
  },
  "ilm-al-raml-africa": {
    "glyph": "▣",
    "hue": 23,
    "motif": 0
  },
  "innu-scapula": {
    "glyph": "📜",
    "hue": 287,
    "motif": 4
  },
  "islamic-astrology": {
    "glyph": "♉",
    "hue": 342,
    "motif": 0
  },
  "isopsephy": {
    "glyph": "⑤",
    "hue": 209,
    "motif": 1
  },
  "istikhara": {
    "glyph": "☣",
    "hue": 217,
    "motif": 3
  },
  "jafr": {
    "glyph": "🧵",
    "hue": 204,
    "motif": 1
  },
  "jiaobei": {
    "glyph": "◒",
    "hue": 240,
    "motif": 4
  },
  "jyotish": {
    "glyph": "♌",
    "hue": 353,
    "motif": 3
  },
  "kabbalah-numerology": {
    "glyph": "②",
    "hue": 265,
    "motif": 2
  },
  "kaso": {
    "glyph": "✧",
    "hue": 227,
    "motif": 1
  },
  "kau-chim": {
    "glyph": "◀",
    "hue": 82,
    "motif": 0
  },
  "khmer-hora": {
    "glyph": "✾",
    "hue": 213,
    "motif": 4
  },
  "kiboku": {
    "glyph": "◉",
    "hue": 194,
    "motif": 3
  },
  "kipper": {
    "glyph": "☼",
    "hue": 106,
    "motif": 4
  },
  "kp-astrology": {
    "glyph": "♆",
    "hue": 49,
    "motif": 1
  },
  "lao-calendar": {
    "glyph": "☲",
    "hue": 148,
    "motif": 3
  },
  "lenormand": {
    "glyph": "🂡",
    "hue": 133,
    "motif": 1
  },
  "lingqijing": {
    "glyph": "✪",
    "hue": 177,
    "motif": 4
  },
  "liuyao": {
    "glyph": "☴",
    "hue": 292,
    "motif": 4
  },
  "mahabote": {
    "glyph": "♊",
    "hue": 216,
    "motif": 1
  },
  "maize-casting": {
    "glyph": "♠",
    "hue": 279,
    "motif": 0
  },
  "mambila-nggam": {
    "glyph": "❇",
    "hue": 107,
    "motif": 3
  },
  "manazil": {
    "glyph": "♐",
    "hue": 85,
    "motif": 4
  },
  "maori-moon": {
    "glyph": "►",
    "hue": 189,
    "motif": 1
  },
  "mapuche-peuma": {
    "glyph": "☥",
    "hue": 219,
    "motif": 2
  },
  "mayan-tzolkin": {
    "glyph": "🐆",
    "hue": 5,
    "motif": 4
  },
  "mazalot": {
    "glyph": "♓",
    "hue": 213,
    "motif": 4
  },
  "mazatec-curandero": {
    "glyph": "❈",
    "hue": 342,
    "motif": 0
  },
  "meihua": {
    "glyph": "☱",
    "hue": 352,
    "motif": 3
  },
  "merindinlogun": {
    "glyph": "🌳",
    "hue": 80,
    "motif": 3
  },
  "mesopotamian-dream": {
    "glyph": "♁",
    "hue": 284,
    "motif": 1
  },
  "mesopotamian-extispicy": {
    "glyph": "♣",
    "hue": 215,
    "motif": 1
  },
  "metoposcopy": {
    "glyph": "☫",
    "hue": 309,
    "motif": 2
  },
  "mianxiang": {
    "glyph": "🗣️",
    "hue": 189,
    "motif": 3
  },
  "micronesian-stars": {
    "glyph": "❋",
    "hue": 105,
    "motif": 3
  },
  "midewiwin": {
    "glyph": "✹",
    "hue": 354,
    "motif": 4
  },
  "mo-dice": {
    "glyph": "✴",
    "hue": 107,
    "motif": 4
  },
  "mogu": {
    "glyph": "🖐️",
    "hue": 337,
    "motif": 2
  },
  "mole-reading": {
    "glyph": "👁️",
    "hue": 291,
    "motif": 3
  },
  "molybdomancy-tr": {
    "glyph": "★",
    "hue": 268,
    "motif": 4
  },
  "mordovian": {
    "glyph": "✰",
    "hue": 6,
    "motif": 2
  },
  "nephomancy": {
    "glyph": "❅",
    "hue": 99,
    "motif": 2
  },
  "ngombo": {
    "glyph": "⟡",
    "hue": 321,
    "motif": 0
  },
  "nine-star-ki": {
    "glyph": "✳",
    "hue": 343,
    "motif": 2
  },
  "numerology-west": {
    "glyph": "④",
    "hue": 16,
    "motif": 3
  },
  "obi": {
    "glyph": "♀",
    "hue": 263,
    "motif": 3
  },
  "ogham": {
    "glyph": "ᚈ",
    "hue": 303,
    "motif": 1
  },
  "omikuji": {
    "glyph": "♡",
    "hue": 289,
    "motif": 1
  },
  "onmyodo": {
    "glyph": "📅",
    "hue": 274,
    "motif": 4
  },
  "onychomancy": {
    "glyph": "❂",
    "hue": 167,
    "motif": 0
  },
  "oomancy": {
    "glyph": "✶",
    "hue": 297,
    "motif": 3
  },
  "oracle-bones": {
    "glyph": "♅",
    "hue": 313,
    "motif": 3
  },
  "oracle-cards": {
    "glyph": "🂱",
    "hue": 189,
    "motif": 3
  },
  "palmistry": {
    "glyph": "✋",
    "hue": 174,
    "motif": 2
  },
  "panchanga": {
    "glyph": "☸",
    "hue": 96,
    "motif": 0
  },
  "parrot-astrology": {
    "glyph": "♑",
    "hue": 178,
    "motif": 3
  },
  "pawukon": {
    "glyph": "✺",
    "hue": 58,
    "motif": 2
  },
  "physiognomy-eu": {
    "glyph": "♕",
    "hue": 292,
    "motif": 0
  },
  "png-smoke": {
    "glyph": "♔",
    "hue": 44,
    "motif": 1
  },
  "pyromancy": {
    "glyph": "🕯️",
    "hue": 199,
    "motif": 0
  },
  "qimen": {
    "glyph": "☶",
    "hue": 277,
    "motif": 4
  },
  "qizheng": {
    "glyph": "◐",
    "hue": 335,
    "motif": 4
  },
  "quechua-despacho": {
    "glyph": "♜",
    "hue": 159,
    "motif": 0
  },
  "ramala": {
    "glyph": "⬡",
    "hue": 61,
    "motif": 0
  },
  "rokuyo": {
    "glyph": "♢",
    "hue": 206,
    "motif": 4
  },
  "runes-futhorc": {
    "glyph": "ᚦ",
    "hue": 26,
    "motif": 1
  },
  "runes-younger": {
    "glyph": "ᛃ",
    "hue": 8,
    "motif": 4
  },
  "russian-svyatki": {
    "glyph": "🔥",
    "hue": 146,
    "motif": 4
  },
  "saju": {
    "glyph": "▲",
    "hue": 76,
    "motif": 0
  },
  "samoan-tofa": {
    "glyph": "♖",
    "hue": 45,
    "motif": 1
  },
  "samudrika": {
    "glyph": "✬",
    "hue": 204,
    "motif": 0
  },
  "sanmeigaku": {
    "glyph": "□",
    "hue": 346,
    "motif": 2
  },
  "sarvatobhadra": {
    "glyph": "◕",
    "hue": 107,
    "motif": 0
  },
  "scapulimancy-asia": {
    "glyph": "■",
    "hue": 179,
    "motif": 1
  },
  "scrying": {
    "glyph": "🔮",
    "hue": 2,
    "motif": 0
  },
  "seimei": {
    "glyph": "✼",
    "hue": 153,
    "motif": 4
  },
  "shagai": {
    "glyph": "◔",
    "hue": 244,
    "motif": 0
  },
  "shaking-tent": {
    "glyph": "✯",
    "hue": 196,
    "motif": 4
  },
  "shichu": {
    "glyph": "◑",
    "hue": 329,
    "motif": 3
  },
  "shouxiang": {
    "glyph": "👐",
    "hue": 123,
    "motif": 1
  },
  "sibilla": {
    "glyph": "☆",
    "hue": 115,
    "motif": 2
  },
  "sikidy": {
    "glyph": "☨",
    "hue": 318,
    "motif": 2
  },
  "sinhala-nekath": {
    "glyph": "☦",
    "hue": 273,
    "motif": 2
  },
  "slavic-folk": {
    "glyph": "✿",
    "hue": 14,
    "motif": 1
  },
  "sukuyo": {
    "glyph": "✦",
    "hue": 241,
    "motif": 3
  },
  "svarasastra": {
    "glyph": "✲",
    "hue": 312,
    "motif": 0
  },
  "tahitian-moon": {
    "glyph": "△",
    "hue": 345,
    "motif": 3
  },
  "taiyi": {
    "glyph": "✽",
    "hue": 231,
    "motif": 3
  },
  "taksa": {
    "glyph": "❊",
    "hue": 223,
    "motif": 4
  },
  "tamil-numerology": {
    "glyph": "∞",
    "hue": 18,
    "motif": 3
  },
  "tasseography-tea": {
    "glyph": "🍵",
    "hue": 204,
    "motif": 3
  },
  "thai-horasat": {
    "glyph": "○",
    "hue": 218,
    "motif": 3
  },
  "thai-weekday": {
    "glyph": "❉",
    "hue": 260,
    "motif": 2
  },
  "tibetan-astro": {
    "glyph": "☧",
    "hue": 184,
    "motif": 4
  },
  "tieban": {
    "glyph": "①",
    "hue": 162,
    "motif": 4
  },
  "tojeong": {
    "glyph": "◄",
    "hue": 261,
    "motif": 1
  },
  "tongshu": {
    "glyph": "☂",
    "hue": 191,
    "motif": 2
  },
  "torres-scintillation": {
    "glyph": "☮",
    "hue": 74,
    "motif": 1
  },
  "tu-tru": {
    "glyph": "✷",
    "hue": 330,
    "motif": 0
  },
  "tu-vi": {
    "glyph": "✮",
    "hue": 120,
    "motif": 4
  },
  "urim-thummim": {
    "glyph": "📿",
    "hue": 106,
    "motif": 2
  },
  "vastu": {
    "glyph": "▶",
    "hue": 262,
    "motif": 0
  },
  "wauja-tobacco": {
    "glyph": "☪",
    "hue": 75,
    "motif": 0
  },
  "western-astrology": {
    "glyph": "𓋹",
    "hue": 170,
    "motif": 2
  },
  "weton": {
    "glyph": "♛",
    "hue": 42,
    "motif": 1
  },
  "xiaoliuren": {
    "glyph": "♧",
    "hue": 81,
    "motif": 2
  },
  "zairja": {
    "glyph": "▢",
    "hue": 210,
    "motif": 3
  },
  "zapotec-mixtec": {
    "glyph": "☁",
    "hue": 216,
    "motif": 4
  },
  "ziwei": {
    "glyph": "☤",
    "hue": 295,
    "motif": 2
  },
  "zulu-bones": {
    "glyph": "♂",
    "hue": 349,
    "motif": 2
  },
  "zurhai": {
    "glyph": "❁",
    "hue": 72,
    "motif": 3
  }
};

  const MOTIFS = [
    (h, s) => `<circle cx="16" cy="16" r="13" fill="${h}" opacity="0.22"/><circle cx="16" cy="16" r="13" fill="none" stroke="${s}" stroke-width="1.5"/>`,
    (h, s) => `<polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="${h}" opacity="0.22"/><polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="${s}" stroke-width="1.5"/>`,
    (h, s) => `<polygon points="16,3 29,16 16,29 3,16" fill="${h}" opacity="0.22"/><polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="${s}" stroke-width="1.5"/>`,
    (h, s) => `<path d="M16 3 L27 8 V18 C27 24 16 29 16 29 C16 29 5 24 5 18 V8 Z" fill="${h}" opacity="0.22"/><path d="M16 3 L27 8 V18 C27 24 16 29 16 29 C16 29 5 24 5 18 V8 Z" fill="none" stroke="${s}" stroke-width="1.5"/>`,
    (h, s) => `<rect x="4" y="4" width="24" height="24" rx="3" fill="${h}" opacity="0.22"/><rect x="4" y="4" width="24" height="24" rx="3" fill="none" stroke="${s}" stroke-width="1.5"/>`,
  ];

  function entryFor(method) {
    if (!method) return { glyph: "✦", hue: 160, motif: 0 };
    const id = typeof method === "string" ? method : method.id;
    return ICONS[id] || { glyph: "✦", hue: 160, motif: 0 };
  }

  function colors(hue) {
    const h = ((hue % 360) + 360) % 360;
    return {
      fill: `hsl(${h} 42% 42%)`,
      stroke: `hsl(${h} 48% 32%)`,
      tint: `hsl(${h} 38% 92%)`,
    };
  }

  function iconSVG(method) {
    const e = entryFor(method);
    const c = colors(e.hue);
    const motif = MOTIFS[e.motif % MOTIFS.length](c.fill, c.stroke);
    const glyph = String(e.glyph)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<svg class="rite-icon__svg" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">${motif}<text x="16" y="17.5" text-anchor="middle" dominant-baseline="middle" font-size="13">${glyph}</text></svg>`;
  }

  function iconHTML(method, className) {
    const cls = className || "rite-icon";
    const e = entryFor(method);
    const c = colors(e.hue);
    return `<span class="${cls}" style="--rite-icon-tint:${c.tint};--rite-icon-ink:${c.stroke}" aria-hidden="true">${iconSVG(method)}</span>`;
  }

  function glyphFor(method) {
    return entryFor(method).glyph;
  }

  window.FatumRiteIcons = { ICONS, entryFor, iconHTML, iconSVG, glyphFor };
})();

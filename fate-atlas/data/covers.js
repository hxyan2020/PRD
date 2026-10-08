/**
 * Cover art for rite cards.
 * Non-featured rites use unique, self-hosted SVG illustrations keyed to the
 * rite's tools/region — no external photo CDN (loremflickr often fails and
 * collapses many rites onto the same local theme JPG).
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

  function methodText(method) {
    return [
      method && method.id,
      method && method.name,
      method && method.region,
      method && method.summary,
      method && method.type,
      ...((method && method.countries) || []),
    ]
      .join(" ")
      .toLowerCase();
  }

  /** Fine-grained visual recipe — tools of the rite, not just broad type. */
  function motifFor(method) {
    if (!method) return "altar";
    if (method.id === "tarot" || method.guided === "tarot") return "tarot";
    if (method.id === "bagua" || method.guided === "bagua") return "bagua";
    if (method.id === "mbti" || method.guided === "mbti") return "personality";

    const s = methodText(method);
    const id = String(method.id || "");

    // African / diaspora casting systems
    if (/ifa-cuba|afro-?cuban|lucum[ií]|santer[ií]a/.test(s) || id === "ifa-cuba") return "ifa-board";
    if (/\bif[aá]\b|odu|opele|ọ̀pẹ̀lẹ̀|babalawo|babaláwo/.test(s) || id === "ifa" || id === "benin-fa")
      return "ifa-chain";
    if (/merindinlogun|dilogun|sixteen cowrie|m[eé]r[iì]nd[ií]nl[oó]g[uú]n/.test(s)) return "cowrie-sixteen";
    if (/\bobi\b|kola nut/.test(s) || id === "obi") return "kola";
    if (/\bafa\b|igba afa|ugiri|dibia/.test(s) || id === "afa") return "ugiri-strings";
    if (/sikidy/.test(s)) return "sikidy-seeds";
    if (/hakata|ngombo|zulu-bones|amathambo|bone/.test(s)) return "bones";
    if (/ilm-al-raml|geomanc|ramala|mo-dice|\bdice\b|cleroman/.test(s)) return "sand-dice";
    if (/kau.?chim|chi.?chi|fortune stick|shaking stick|quill/.test(s)) return "lots-sticks";
    if (/jiaobei|moon.?block|筊/.test(s)) return "moon-blocks";
    if (/oracle.?bone|scapul|kiboku|futomani|innu-scapula/.test(s)) return "oracle-bone";
    if (/shagai|astragal|knuckle/.test(s)) return "shagai";
    if (/beloman|arrow lot/.test(s)) return "arrows";
    if (/cowrie|shell/.test(s)) return "cowrie";

    // Cards / coins / runes
    if (/tarot|cartoman|lenormand|kipper|sibilla|playing.?card|oracle card|baraja|parrot card/.test(s))
      return "cards";
    if (/coin|bagua|i ching|iching|hexagram|yarrow|六爻|liu yao|qimen|na jia|zhou yi|meihua|plum blossom/.test(s))
      return "coins";
    if (/rune|futhark|ogham/.test(s)) return "runes";

    // Sky / body / cups / etc.
    if (
      /astro|zodiac|horoscope|planet|decan|bazi|zi wei|ziwei|natal|birth chart|jyotish|vedic|horary|firdaria|falak|saju|tử vi|tu vi|celtic tree|nine star|sukuyo|sanmeigaku|zurhai|horas|taksa|panchanga|weton|pawukon|maramataka|lunar mansion|manāzil|mazalot/.test(
        s
      )
    )
      return "astrology";
    if (/palmistry|chiromanc|palm reading|手相|shou xiang|mogu|onychomanc/.test(s)) return "palmistry";
    if (/tea leaf|tasseo|coffee cup|coffee ground|茶叶|turkish coffee|ceromanc|wax/.test(s)) return "cups";
    if (/mirror|crystal ball|scry|gazing|aura|hydromanc|capnomanc|pyromanc|nephomanc/.test(s))
      return "scrying";
    if (/dream|incub|梦|svyatki|shaking tent|vision/.test(s)) return "dreams";
    if (/numerolog|abjad|gematria|数术|isopsephy|angel number|tamil numer|anka jyoti/.test(s))
      return "numbers";
    if (/hieroglyph|scarab|pharaoh|ancient egypt|egyptian/.test(s)) return "egypt";
    if (/maya|aztec|mexica|inca|tzolk|tonalpohualli|calendar stone|mesoamerican|zapotec|mixtec/.test(s))
      return "mesoamerica";
    if (/physiogn|phrenolog|面相|骨相|face reading|body reading|metoposcop|grapholog|moleosoph|sāmudrika|samudrika/.test(s))
      return "form";
    if (/feng shui|vastu|kasō|kaso|ba zhai|flying star|xuan kong|onmyō|onmyo|rokuyō|rokuyo|seimei|name divin/.test(s))
      return "eastasia";
    if (/mbti|personality|myers|briggs|enneagram|temperament|blood type/.test(s)) return "personality";
    if (/bird|augur|omen|weather|cloud|lightning|thunder|auspice|fox|benge/.test(s)) return "omens";
    if (/chinese|japan|korea|shinto/.test(s)) return "eastasia";
    if (method.type === "Form") return "form";
    if (method.type === "Fate") return "fate";
    return "altar";
  }

  /** Broad bucket used for local photo fallback texture only. */
  function themeFor(method) {
    const motif = motifFor(method);
    const map = {
      tarot: "tarot",
      bagua: "bagua",
      personality: "personality",
      cards: "cards",
      coins: "coins",
      runes: "runes",
      astrology: "astrology",
      palmistry: "palmistry",
      cups: "cups",
      scrying: "scrying",
      dreams: "dreams",
      numbers: "numbers",
      egypt: "egypt",
      mesoamerica: "mesoamerica",
      form: "form",
      eastasia: "eastasia",
      omens: "omens",
      fate: "fate",
      altar: "fate",
      "ifa-board": "lots",
      "ifa-chain": "lots",
      "cowrie-sixteen": "lots",
      kola: "lots",
      "ugiri-strings": "lots",
      "sikidy-seeds": "lots",
      bones: "lots",
      "sand-dice": "lots",
      "lots-sticks": "lots",
      "moon-blocks": "lots",
      "oracle-bone": "lots",
      shagai: "lots",
      arrows: "lots",
      cowrie: "lots",
    };
    return map[motif] || "omens";
  }

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function palette(seed) {
    const h = seed % 360;
    const h2 = (h + 38 + (seed % 40)) % 360;
    const h3 = (h + 180 + (seed % 60)) % 360;
    return {
      h,
      ink: `hsl(${h} 28% 8%)`,
      deep: `hsl(${h} 32% 14%)`,
      mid: `hsl(${h2} 42% 28%)`,
      accent: `hsl(${h2} 68% 58%)`,
      glow: `hsl(${h3} 55% 62%)`,
      soft: `hsl(${h} 22% 88%)`,
      line: `hsl(${h2} 40% 72%)`,
    };
  }

  function rng(seed) {
    let s = seed >>> 0;
    return function next() {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function cowrieAt(x, y, r, fill, stroke, rot) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      <ellipse cx="0" cy="0" rx="${r}" ry="${r * 0.62}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <ellipse cx="0" cy="0" rx="${r * 0.22}" ry="${r * 0.45}" fill="${stroke}" opacity="0.55"/>
    </g>`;
  }

  function motifDrawing(motif, p, seed) {
    const rnd = rng(seed);
    const scatter = (n, fn) => {
      let out = "";
      for (let i = 0; i < n; i++) out += fn(i, rnd(), rnd());
      return out;
    };

    switch (motif) {
      case "ugiri-strings":
        // Igbo Afa: strings of half-shells / ugiri
        return `<g>
          ${[0, 1, 2, 3].map((i) => {
            const x = 220 + i * 140;
            return `<line x1="${x}" y1="90" x2="${x}" y2="430" stroke="${p.line}" stroke-width="4" opacity="0.55"/>
              ${[0, 1, 2, 3, 4].map((j) => cowrieAt(x + (j % 2 ? 18 : -18), 120 + j * 58, 22, p.soft, p.accent, -25 + j * 8)).join("")}`;
          }).join("")}
          <rect x="160" y="440" width="640" height="28" rx="6" fill="${p.mid}" opacity="0.7"/>
        </g>`;

      case "ifa-chain":
        // ọ̀pẹ̀lẹ̀ chain of linked pods
        return `<g fill="none" stroke="${p.accent}" stroke-width="10" stroke-linecap="round">
          <path d="M180 120c40 40 40 80 0 120s-40 80 0 120 40 80 0 100" stroke="${p.line}"/>
          <path d="M320 100c50 35 50 85 0 130s-50 90 0 140 50 80 0 110"/>
          <path d="M500 90c55 40 55 90 0 140s-55 95 0 145 55 75 0 120" stroke="${p.glow}"/>
          <path d="M680 110c45 38 45 88 0 135s-45 92 0 140 45 70 0 105" stroke="${p.line}"/>
          ${scatter(10, (i, a, b) => `<circle cx="${200 + a * 560}" cy="${130 + b * 280}" r="${14 + (i % 3) * 4}" fill="${p.soft}" stroke="${p.accent}" stroke-width="3"/>`)}
        </g>`;

      case "ifa-board":
        // Afro-Cuban Ifá: square board + palm nuts
        return `<g>
          <rect x="210" y="90" width="540" height="360" rx="18" fill="${p.mid}" stroke="${p.accent}" stroke-width="8" opacity="0.85"/>
          <rect x="250" y="130" width="460" height="280" rx="8" fill="${p.ink}" opacity="0.35"/>
          <path d="M280 200h400M280 280h400M280 360h400" stroke="${p.line}" stroke-width="3" opacity="0.45"/>
          ${scatter(8, (i, a, b) => `<circle cx="${300 + a * 360}" cy="${170 + b * 220}" r="${16 + (i % 4) * 3}" fill="${p.accent}" stroke="${p.soft}" stroke-width="3"/>`)}
          <text x="480" y="430" text-anchor="middle" fill="${p.soft}" font-size="28" font-family="Georgia,serif" opacity="0.7">tablero</text>
        </g>`;

      case "cowrie-sixteen":
      case "cowrie":
        return `<g>
          <ellipse cx="480" cy="300" rx="320" ry="160" fill="${p.mid}" opacity="0.35"/>
          ${scatter(motif === "cowrie-sixteen" ? 16 : 11, (i, a, b) =>
            cowrieAt(200 + a * 560, 140 + b * 280, 18 + (i % 5) * 3, p.soft, p.accent, a * 50 - 20)
          )}
        </g>`;

      case "kola":
        return `<g>
          ${[0, 1, 2, 3].map((i) => {
            const x = 280 + (i % 2) * 200;
            const y = 160 + Math.floor(i / 2) * 160;
            return `<path d="M${x} ${y}c40-50 120-50 160 0 20 30 20 70 0 100-40 50-120 50-160 0-20-30-20-70 0-100z" fill="${i % 2 ? p.accent : p.glow}" stroke="${p.soft}" stroke-width="4" opacity="0.85"/>`;
          }).join("")}
        </g>`;

      case "sikidy-seeds":
        return `<g>
          <rect x="180" y="100" width="600" height="340" rx="12" fill="${p.deep}" stroke="${p.line}" stroke-width="4"/>
          ${scatter(36, (i, a, b) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return `<circle cx="${240 + col * 140}" cy="${150 + row * 35}" r="${6 + (seed + i) % 5}" fill="${(i + seed) % 3 ? p.accent : p.soft}"/>`;
          })}
        </g>`;

      case "bones":
        return `<g fill="${p.soft}" stroke="${p.accent}" stroke-width="3">
          ${scatter(9, (i, a, b) => {
            const x = 200 + a * 560;
            const y = 140 + b * 280;
            const rot = a * 70;
            return `<g transform="translate(${x} ${y}) rotate(${rot})">
              <ellipse cx="0" cy="0" rx="48" ry="16" opacity="0.9"/>
              <circle cx="-48" cy="0" r="12"/><circle cx="48" cy="0" r="12"/>
            </g>`;
          })}
        </g>`;

      case "sand-dice":
        return `<g>
          <rect x="140" y="120" width="680" height="300" rx="8" fill="${p.mid}" opacity="0.4"/>
          ${scatter(7, (i, a, b) => {
            const x = 200 + a * 520;
            const y = 160 + b * 200;
            const size = 48 + (i % 3) * 10;
            return `<g transform="translate(${x} ${y}) rotate(${a * 25})">
              <rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="6" fill="${p.deep}" stroke="${p.accent}" stroke-width="4"/>
              ${[0, 1, 2].slice(0, 1 + (i % 3)).map((d) => `<circle cx="${-12 + d * 12}" cy="0" r="4" fill="${p.soft}"/>`).join("")}
            </g>`;
          })}
        </g>`;

      case "lots-sticks":
        return `<g stroke="${p.accent}" stroke-width="10" stroke-linecap="round">
          ${scatter(18, (i, a, b) => {
            const x = 220 + a * 520;
            const y1 = 100 + b * 40;
            return `<line x1="${x}" y1="${y1}" x2="${x + (a - 0.5) * 30}" y2="${y1 + 300}" stroke="${i % 2 ? p.line : p.glow}" opacity="0.85"/>`;
          })}
          <rect x="300" y="80" width="360" height="50" rx="8" fill="${p.mid}" stroke="${p.soft}" stroke-width="3"/>
        </g>`;

      case "moon-blocks":
        return `<g>
          ${[0, 1].map((i) => {
            const x = 300 + i * 220;
            const flip = (seed + i) % 2;
            return `<path d="M${x} 180a90 110 0 1 0 0 220a40 110 0 1 1 0-220z" fill="${flip ? p.accent : p.soft}" stroke="${p.line}" stroke-width="5" transform="rotate(${flip ? 12 : -12} ${x + 40} 290)"/>`;
          }).join("")}
        </g>`;

      case "oracle-bone":
        return `<g>
          <path d="M260 120c120-40 320-40 440 20 40 80 20 200-40 280-100 60-280 70-400 20-50-80-40-220 0-320z" fill="${p.soft}" stroke="${p.accent}" stroke-width="5" opacity="0.9"/>
          ${scatter(12, (i, a, b) => `<path d="M${300 + a * 360} ${180 + b * 200}h${20 + a * 30}" stroke="${p.ink}" stroke-width="3" opacity="0.55"/>`)}
          <circle cx="520" cy="260" r="18" fill="${p.accent}" opacity="0.5"/>
        </g>`;

      case "shagai":
        return `<g>
          ${scatter(8, (i, a, b) => {
            const x = 220 + a * 520;
            const y = 160 + b * 240;
            return `<g transform="translate(${x} ${y}) rotate(${a * 40})">
              <rect x="-28" y="-18" width="56" height="36" rx="14" fill="${p.soft}" stroke="${p.accent}" stroke-width="4"/>
              <circle cx="-10" cy="0" r="4" fill="${p.ink}"/><circle cx="10" cy="0" r="4" fill="${p.ink}"/>
            </g>`;
          })}
        </g>`;

      case "arrows":
        return `<g stroke="${p.accent}" stroke-width="6" stroke-linecap="round">
          ${scatter(7, (i, a, b) => {
            const x = 240 + a * 480;
            const y = 120 + b * 60;
            return `<g>
              <line x1="${x}" y1="${y}" x2="${x + 40}" y2="${y + 320}" stroke="${i % 2 ? p.line : p.glow}"/>
              <path d="M${x + 40} ${y + 320}l-14-28M${x + 40} ${y + 320}l14-28" fill="none"/>
              <path d="M${x} ${y}l-12 22M${x} ${y}l12 22" fill="none" stroke="${p.soft}"/>
            </g>`;
          })}
        </g>`;

      case "cards":
      case "tarot":
        return `<g>
          ${[0, 1, 2].map((i) => {
            const x = 250 + i * 160;
            const rot = -16 + i * 16;
            return `<g transform="translate(${x} 140) rotate(${rot})">
              <rect width="170" height="270" rx="14" fill="${p.deep}" stroke="${p.accent}" stroke-width="6"/>
              <rect x="18" y="18" width="134" height="234" rx="8" fill="none" stroke="${p.line}" stroke-width="3"/>
              <circle cx="85" cy="120" r="28" fill="${p.accent}" opacity="0.7"/>
            </g>`;
          }).join("")}
        </g>`;

      case "coins":
      case "bagua":
        return `<g>
          ${scatter(6, (i, a, b) => {
            const x = 220 + a * 520;
            const y = 150 + b * 240;
            return `<g transform="translate(${x} ${y})">
              <circle r="58" fill="${p.accent}" stroke="${p.soft}" stroke-width="5" opacity="0.85"/>
              <circle r="22" fill="${p.ink}"/>
              <rect x="-10" y="-10" width="20" height="20" fill="${p.deep}"/>
            </g>`;
          })}
          <g stroke="${p.line}" stroke-width="8" stroke-linecap="round" opacity="0.7">
            <path d="M700 120h90M700 150h90M720 180h50M700 210h90M700 240h90M720 270h50"/>
          </g>
        </g>`;

      case "runes":
        return `<g fill="none" stroke="${p.accent}" stroke-width="14" stroke-linecap="round">
          <path d="M240 120v280M240 120l100 100M240 260l90 90"/>
          <path d="M480 130v270M480 130l110 80M480 220l100 70" stroke="${p.glow}"/>
          <path d="M720 120v280M720 260l-90 80M720 260l90 80" stroke="${p.line}"/>
        </g>`;

      case "astrology":
        return `<g fill="none" stroke="${p.accent}" stroke-width="5">
          <circle cx="480" cy="260" r="150" stroke="${p.line}"/>
          <circle cx="480" cy="260" r="100" stroke="${p.glow}" opacity="0.7"/>
          <circle cx="480" cy="260" r="50"/>
          ${scatter(12, (i) => {
            const ang = (i / 12) * Math.PI * 2;
            const x1 = 480 + Math.cos(ang) * 50;
            const y1 = 260 + Math.sin(ang) * 50;
            const x2 = 480 + Math.cos(ang) * 150;
            const y2 = 260 + Math.sin(ang) * 150;
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.soft}" stroke-width="3" opacity="0.55"/>`;
          })}
          ${scatter(8, (i, a, b) => `<circle cx="${200 + a * 560}" cy="${120 + b * 300}" r="${4 + (i % 3) * 2}" fill="${p.soft}" stroke="none"/>`)}
        </g>`;

      case "palmistry":
        return `<g fill="none" stroke="${p.line}" stroke-width="10" stroke-linecap="round">
          <path d="M400 460c25-130 35-240 20-330 45-12 80 45 85 120 40-75 100-55 105 25 35-60 95-40 88 45 30-45 78-22 72 50" stroke="${p.accent}"/>
          <path d="M420 270c50 35 110 45 170 18M430 340c55 22 120 16 175-12" stroke="${p.glow}"/>
        </g>`;

      case "cups":
        return `<g fill="none" stroke="${p.accent}" stroke-width="12" stroke-linecap="round">
          <path d="M340 130h280l-36 200a100 100 0 0 1-208 0z"/>
          <path d="M620 180c55 12 80 70 42 115" stroke="${p.line}"/>
          <path d="M300 400h360" stroke="${p.soft}"/>
          ${scatter(9, (i, a, b) => `<circle cx="${380 + a * 200}" cy="${220 + b * 120}" r="4" fill="${p.glow}" stroke="none" opacity="0.8"/>`)}
        </g>`;

      case "scrying":
        return `<g fill="none" stroke="${p.line}" stroke-width="12">
          <circle cx="480" cy="240" r="140" stroke="${p.accent}"/>
          <circle cx="480" cy="240" r="90" stroke="${p.glow}"/>
          <path d="M480 380v70M420 450h120" stroke="${p.soft}" stroke-width="10"/>
          <circle cx="450" cy="210" r="28" fill="${p.soft}" opacity="0.25" stroke="none"/>
        </g>`;

      case "dreams":
        return `<g fill="none" stroke="${p.line}" stroke-width="10">
          <path d="M160 300c90-130 180-130 270 0s180 130 270 0 180-130 270 0" stroke="${p.accent}"/>
          <path d="M160 360c90-100 180-100 270 0s180 100 270 0 180-100 270 0"/>
          <circle cx="720" cy="140" r="48" fill="${p.soft}" opacity="0.35" stroke="none"/>
          <circle cx="700" cy="150" r="36" fill="${p.ink}" opacity="0.35" stroke="none"/>
        </g>`;

      case "numbers":
        return `<g fill="none" stroke="${p.soft}" stroke-width="7">
          ${[0, 1, 2, 3, 4].map((i) => {
            const x = 180 + (i % 3) * 220;
            const y = 120 + Math.floor(i / 3) * 180;
            const n = ((seed + i) % 9) + 1;
            return `<rect x="${x}" y="${y}" width="160" height="140" rx="12" stroke="${p.accent}"/>
              <text x="${x + 80}" y="${y + 95}" text-anchor="middle" fill="${p.accent}" font-size="72" font-family="Georgia,serif">${n}</text>`;
          }).join("")}
        </g>`;

      case "egypt":
        return `<g fill="none" stroke="${p.accent}" stroke-width="12">
          <path d="M480 90l240 320H240z"/>
          <path d="M180 430h600" stroke="${p.line}"/>
          <circle cx="480" cy="280" r="36" fill="${p.glow}" opacity="0.5" stroke="${p.soft}" stroke-width="4"/>
        </g>`;

      case "mesoamerica":
        return `<g fill="none" stroke="${p.line}" stroke-width="10">
          <circle cx="480" cy="260" r="160"/><circle cx="480" cy="260" r="110" stroke="${p.accent}"/>
          <circle cx="480" cy="260" r="55"/><path d="M480 100v320M320 260h320"/>
          ${[0, 1, 2, 3].map((i) => {
            const ang = (i / 4) * Math.PI * 2 + (seed % 10) * 0.1;
            return `<circle cx="${480 + Math.cos(ang) * 135}" cy="${260 + Math.sin(ang) * 135}" r="10" fill="${p.glow}" stroke="none"/>`;
          }).join("")}
        </g>`;

      case "form":
      case "personality":
        return `<g fill="none" stroke="${p.accent}" stroke-width="10">
          <circle cx="480" cy="180" r="70" fill="${p.mid}" opacity="0.5"/>
          <path d="M300 420c30-120 80-180 180-180s150 60 180 180" stroke="${p.line}"/>
          <path d="M360 200c40-60 200-60 240 0" stroke="${p.glow}" stroke-width="6"/>
        </g>`;

      case "eastasia":
        return `<g fill="none" stroke="${p.accent}" stroke-width="12" stroke-linecap="round">
          <path d="M220 380c90-180 180-220 260-220s170 40 260 220"/>
          <path d="M280 310c70-50 140-70 200-70s130 20 200 70" stroke="${p.line}"/>
          <circle cx="480" cy="150" r="32" fill="${p.glow}" opacity="0.45" stroke="none"/>
        </g>`;

      case "omens":
        return `<g fill="none" stroke="${p.line}" stroke-width="8">
          <path d="M160 300c100-140 200-140 300 0s200 140 300 0 200-140 300 0" stroke="${p.accent}"/>
          <path d="M200 200c40-30 80-20 110 10M720 180c-50-40-110-20-140 30" stroke="${p.glow}"/>
          ${scatter(5, (i, a, b) => `<path d="M${180 + a * 600} ${140 + b * 80}c20-10 40 0 50 20" stroke="${p.soft}"/>`)}
        </g>`;

      case "fate":
      case "altar":
      default:
        return `<g>
          <ellipse cx="480" cy="400" rx="280" ry="40" fill="${p.mid}" opacity="0.45"/>
          ${[0, 1, 2].map((i) => {
            const x = 300 + i * 180;
            return `<g transform="translate(${x} 160)">
              <rect x="-14" y="40" width="28" height="160" fill="${p.deep}" stroke="${p.line}" stroke-width="3"/>
              <path d="M0 40c-30-50 30-90 0-130 40 30 50 90 0 130z" fill="${p.accent}" opacity="0.85"/>
            </g>`;
          }).join("")}
        </g>`;
    }
  }

  /** Unique full-bleed SVG cover — primary visual for each non-featured rite. */
  function uniqueCoverDataUrl(method) {
    const id = (method && method.id) || "rite";
    const name = (method && method.name) || "Rite";
    const motif = motifFor(method);
    const seed = hashId(id);
    const p = palette(seed);
    const gid = `c-${id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40)}`;
    const region = (method && (method.region || method.continent)) || "";
    const art = motifDrawing(motif, p, seed);
    const label = escapeXml(name.length > 42 ? name.slice(0, 40) + "…" : name);
    const sub = escapeXml(region.length > 48 ? region.slice(0, 46) + "…" : region);

    // Distinct layout offset per rite so even same-motif rites differ.
    const shiftX = ((seed % 60) - 30);
    const shiftY = (((seed >>> 8) % 50) - 25);
    const scale = 0.92 + ((seed >>> 16) % 20) / 100;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
  <defs>
    <linearGradient id="${gid}-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.ink}"/>
      <stop offset="55%" stop-color="${p.deep}"/>
      <stop offset="100%" stop-color="${p.mid}"/>
    </linearGradient>
    <radialGradient id="${gid}-spot" cx="70%" cy="25%" r="55%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${gid}-grain" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.8" fill="${p.soft}" opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="960" height="540" fill="url(#${gid}-bg)"/>
  <rect width="960" height="540" fill="url(#${gid}-spot)"/>
  <rect width="960" height="540" fill="url(#${gid}-grain)"/>
  <g transform="translate(480 270) scale(${scale}) translate(${-480 + shiftX} ${-270 + shiftY})">${art}</g>
  <rect x="0" y="400" width="960" height="140" fill="${p.ink}" opacity="0.55"/>
  <text x="48" y="455" fill="${p.soft}" font-size="36" font-family="Georgia, 'Times New Roman', serif" font-weight="600">${label}</text>
  <text x="48" y="495" fill="${p.line}" font-size="20" font-family="system-ui,sans-serif" opacity="0.85">${sub}</text>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // Back-compat alias used by older callers
  function uniqueOverlayDataUrl(method, theme) {
    return uniqueCoverDataUrl(method);
  }

  function photoFileFor(method) {
    const theme = themeFor(method);
    if (FEATURED[theme]) return FEATURED[theme];
    return THEME_FILES[theme] || THEME_FILES.fate;
  }

  function photoUrlFor(method) {
    const theme = themeFor(method);
    if (method && method.id && FEATURED[method.id]) return `${BASE}/${FEATURED[method.id]}`;
    if (method && method.guided && FEATURED[method.guided]) return `${BASE}/${FEATURED[method.guided]}`;
    if (FEATURED[theme]) return `${BASE}/${FEATURED[theme]}`;
    // Unique SVG — never share a single JPG across dozens of rites.
    return uniqueCoverDataUrl(method);
  }

  function urlFor(method) {
    return photoUrlFor(method);
  }

  function coverHTML(method, className) {
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

    return `<div class="${cls} ${cls}--illustrated" aria-hidden="true">
      <img class="${cls}__img ${cls}__art" src="${photo}" alt="${safeAlt}" width="960" height="540" loading="lazy" decoding="async" />
    </div>`;
  }

  window.FatumCovers = {
    BASE,
    FEATURED,
    THEME_FILES,
    themeFor,
    motifFor,
    fileFor: photoFileFor,
    urlFor,
    photoUrlFor,
    uniqueOverlayDataUrl,
    uniqueCoverDataUrl,
    coverHTML,
  };
})();

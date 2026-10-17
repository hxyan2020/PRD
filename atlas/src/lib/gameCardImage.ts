/** Category accent colors aligned with Ludus Atlas brand palette. */
const CATEGORY_ACCENT: Record<string, string> = {
  "Strategy & War": "#bc0234",
  "Board & Race": "#8a6a72",
  "Mancala & Sowing": "#8e0126",
  "Cards & Tiles": "#c45a72",
  "Dice & Chance": "#bc0234",
  "String & Finger": "#8a6a72",
  "Dolls & Figures": "#d4784a",
  "Ball & Sport": "#6a9bc3",
  "Spinning & Tops": "#c97b4a",
  "Puzzles & Skill": "#9b7d9b",
  "Outdoor Folk": "#6f9b7d",
  "Musical Play": "#c96a8a",
  Construction: "#8a9bc9",
  "Ritual & Ceremony": "#b49b6a",
  "Memory & Word": "#7d8a9b",
  "Hand & Gesture": "#9b8a7d",
};

const CARD_PREFIX = "ludus-card:";
const VIEW_PREFIX = "ludus-view:";

/** Default English gallery-panel captions (override via i18n at render time). */
export const VIEW_CAPTION_KEYS: readonly [
  "detail.viewCaption.atmosphere",
  "detail.viewCaption.play",
  "detail.viewCaption.materials",
  "detail.viewCaption.culture",
] = [
  "detail.viewCaption.atmosphere",
  "detail.viewCaption.play",
  "detail.viewCaption.materials",
  "detail.viewCaption.culture",
];

const VIEW_CAPTIONS = [
  "Atmosphere",
  "How it’s played",
  "Pieces & materials",
  "Cultural setting",
];

export type ImageLabel = {
  name: string;
  category: string;
  originCountry: string;
  /** English category key for accent colors when `category` is localized. */
  categoryKey?: string;
  /** Localized view captions (length 4); falls back to English defaults. */
  viewCaptions?: string[];
  /** Localized title-card footer line. */
  cardFooter?: string;
};

function accentForCategory(category: string, categoryKey?: string): string {
  return (
    CATEGORY_ACCENT[categoryKey || ""] ||
    CATEGORY_ACCENT[category] ||
    "#bc0234"
  );
}

export function isLudusCardSrc(src: string): boolean {
  return src.startsWith(CARD_PREFIX);
}

export function isLudusViewSrc(src: string): boolean {
  return src.startsWith(VIEW_PREFIX);
}

export function isLudusSyntheticSrc(src: string): boolean {
  return isLudusCardSrc(src) || isLudusViewSrc(src);
}

/** Encode a title card reference stored in collection.json. */
export function encodeLudusCard(
  name: string,
  category: string,
  originCountry: string,
): string {
  return `${CARD_PREFIX}${encodeURIComponent(name)}|${encodeURIComponent(category)}|${encodeURIComponent(originCountry)}`;
}

/** Encode a unique gallery panel for one game (never shared across entries). */
export function encodeLudusView(
  name: string,
  category: string,
  originCountry: string,
  viewIndex: number,
  seed: string,
): string {
  return `${VIEW_PREFIX}${encodeURIComponent(name)}|${encodeURIComponent(category)}|${encodeURIComponent(originCountry)}|${viewIndex}|${encodeURIComponent(seed)}`;
}

function parseLudusCard(src: string): {
  name: string;
  category: string;
  originCountry: string;
} | null {
  if (!isLudusCardSrc(src)) return null;
  const raw = src.slice(CARD_PREFIX.length);
  const [name, category, originCountry] = raw.split("|").map((p) => {
    try {
      return decodeURIComponent(p || "");
    } catch {
      return p || "";
    }
  });
  if (!name) return null;
  return { name, category: category || "", originCountry: originCountry || "" };
}

function parseLudusView(src: string): {
  name: string;
  category: string;
  originCountry: string;
  viewIndex: number;
  seed: string;
} | null {
  if (!isLudusViewSrc(src)) return null;
  const raw = src.slice(VIEW_PREFIX.length);
  const [name, category, originCountry, viewRaw, seed] = raw.split("|").map((p) => {
    try {
      return decodeURIComponent(p || "");
    } catch {
      return p || "";
    }
  });
  if (!name) return null;
  return {
    name,
    category: category || "",
    originCountry: originCountry || "",
    viewIndex: Number.parseInt(viewRaw || "0", 10) || 0,
    seed: seed || name,
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [""];
  // CJK / no-space scripts: break by character count.
  if (!/\s/.test(trimmed) && /[^\u0000-\u00ff]/.test(trimmed)) {
    const lines: string[] = [];
    for (let i = 0; i < trimmed.length && lines.length < maxLines; i += maxChars) {
      lines.push(trimmed.slice(i, i + maxChars));
    }
    if (trimmed.length > maxChars * maxLines && lines.length) {
      const last = lines[lines.length - 1]!;
      lines[lines.length - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
    }
    return lines;
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (words.join(" ").length > lines.join(" ").length) {
    const last = lines[lines.length - 1] ?? "";
    lines[lines.length - 1] = `${last.replace(/\s+\S*$/, "")}…`;
  }
  return lines.length ? lines : [trimmed.slice(0, maxChars)];
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mixAccent(baseHex: string, h: number): string {
  const raw = baseHex.replace("#", "");
  const r = Number.parseInt(raw.slice(0, 2), 16) || 188;
  const g = Number.parseInt(raw.slice(2, 4), 16) || 2;
  const b = Number.parseInt(raw.slice(4, 6), 16) || 52;
  const dr = ((h >> 0) % 70) - 20;
  const dg = ((h >> 8) % 90) - 30;
  const db = ((h >> 16) % 80) - 20;
  const clamp = (n: number) => Math.max(24, Math.min(230, n));
  return `rgb(${clamp(r + dr)},${clamp(g + dg)},${clamp(b + db)})`;
}

/** Subject keys for silhouette art — keep covers idea-matched when stock photos run out. */
export type SubjectMotif =
  | "whistle"
  | "rattle"
  | "pull"
  | "bow"
  | "stones"
  | "dice"
  | "shadow"
  | "kite"
  | "doll"
  | "ball"
  | "top"
  | "string"
  | "board"
  | "mancala"
  | "rope"
  | "hide"
  | "wrestle"
  | "circle"
  | "stilts"
  | "boat"
  | "sand"
  | "riddle"
  | "knot"
  | "house"
  | "drum"
  | "hands"
  | "cups"
  | "paper"
  | "ribbon"
  | "chess"
  | "cards"
  | "blocks"
  | "yo"
  | "marbles"
  | "generic";

/** Map a catalog title onto a recognizable subject silhouette. */
export function inferSubjectMotif(name: string): SubjectMotif {
  const n = (name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/whistle|ocarina|kazoo|flute|kalimba|thumb piano/.test(n)) return "whistle";
  if (/rattle|noisemaker|maracas|castanet|pinata|piñata/.test(n)) return "rattle";
  if (/pull toy|hobby horse|rocking|wagon/.test(n)) return "pull";
  if (/bow|dart|slingshot|archery/.test(n)) return "bow";
  if (/knuckle|jacks|skill stones|pocket skill|astragal/.test(n)) return "stones";
  if (/story lots|casting stick|dice|yahtzee|teetotum|dreidel/.test(n))
    return "dice";
  if (/shadow|puppet|wayang/.test(n)) return "shadow";
  if (/kite/.test(n)) return "kite";
  if (
    /doll|matryoshka|kokeshi|daruma|worry doll|rag doll|paper doll|action figure|tin soldier|toy soldier/.test(
      n,
    )
  )
    return "doll";
  if (
    /ball|footbag|hacky|jianzi|shuttlecock|sewn cloth|sepak|bocce|frisbee|flying disc/.test(
      n,
    )
  )
    return "ball";
  if (/spinning top|top craft|beigoma|gyroscope|button whirligig|whirligig/.test(n))
    return "top";
  if (/yo-?yo|diabolo|kongzhu/.test(n)) return "yo";
  if (/string|cradle|ayatori|cat'?s cradle/.test(n)) return "string";
  if (
    /race board|pachisi|ludo|snakes and|chutes|monopoly|board \(local\)|folk race|senet|backgammon|patolli/.test(
      n,
    )
  )
    return "board";
  if (/sowing|mancala|oware|congkak|sungka|pit-and-seed|toguz|wari/.test(n))
    return "mancala";
  if (/jump-?rope|skipping|chinese jump/.test(n)) return "rope";
  if (/blind|hide|seek|sardines|tag \/|call games/.test(n)) return "hide";
  if (/wrestl/.test(n)) return "wrestle";
  if (/chant|elimination|musical chairs|simon|charades|clapping rhyme/.test(n))
    return "circle";
  if (/stilt|pogo/.test(n)) return "stilts";
  if (/boat|leaf or bark/.test(n)) return "boat";
  if (/sand or snow|sandcastle|snowman|sandbox/.test(n)) return "sand";
  if (/riddle|twenty questions|hangman|memory|word|scrabble/.test(n))
    return "riddle";
  if (/knot|cord &|jackstraw|spillikin|mikado|pick-up|puzzle|tangram|rubik|soma|hanoi/.test(n))
    return "knot";
  if (/household|tea set|dollhouse|miniature|lincoln log/.test(n)) return "house";
  if (/drum|xylophone/.test(n)) return "drum";
  if (/clapping|hand & gesture|rock.paper/.test(n)) return "hands";
  if (/nesting|cup stack|stacking/.test(n)) return "cups";
  if (/fortune teller|origami|paper airplane|house of cards/.test(n)) return "paper";
  if (/ribbon|wand|hula|bubble/.test(n)) return "ribbon";
  if (
    /chess|chaturanga|shatranj|xiangqi|shogi|janggi|makruk|sittuyin|hnefatafl|checkers|draughts|go \(/.test(
      n,
    )
  )
    return "chess";
  if (/card|mahjong|domino|hanafuda|karuta|ganjifa|rummy|cribbage/.test(n))
    return "cards";
  if (/block|construction|jenga|lego|building/.test(n)) return "blocks";
  if (/marble/.test(n)) return "marbles";
  return "generic";
}

/** Centered subject silhouette — readable at card thumb size, no text. */
function subjectSilhouette(
  motif: SubjectMotif,
  accent: string,
  h: number,
  h2: number,
  opts?: { opacity?: number; offsetX?: number },
): string {
  const dx = ((h % 60) - 30) * 0.4 + (opts?.offsetX ?? 0);
  const dy = ((h2 % 50) - 25) * 0.35;
  const rot = ((h >> 5) % 14) - 7;
  const opacity = opts?.opacity ?? 0.78;
  const g = (body: string) =>
    `<g fill="${accent}" stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${450 + dx} ${300 + dy}) rotate(${rot}) scale(1.12)" opacity="${opacity}">${body}</g>`;

  switch (motif) {
    case "whistle":
      return g(`
        <ellipse cx="-40" cy="0" rx="70" ry="38" fill-opacity="0.85" stroke="none"/>
        <rect x="20" y="-14" width="110" height="28" rx="10" fill-opacity="0.9" stroke="none"/>
        <circle cx="-55" cy="-8" r="8" fill="#0c0c0c" fill-opacity="0.45" stroke="none"/>
        <circle cx="40" cy="0" r="6" fill="#0c0c0c" fill-opacity="0.35" stroke="none"/>
        <circle cx="70" cy="0" r="5" fill="#0c0c0c" fill-opacity="0.3" stroke="none"/>`);
    case "rattle":
      return g(`
        <circle cx="0" cy="-55" r="70" fill-opacity="0.85" stroke="none"/>
        <circle cx="-22" cy="-70" r="10" fill="#0c0c0c" fill-opacity="0.25" stroke="none"/>
        <circle cx="18" cy="-40" r="12" fill="#0c0c0c" fill-opacity="0.2" stroke="none"/>
        <rect x="-12" y="10" width="24" height="120" rx="10" fill-opacity="0.9" stroke="none"/>
        <ellipse cx="0" cy="140" rx="22" ry="12" fill-opacity="0.7" stroke="none"/>`);
    case "pull":
      return g(`
        <ellipse cx="-20" cy="30" rx="110" ry="40" fill-opacity="0.75" stroke="none"/>
        <circle cx="-80" cy="70" r="28" fill="none" stroke-width="10" opacity="0.9"/>
        <circle cx="50" cy="70" r="28" fill="none" stroke-width="10" opacity="0.9"/>
        <path d="M80 0 C 120 -40, 150 -20, 160 10" fill="none" stroke-width="10"/>
        <circle cx="-30" cy="-10" r="34" fill-opacity="0.85" stroke="none"/>`);
    case "bow":
      return g(`
        <path d="M-120 80 C -40 -120, 40 -120, 120 80" fill="none" stroke-width="14"/>
        <path d="M-110 70 L 110 70" fill="none" stroke-width="6" opacity="0.7"/>
        <path d="M0 -90 L 0 90" fill="none" stroke-width="8"/>
        <path d="M0 -90 L 18 -70 L 0 -55 Z" fill-opacity="0.9" stroke="none"/>`);
    case "stones":
      return g(`
        ${[-70, -20, 35, 80]
          .map(
            (x, i) =>
              `<ellipse cx="${x}" cy="${(i % 2) * 30 - 10}" rx="${28 + (i % 3) * 6}" ry="${22 + (i % 2) * 6}" fill-opacity="${0.7 + i * 0.05}" stroke="none"/>`,
          )
          .join("")}`);
    case "dice":
      return g(`
        <rect x="-90" y="-50" width="100" height="100" rx="16" fill-opacity="0.85" stroke="none"/>
        <rect x="10" y="-20" width="90" height="90" rx="14" fill-opacity="0.7" stroke="none"/>
        <circle cx="-55" cy="-15" r="9" fill="#0c0c0c" fill-opacity="0.4" stroke="none"/>
        <circle cx="-25" cy="15" r="9" fill="#0c0c0c" fill-opacity="0.4" stroke="none"/>
        <circle cx="40" cy="10" r="8" fill="#0c0c0c" fill-opacity="0.35" stroke="none"/>
        <circle cx="70" cy="40" r="8" fill="#0c0c0c" fill-opacity="0.35" stroke="none"/>`);
    case "shadow":
      return g(`
        <path d="M-40 -120 C -90 -40, -70 40, -20 120 L 30 90 C 10 20, 0 -40, 40 -100 Z" fill-opacity="0.85" stroke="none"/>
        <circle cx="10" cy="-70" r="28" fill-opacity="0.75" stroke="none"/>
        <rect x="60" y="-20" width="14" height="140" rx="6" fill-opacity="0.6" stroke="none"/>`);
    case "kite":
      return g(`
        <path d="M0 -130 L 90 0 L 0 90 L -90 0 Z" fill-opacity="0.85" stroke="none"/>
        <path d="M0 -130 L 0 90 M -90 0 L 90 0" fill="none" stroke="#0c0c0c" stroke-opacity="0.25" stroke-width="4"/>
        <path d="M0 90 Q 40 140, 20 180 Q -10 150, 30 200" fill="none" stroke-width="8" opacity="0.8"/>`);
    case "doll":
      return g(`
        <circle cx="0" cy="-80" r="48" fill-opacity="0.9" stroke="none"/>
        <path d="M-70 0 C -60 -40, 60 -40, 70 0 L 55 130 L -55 130 Z" fill-opacity="0.8" stroke="none"/>
        <circle cx="-16" cy="-85" r="6" fill="#0c0c0c" fill-opacity="0.35" stroke="none"/>
        <circle cx="16" cy="-85" r="6" fill="#0c0c0c" fill-opacity="0.35" stroke="none"/>`);
    case "ball":
      return g(`
        <circle cx="0" cy="0" r="110" fill-opacity="0.8" stroke="none"/>
        <path d="M-90 -20 Q 0 -50, 90 -20 M -95 30 Q 0 60, 95 30 M 0 -110 Q 40 0, 0 110" fill="none" stroke="#0c0c0c" stroke-opacity="0.25" stroke-width="6"/>`);
    case "top":
      return g(`
        <path d="M0 -100 L 70 20 L 18 20 L 35 110 L -35 110 L -18 20 L -70 20 Z" fill-opacity="0.88" stroke="none"/>
        <ellipse cx="0" cy="-100" rx="18" ry="10" fill-opacity="0.7" stroke="none"/>`);
    case "yo":
      return g(`
        <circle cx="-55" cy="0" r="70" fill-opacity="0.85" stroke="none"/>
        <circle cx="55" cy="0" r="70" fill-opacity="0.7" stroke="none"/>
        <rect x="-12" y="-20" width="24" height="40" rx="6" fill="#0c0c0c" fill-opacity="0.35" stroke="none"/>
        <path d="M0 -70 C 40 -140, 120 -80, 140 -20" fill="none" stroke-width="7" opacity="0.75"/>`);
    case "string":
      return g(`
        <path d="M-100 -40 C -40 -100, 40 -100, 100 -40 C 40 20, -40 20, -100 -40
                 M-80 20 C -20 80, 20 80, 80 20" fill="none" stroke-width="12" opacity="0.85"/>
        <circle cx="-100" cy="-40" r="14" fill-opacity="0.9" stroke="none"/>
        <circle cx="100" cy="-40" r="14" fill-opacity="0.9" stroke="none"/>`);
    case "board":
      return g(`
        <rect x="-130" y="-90" width="260" height="180" rx="12" fill-opacity="0.75" stroke="none"/>
        ${[0, 1, 2, 3]
          .map(
            (i) =>
              `<path d="M${-100 + i * 65} -70 V70 M-110 ${-55 + i * 40} H110" fill="none" stroke="#0c0c0c" stroke-opacity="0.28" stroke-width="4"/>`,
          )
          .join("")}
        <circle cx="-40" cy="-20" r="14" fill="#0c0c0c" fill-opacity="0.3" stroke="none"/>
        <circle cx="50" cy="30" r="14" fill="#0c0c0c" fill-opacity="0.3" stroke="none"/>`);
    case "mancala":
      return g(`
        <rect x="-150" y="-50" width="300" height="100" rx="50" fill-opacity="0.75" stroke="none"/>
        ${[-105, -52, 0, 52, 105]
          .map(
            (x) =>
              `<ellipse cx="${x}" cy="0" rx="28" ry="22" fill="#0c0c0c" fill-opacity="0.28" stroke="none"/>`,
          )
          .join("")}`);
    case "rope":
      return g(`
        <path d="M-140 40 C -60 -80, 60 -80, 140 40" fill="none" stroke-width="14"/>
        <circle cx="-140" cy="40" r="16" fill-opacity="0.9" stroke="none"/>
        <circle cx="140" cy="40" r="16" fill-opacity="0.9" stroke="none"/>
        <path d="M-40 60 Q 0 100, 40 60" fill="none" stroke-width="10" opacity="0.7"/>`);
    case "hide":
      return g(`
        <circle cx="0" cy="-20" r="90" fill-opacity="0.8" stroke="none"/>
        <rect x="-100" y="-40" width="200" height="36" rx="10" fill="#0c0c0c" fill-opacity="0.45" stroke="none"/>
        <path d="M-50 80 Q 0 130, 50 80" fill="none" stroke-width="10" opacity="0.7"/>`);
    case "wrestle":
      return g(`
        <circle cx="-50" cy="-70" r="32" fill-opacity="0.85" stroke="none"/>
        <circle cx="55" cy="-55" r="32" fill-opacity="0.75" stroke="none"/>
        <path d="M-80 0 C -20 -30, 20 -10, 80 20 L 60 90 L -70 80 Z" fill-opacity="0.8" stroke="none"/>`);
    case "circle":
      return g(`
        <circle cx="0" cy="0" r="110" fill="none" stroke-width="14" opacity="0.85"/>
        ${[0, 1, 2, 3, 4, 5]
          .map((i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return `<circle cx="${Math.cos(a) * 110}" cy="${Math.sin(a) * 110}" r="16" fill-opacity="0.9" stroke="none"/>`;
          })
          .join("")}`);
    case "stilts":
      return g(`
        <rect x="-55" y="-120" width="18" height="240" rx="8" fill-opacity="0.85" stroke="none"/>
        <rect x="37" y="-120" width="18" height="240" rx="8" fill-opacity="0.85" stroke="none"/>
        <rect x="-70" y="20" width="48" height="16" rx="6" fill-opacity="0.7" stroke="none"/>
        <rect x="22" y="20" width="48" height="16" rx="6" fill-opacity="0.7" stroke="none"/>`);
    case "boat":
      return g(`
        <path d="M-120 20 C -60 80, 60 80, 120 20 L 90 20 L 40 -40 L -20 -10 L -70 -50 L -100 20 Z" fill-opacity="0.85" stroke="none"/>
        <path d="M-140 50 Q 0 90, 140 50" fill="none" stroke-width="8" opacity="0.5"/>`);
    case "sand":
      return g(`
        <path d="M-100 60 L -40 -40 L 20 60 Z" fill-opacity="0.8" stroke="none"/>
        <path d="M-10 60 L 50 -70 L 110 60 Z" fill-opacity="0.65" stroke="none"/>
        <ellipse cx="10" cy="70" rx="140" ry="28" fill-opacity="0.45" stroke="none"/>`);
    case "riddle":
      return g(`
        <circle cx="0" cy="-20" r="90" fill-opacity="0.8" stroke="none"/>
        <text x="0" y="10" text-anchor="middle" fill="#0c0c0c" fill-opacity="0.45" font-family="Georgia, serif" font-size="100" font-weight="700" stroke="none">?</text>`);
    case "knot":
      return g(`
        <rect x="-40" y="-40" width="80" height="80" rx="8" fill-opacity="0.85" stroke="none" transform="rotate(20)"/>
        <rect x="-40" y="-40" width="80" height="80" rx="8" fill-opacity="0.55" stroke="none" transform="rotate(-25)"/>
        <path d="M-100 60 C -20 -40, 20 -40, 100 60" fill="none" stroke-width="12"/>`);
    case "house":
      return g(`
        <path d="M-100 20 L 0 -90 L 100 20 Z" fill-opacity="0.85" stroke="none"/>
        <rect x="-80" y="20" width="160" height="100" fill-opacity="0.75" stroke="none"/>
        <rect x="-20" y="50" width="40" height="70" fill="#0c0c0c" fill-opacity="0.3" stroke="none"/>`);
    case "drum":
      return g(`
        <ellipse cx="0" cy="-40" rx="100" ry="40" fill-opacity="0.85" stroke="none"/>
        <path d="M-100 -40 L -85 80 Q 0 110, 85 80 L 100 -40" fill-opacity="0.7" stroke="none"/>
        <ellipse cx="0" cy="-40" rx="70" ry="24" fill="#0c0c0c" fill-opacity="0.2" stroke="none"/>`);
    case "hands":
      return g(`
        <path d="M-90 40 C -100 -40, -40 -80, -10 -20 L -20 70 Z" fill-opacity="0.8" stroke="none"/>
        <path d="M90 40 C 100 -40, 40 -80, 10 -20 L 20 70 Z" fill-opacity="0.7" stroke="none"/>`);
    case "cups":
      return g(`
        <ellipse cx="0" cy="70" rx="90" ry="30" fill-opacity="0.55" stroke="none"/>
        <ellipse cx="0" cy="20" rx="70" ry="26" fill-opacity="0.7" stroke="none"/>
        <ellipse cx="0" cy="-25" rx="50" ry="22" fill-opacity="0.85" stroke="none"/>
        <ellipse cx="0" cy="-65" rx="32" ry="16" fill-opacity="0.9" stroke="none"/>`);
    case "paper":
      return g(`
        <path d="M-20 -100 L 90 20 L 20 40 L -90 -30 Z" fill-opacity="0.85" stroke="none"/>
        <path d="M-20 -100 L 20 40 L -40 60 Z" fill-opacity="0.55" stroke="none"/>
        <path d="M20 40 L 50 90 L -10 70" fill-opacity="0.45" stroke="none"/>`);
    case "ribbon":
      return g(`
        <rect x="-8" y="-120" width="16" height="160" rx="6" fill-opacity="0.85" stroke="none"/>
        <path d="M0 40 C 60 60, 100 20, 120 80 C 40 100, -40 70, -100 110 C -60 40, -40 50, 0 40" fill-opacity="0.7" stroke="none"/>`);
    case "chess":
      return g(`
        <rect x="-110" y="-110" width="220" height="220" rx="12" fill-opacity="0.7" stroke="none"/>
        ${Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            if ((row + col) % 2 === 0) return "";
            return `<rect x="${-110 + col * 27.5}" y="${-110 + row * 27.5}" width="27.5" height="27.5" fill="#0c0c0c" fill-opacity="0.28" stroke="none"/>`;
          }).join(""),
        ).join("")}
        <circle cx="0" cy="10" r="28" fill-opacity="0.85" stroke="none"/>
        <rect x="-12" y="-50" width="24" height="40" fill-opacity="0.85" stroke="none"/>`);
    case "cards":
      return g(`
        <rect x="-80" y="-100" width="110" height="160" rx="12" fill-opacity="0.75" stroke="none" transform="rotate(-12)"/>
        <rect x="-20" y="-90" width="110" height="160" rx="12" fill-opacity="0.85" stroke="none" transform="rotate(10)"/>
        <text x="35" y="-10" text-anchor="middle" fill="#0c0c0c" fill-opacity="0.35" font-family="Georgia, serif" font-size="54" font-weight="700" stroke="none">A</text>`);
    case "blocks":
      return g(`
        <rect x="-100" y="20" width="70" height="70" rx="8" fill-opacity="0.8" stroke="none"/>
        <rect x="-20" y="20" width="70" height="70" rx="8" fill-opacity="0.7" stroke="none"/>
        <rect x="-60" y="-60" width="70" height="70" rx="8" fill-opacity="0.85" stroke="none"/>`);
    case "marbles":
      return g(`
        <circle cx="-50" cy="10" r="48" fill-opacity="0.85" stroke="none"/>
        <circle cx="40" cy="-20" r="40" fill-opacity="0.7" stroke="none"/>
        <circle cx="70" cy="50" r="32" fill-opacity="0.6" stroke="none"/>
        <circle cx="-30" cy="-50" r="22" fill-opacity="0.75" stroke="none"/>`);
    default:
      return g(`
        <circle cx="0" cy="0" r="100" fill="none" stroke-width="12" opacity="0.7"/>
        <circle cx="0" cy="0" r="40" fill-opacity="0.75" stroke="none"/>`);
  }
}

function ambientMotifShapes(
  motif: number,
  accent: string,
  h: number,
  h2: number,
): string {
  const ox = 40 + (h % 420);
  const oy = 30 + ((h >> 8) % 340);
  const gap = 42 + (h2 % 28);
  const rot = (h2 >> 4) % 60;
  if (motif === 0) {
    return `<g opacity="0.14" stroke="${accent}" stroke-width="2" fill="none" transform="translate(${(h % 40) - 20} ${(h2 % 40) - 20})">
      ${Array.from({ length: 10 }, (_, i) => {
        const p = 40 + i * gap;
        return `<path d="M${p} 40 V560"/><path d="M40 ${p} H860"/>`;
      }).join("")}
    </g>`;
  }
  if (motif === 1) {
    return `<g fill="none" stroke="${accent}" stroke-width="${2 + (h % 3)}" opacity="0.7">
      <circle cx="${ox}" cy="${oy}" r="180" opacity="0.18"/>
      <circle cx="${ox}" cy="${oy}" r="120" opacity="0.14"/>
      <circle cx="${ox}" cy="${oy}" r="60" opacity="0.18"/>
    </g>`;
  }
  if (motif === 2) {
    return `<g opacity="0.12" fill="${accent}">
      ${Array.from({ length: 24 }, (_, i) => {
        const x = 40 + (i % 6) * 140 + ((i * 17 + h) % 40);
        const y = 40 + Math.floor(i / 6) * 130 + ((i * 11 + h2) % 30);
        return `<rect x="${x}" y="${y}" width="70" height="70" transform="rotate(${45 + (rot % 20)} ${x + 35} ${y + 35})" opacity="${0.35 + ((i * 13 + (h % 17)) % 40) / 100}"/>`;
      }).join("")}
    </g>`;
  }
  const a = 80 + (h % 200);
  const b = 100 + (h2 % 220);
  return `<g fill="none" stroke="${accent}" stroke-width="${8 + (h % 5)}" stroke-linecap="round" opacity="0.16">
    <path d="M40 ${420 - (h % 80)} C ${a} ${120 + (h2 % 100)}, ${420 + (h % 80)} ${520 - (h2 % 90)}, 860 ${160 + (h % 120)}"/>
    <path d="M60 ${520 - (h2 % 70)} C ${b} ${200 + (h % 90)}, ${500 + (h2 % 60)} ${560 - (h % 100)}, 880 ${280 + (h2 % 80)}"/>
  </g>`;
}

/**
 * Text-free atmospheric art for card backgrounds (no competing titles).
 * When `subjectName` is set, a silhouette matching the idea is drawn so
 * locale variants without stock photos still read as the right toy/game.
 */
export function ludusBackdropDataUri(
  category: string,
  seed = "",
  subjectName = "",
): string {
  const baseAccent = CATEGORY_ACCENT[category] || "#bc0234";
  // Hash must include the full seed so locale variants never share art.
  const h = hashSeed(`${category}|${seed}|${subjectName}`);
  const h2 = hashSeed(`${seed}|${category}|backdrop|${subjectName}`);
  const accent = mixAccent(baseAccent, h ^ h2);
  const ambient = h % 4;
  const glowX = 15 + (h % 70);
  const glowY = 10 + ((h2 >> 8) % 60);
  const washA = 12 + (h % 18);
  const washB = 8 + ((h2 >> 12) % 16);
  const subject = inferSubjectMotif(subjectName || category);
  const shapes = `${ambientMotifShapes(ambient, accent, h, h2)}
  ${subjectSilhouette(subject, accent, h, h2)}`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(${washA + 10},${washB},${washA})"/>
      <stop offset="45%" stop-color="#0c0c0c"/>
      <stop offset="100%" stop-color="rgb(${washB},${washA},${washA + 4})"/>
    </linearGradient>
    <radialGradient id="glow" cx="${glowX}%" cy="${glowY}%" r="65%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="${0.28 + (h % 20) / 100}"/>
      <stop offset="55%" stop-color="${accent}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grain" width="${28 + (h % 16)}" height="${28 + (h2 % 16)}" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="7" r="1.1" fill="${accent}" opacity="0.16"/>
      <circle cx="20" cy="22" r="1" fill="#e8f0ec" opacity="0.07"/>
      <circle cx="30" cy="10" r="0.8" fill="#e8f0ec" opacity="0.05"/>
    </pattern>
  </defs>
  <rect width="900" height="600" fill="url(#wash)"/>
  <rect width="900" height="600" fill="url(#glow)"/>
  <rect width="900" height="600" fill="url(#grain)"/>
  ${shapes}
  <rect x="0" y="0" width="10" height="600" fill="${accent}" opacity="0.85"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Build an SVG data-URI title card so the pictured name always matches the entry. */
export function ludusCardDataUri(
  name: string,
  category: string,
  originCountry: string,
  options?: { categoryKey?: string; cardFooter?: string },
): string {
  const accent = accentForCategory(category, options?.categoryKey);
  const footer = options?.cardFooter || "Catalog reference card";
  const titleLines = wrapLines(name, 22, 3);
  const titleFont =
    titleLines.length >= 3 ? 42 : titleLines.length === 2 ? 48 : 56;
  const titleBlock = titleLines
    .map((line, i) => {
      const y = 250 + i * (titleFont + 8);
      return `<text x="60" y="${y}" fill="#e8f0ec" font-family="Georgia, 'Times New Roman', serif" font-size="${titleFont}" font-weight="700">${escapeXml(line)}</text>`;
    })
    .join("");
  const h = hashSeed(`card|${name}|${category}`);
  const h2 = hashSeed(`${originCountry}|${name}|card`);
  // Soft silhouette on the right so gallery thumbs match the idea, not just text.
  const silhouette = subjectSilhouette(inferSubjectMotif(name), accent, h, h2, {
    opacity: 0.28,
    offsetX: 160,
  });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12080a"/>
      <stop offset="55%" stop-color="#0c0c0c"/>
      <stop offset="100%" stop-color="#1a1214"/>
    </linearGradient>
    <pattern id="grain" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="8" r="1" fill="${accent}" opacity="0.12"/>
      <circle cx="22" cy="26" r="1.2" fill="#e8f0ec" opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect width="900" height="600" fill="url(#grain)"/>
  ${silhouette}
  <rect x="0" y="0" width="12" height="600" fill="${accent}"/>
  <text x="60" y="92" fill="${accent}" font-family="system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="0.18em">LUDUS ATLAS</text>
  <text x="60" y="150" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="20">${escapeXml(category || "Toy & Game")}</text>
  ${titleBlock}
  <text x="60" y="520" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="22">${escapeXml(originCountry || "")}</text>
  <text x="60" y="560" fill="#7d9b8a" font-family="system-ui, sans-serif" font-size="14">${escapeXml(footer)}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Unique gallery panel — center-weighted so circular thumbs stay distinct. */
export function ludusViewDataUri(
  name: string,
  category: string,
  originCountry: string,
  viewIndex: number,
  seed: string,
  options?: { categoryKey?: string; viewCaptions?: string[] },
): string {
  const accent = accentForCategory(category, options?.categoryKey);
  const h = hashSeed(`${seed}|view|${viewIndex}|${name}`);
  const captions = options?.viewCaptions?.length
    ? options.viewCaptions
    : VIEW_CAPTIONS;
  const caption = captions[viewIndex % captions.length] || VIEW_CAPTIONS[0]!;
  const motif = (h + viewIndex * 3) % 5;
  const shift = ((h >> 3) % 40) - 20;
  let shapes = "";
  if (motif === 0) {
    shapes = `<g fill="none" stroke="${accent}" stroke-width="5">
      <circle cx="${450 + shift}" cy="260" r="150" opacity="0.55"/>
      <circle cx="${450 + shift}" cy="260" r="95" opacity="0.4"/>
      <circle cx="${450 + shift}" cy="260" r="40" fill="${accent}" fill-opacity="0.35" stroke="none"/>
    </g>`;
  } else if (motif === 1) {
    shapes = `<g fill="${accent}" opacity="0.4">
      ${[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + (h % 7) * 0.1;
        const x = 450 + Math.cos(a) * 110;
        const y = 250 + Math.sin(a) * 80;
        return `<circle cx="${x}" cy="${y}" r="${28 + (i % 3) * 8}"/>`;
      }).join("")}
    </g>`;
  } else if (motif === 2) {
    shapes = `<g fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" opacity="0.5">
      <path d="M220 320 C 320 140, 580 140, 680 320"/>
      <path d="M240 360 C 340 200, 560 200, 660 360"/>
      <path d="M280 400 C 380 260, 520 260, 620 400"/>
    </g>`;
  } else if (motif === 3) {
    shapes = `<g fill="${accent}" opacity="0.42">
      ${Array.from({ length: 9 }, (_, i) => {
        const x = 270 + (i % 3) * 120 + shift * 0.3;
        const y = 140 + Math.floor(i / 3) * 100;
        return `<rect x="${x}" y="${y}" width="70" height="70" rx="10" transform="rotate(${15 + i * 8} ${x + 35} ${y + 35})"/>`;
      }).join("")}
    </g>`;
  } else {
    shapes = `<g stroke="${accent}" fill="none" stroke-width="3" opacity="0.5">
      ${Array.from({ length: 6 }, (_, i) => {
        const p = 220 + i * 55;
        return `<path d="M${p} 120 V400"/><path d="M220 ${p - 40} H680"/>`;
      }).join("")}
      <rect x="300" y="160" width="300" height="220" rx="18" fill="${accent}" fill-opacity="0.12" stroke-width="5"/>
    </g>`;
  }
  const titleLines = wrapLines(name, 18, 2);
  const title = titleLines
    .map(
      (line, i) =>
        `<text x="450" y="${455 + i * 36}" text-anchor="middle" fill="#e8f0ec" font-family="Georgia, 'Times New Roman', serif" font-size="32" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a0c12"/>
      <stop offset="50%" stop-color="#0e0e0e"/>
      <stop offset="100%" stop-color="#181014"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect width="900" height="600" fill="url(#spot)"/>
  ${shapes}
  <circle cx="450" cy="250" r="36" fill="${accent}" opacity="0.9"/>
  <text x="450" y="262" text-anchor="middle" fill="#0c0c0c" font-family="system-ui, sans-serif" font-size="28" font-weight="800">${viewIndex + 1}</text>
  <text x="450" y="70" text-anchor="middle" fill="${accent}" font-family="system-ui, sans-serif" font-size="15" font-weight="700" letter-spacing="0.18em">${escapeXml(caption.toUpperCase())}</text>
  <text x="450" y="100" text-anchor="middle" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="16">${escapeXml(category || "")}</text>
  ${title}
  <text x="450" y="545" text-anchor="middle" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="16">${escapeXml(originCountry || "")}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Hosts that frequently 404 / drop empty in browsers (hotlink blocks, flaky CDN). */
const FRAGILE_HOSTS = new Set([
  "loremflickr.com",
  "www.loremflickr.com",
  "picsum.photos",
  "fastly.picsum.photos",
]);

/** Site-relative uploads saved by the Ludus admin (`uploads/{gameId}/…`). */
export function isLocalUploadSrc(src: string | undefined): boolean {
  if (!src) return false;
  return src.startsWith("uploads/") || src.startsWith("/uploads/");
}

/** Resolve admin upload paths against Vite `base` (local `/` or Pages `/PRD/ludus-atlas/`). */
export function resolveMediaUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("uploads/")) {
    const base = import.meta.env.BASE_URL || "/";
    return `${base}${src}`;
  }
  if (src.startsWith("/uploads/")) {
    const base = import.meta.env.BASE_URL || "/";
    return `${base}${src.slice(1)}`;
  }
  return src;
}

export function isFragileRemoteSrc(src: string): boolean {
  if (!src || isLudusSyntheticSrc(src) || src.startsWith("data:")) return false;
  if (isLocalUploadSrc(src)) return false;
  try {
    return FRAGILE_HOSTS.has(new URL(src).hostname);
  } catch {
    return true;
  }
}

/** True when `src` is a real remote photo (not a Ludus synthetic / fragile host). */
export function isPhotographicSrc(src: string | undefined): boolean {
  if (!src || isLudusSyntheticSrc(src) || src.startsWith("data:")) return false;
  if (isLocalUploadSrc(src)) return true;
  return !isFragileRemoteSrc(src);
}

/**
 * Gallery images for the detail page.
 * Real photos only — never show synthetic `ludus-view` panels
 * (Atmosphere / How it's played / Tools / Cultural setting).
 * A single title card is used only when the entry has no photographic URLs.
 * Length is whatever we have (0–N); there is no fixed image quota.
 */
export function listDisplayImages(images: string[] | undefined): string[] {
  const list = (images ?? []).filter(Boolean);
  // Explicitly drop numbered placeholder panels even if older builds left them in.
  const withoutViews = list.filter((src) => !isLudusViewSrc(src));
  const photos = withoutViews.filter(isPhotographicSrc);
  if (photos.length) return photos;
  const cards = withoutViews.filter(isLudusCardSrc);
  if (cards.length) return cards.slice(0, 1);
  return [];
}

/** Best single cover for cards / variation heroes. */
export function primaryCoverSrc(images: string[] | undefined): string | undefined {
  return listDisplayImages(images)[0];
}

/**
 * Resolve a collection image src for use in <img>.
 * Title-card / gallery-view refs become SVG data URIs.
 * When `label` is set, localized name/category/origin/captions override the
 * English strings baked into collection.json refs.
 */
export function resolveImageSrc(src: string, label?: ImageLabel): string {
  const view = parseLudusView(src);
  if (view) {
    return ludusViewDataUri(
      label?.name || view.name,
      label?.category || view.category,
      label?.originCountry || view.originCountry,
      view.viewIndex,
      view.seed,
      {
        categoryKey: label?.categoryKey || view.category,
        viewCaptions: label?.viewCaptions,
      },
    );
  }
  const parsed = parseLudusCard(src);
  if (!parsed) return resolveMediaUrl(src);
  return ludusCardDataUri(
    label?.name || parsed.name,
    label?.category || parsed.category,
    label?.originCountry || parsed.originCountry,
    {
      categoryKey: label?.categoryKey || parsed.category,
      cardFooter: label?.cardFooter,
    },
  );
}

/**
 * Prefer a named title card over fragile stock-photo hosts so galleries never
 * show the browser’s broken-image icon. Unique gallery views keep their own art.
 */
export function stableImageSrc(src: string, label?: ImageLabel): string {
  if (isLudusViewSrc(src)) return resolveImageSrc(src, label);
  if (label && (isLudusCardSrc(src) || isFragileRemoteSrc(src))) {
    return ludusCardDataUri(label.name, label.category, label.originCountry, {
      categoryKey: label.categoryKey,
      cardFooter: label.cardFooter,
    });
  }
  if (isFragileRemoteSrc(src)) {
    const parsed = parseLudusCard(src);
    if (parsed) {
      return ludusCardDataUri(
        parsed.name,
        parsed.category,
        parsed.originCountry,
        { categoryKey: parsed.category, cardFooter: label?.cardFooter },
      );
    }
  }
  return resolveImageSrc(src, label);
}

/**
 * Keep real photos; drop synthetic gallery placeholders (`ludus-view`).
 * Fragile remotes collapse to a single title card. Never invent filler panels
 * to hit a count.
 */
export function sanitizeImageList(
  images: string[] | undefined,
  label: { name: string; category: string; originCountry: string },
): string[] {
  const card = encodeLudusCard(label.name, label.category, label.originCountry);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of images ?? []) {
    // Numbered atmosphere/play/materials panels are placeholders — omit them.
    if (isLudusViewSrc(raw)) continue;
    const next = !raw || isFragileRemoteSrc(raw) ? card : raw;
    const key = isLudusCardSrc(next) ? "card" : next;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  if (!out.length) out.push(card);
  // At most one title card, and only when we have no photos.
  const photos = out.filter(isPhotographicSrc);
  if (photos.length) return photos;
  return out.filter(isLudusCardSrc).slice(0, 1);
}

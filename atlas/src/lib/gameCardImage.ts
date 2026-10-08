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

/** Text-free atmospheric art for card backgrounds (no competing titles). */
export function ludusBackdropDataUri(category: string, seed = ""): string {
  const accent = CATEGORY_ACCENT[category] || "#bc0234";
  const h = hashSeed(`${category}|${seed}`);
  const motif = h % 4;
  const ox = 120 + (h % 180);
  const oy = 80 + ((h >> 8) % 160);
  let shapes = "";
  if (motif === 0) {
    // board grid
    shapes = `<g opacity="0.22" stroke="${accent}" stroke-width="2" fill="none">
      ${Array.from({ length: 9 }, (_, i) => {
        const p = 80 + i * 55;
        return `<path d="M${p} 60 V540"/><path d="M60 ${p} H540"/>`;
      }).join("")}
    </g>`;
  } else if (motif === 1) {
    // concentric rings / ball
    shapes = `<g fill="none" stroke="${accent}" stroke-width="3">
      <circle cx="${ox + 220}" cy="${oy + 180}" r="180" opacity="0.28"/>
      <circle cx="${ox + 220}" cy="${oy + 180}" r="120" opacity="0.22"/>
      <circle cx="${ox + 220}" cy="${oy + 180}" r="60" opacity="0.3"/>
      <circle cx="${ox + 220}" cy="${oy + 180}" r="18" fill="${accent}" opacity="0.35" stroke="none"/>
    </g>`;
  } else if (motif === 2) {
    // tile / diamond lattice
    shapes = `<g opacity="0.2" fill="${accent}">
      ${Array.from({ length: 24 }, (_, i) => {
        const x = 40 + (i % 6) * 140 + ((i * 17) % 40);
        const y = 40 + Math.floor(i / 6) * 130 + ((i * 11) % 30);
        return `<rect x="${x}" y="${y}" width="70" height="70" transform="rotate(45 ${x + 35} ${y + 35})" opacity="${0.35 + ((i * 13) % 40) / 100}"/>`;
      }).join("")}
    </g>`;
  } else {
    // string / arc ribbons
    shapes = `<g fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity="0.28">
      <path d="M40 420 C 220 120, 420 520, 860 160"/>
      <path d="M60 520 C 280 200, 500 560, 880 280"/>
      <path d="M20 260 C 240 40, 520 360, 900 120"/>
    </g>`;
  }
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a0c10"/>
      <stop offset="45%" stop-color="#0c0c0c"/>
      <stop offset="100%" stop-color="#14080c"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.38"/>
      <stop offset="55%" stop-color="${accent}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grain" width="36" height="36" patternUnits="userSpaceOnUse">
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

export function isFragileRemoteSrc(src: string): boolean {
  if (!src || isLudusSyntheticSrc(src) || src.startsWith("data:")) return false;
  try {
    return FRAGILE_HOSTS.has(new URL(src).hostname);
  } catch {
    return true;
  }
}

/** True when `src` is a real remote photo (not a Ludus synthetic / fragile host). */
export function isPhotographicSrc(src: string | undefined): boolean {
  if (!src || isLudusSyntheticSrc(src) || src.startsWith("data:")) return false;
  return !isFragileRemoteSrc(src);
}

/**
 * Gallery images for the detail page.
 * Real photos only — never pad with synthetic `ludus-view` panels.
 * A title card is used only when the entry has no photographic URLs.
 * Length is whatever we have (1–N); there is no fixed 5-image quota.
 */
export function listDisplayImages(images: string[] | undefined): string[] {
  const list = (images ?? []).filter(Boolean);
  const photos = list.filter(isPhotographicSrc);
  if (photos.length) return photos;
  const cards = list.filter(isLudusCardSrc);
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
  if (!parsed) return src;
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

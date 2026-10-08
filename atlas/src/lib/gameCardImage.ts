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

const VIEW_CAPTIONS = [
  "Atmosphere",
  "How it’s played",
  "Pieces & materials",
  "Cultural setting",
];

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
  const words = text.split(/\s+/).filter(Boolean);
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
  return lines.length ? lines : [text.slice(0, maxChars)];
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
): string {
  const accent = CATEGORY_ACCENT[category] || "#7d9b8a";
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
  <text x="60" y="560" fill="#7d9b8a" font-family="system-ui, sans-serif" font-size="14">Catalog reference card</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Unique gallery panel — different motif/caption per view index, keyed by seed. */
export function ludusViewDataUri(
  name: string,
  category: string,
  originCountry: string,
  viewIndex: number,
  seed: string,
): string {
  const accent = CATEGORY_ACCENT[category] || "#bc0234";
  const h = hashSeed(`${seed}|view|${viewIndex}|${name}`);
  const caption = VIEW_CAPTIONS[viewIndex % VIEW_CAPTIONS.length];
  const motif = (h + viewIndex) % 4;
  const ox = 140 + (h % 200);
  const oy = 90 + ((h >> 7) % 180);
  let shapes = "";
  if (motif === 0) {
    shapes = `<g opacity="0.28" stroke="${accent}" stroke-width="2" fill="none">
      ${Array.from({ length: 8 }, (_, i) => {
        const p = 90 + i * 60;
        return `<path d="M${p} 70 V530"/><path d="M70 ${p} H830"/>`;
      }).join("")}
    </g>`;
  } else if (motif === 1) {
    shapes = `<g fill="none" stroke="${accent}" stroke-width="4">
      <circle cx="${ox + 200}" cy="${oy + 160}" r="170" opacity="0.3"/>
      <circle cx="${ox + 200}" cy="${oy + 160}" r="110" opacity="0.24"/>
      <circle cx="${ox + 200}" cy="${oy + 160}" r="50" opacity="0.32"/>
    </g>`;
  } else if (motif === 2) {
    shapes = `<g opacity="0.22" fill="${accent}">
      ${Array.from({ length: 18 }, (_, i) => {
        const x = 50 + (i % 6) * 140 + ((i * 19) % 36);
        const y = 60 + Math.floor(i / 6) * 140 + ((i * 13) % 28);
        return `<rect x="${x}" y="${y}" width="64" height="64" transform="rotate(45 ${x + 32} ${y + 32})"/>`;
      }).join("")}
    </g>`;
  } else {
    shapes = `<g fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.3">
      <path d="M50 400 C 240 100, 460 500, 860 180"/>
      <path d="M40 520 C 300 180, 520 540, 880 300"/>
    </g>`;
  }
  const title = wrapLines(name, 26, 2)
    .map(
      (line, i) =>
        `<text x="56" y="${420 + i * 40}" fill="#e8f0ec" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#14080c"/>
      <stop offset="55%" stop-color="#0c0c0c"/>
      <stop offset="100%" stop-color="#1a1014"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  ${shapes}
  <rect x="0" y="0" width="10" height="600" fill="${accent}" opacity="0.9"/>
  <text x="56" y="78" fill="${accent}" font-family="system-ui, sans-serif" font-size="16" font-weight="650" letter-spacing="0.16em">${escapeXml(caption.toUpperCase())}</text>
  <text x="56" y="120" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="18">${escapeXml(category || "")}</text>
  ${title}
  <text x="56" y="540" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="18">${escapeXml(originCountry || "")}</text>
  <text x="56" y="570" fill="#7d9b8a" font-family="system-ui, sans-serif" font-size="13">Gallery view ${viewIndex + 1}</text>
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
 * Gallery order: exclusive photos first, then unique per-game views.
 * Title cards are included only when no photo/view exists yet.
 */
export function listDisplayImages(images: string[] | undefined): string[] {
  const list = (images ?? []).filter(Boolean);
  const photos = list.filter(isPhotographicSrc);
  const views = list.filter(isLudusViewSrc);
  const cards = list.filter(isLudusCardSrc);
  if (photos.length || views.length) return [...photos, ...views];
  return cards.length ? cards : list;
}

/** Best single cover for cards / variation heroes. */
export function primaryCoverSrc(images: string[] | undefined): string | undefined {
  return listDisplayImages(images)[0];
}

/**
 * Resolve a collection image src for use in <img>.
 * Title-card / gallery-view refs become SVG data URIs.
 */
export function resolveImageSrc(src: string): string {
  const view = parseLudusView(src);
  if (view) {
    return ludusViewDataUri(
      view.name,
      view.category,
      view.originCountry,
      view.viewIndex,
      view.seed,
    );
  }
  const parsed = parseLudusCard(src);
  if (!parsed) return src;
  return ludusCardDataUri(parsed.name, parsed.category, parsed.originCountry);
}

/**
 * Prefer a named title card over fragile stock-photo hosts so galleries never
 * show the browser’s broken-image icon. Unique gallery views keep their own art.
 */
export function stableImageSrc(
  src: string,
  label?: { name: string; category: string; originCountry: string },
): string {
  if (isLudusViewSrc(src)) return resolveImageSrc(src);
  if (label && (isLudusCardSrc(src) || isFragileRemoteSrc(src))) {
    return ludusCardDataUri(label.name, label.category, label.originCountry);
  }
  if (isFragileRemoteSrc(src)) {
    const parsed = parseLudusCard(src);
    if (parsed) {
      return ludusCardDataUri(parsed.name, parsed.category, parsed.originCountry);
    }
  }
  return resolveImageSrc(src);
}

/** Rewrite fragile remote URLs to ludus-card refs and drop duplicates. */
export function sanitizeImageList(
  images: string[] | undefined,
  label: { name: string; category: string; originCountry: string },
): string[] {
  const card = encodeLudusCard(label.name, label.category, label.originCountry);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of images ?? []) {
    if (isLudusViewSrc(raw)) {
      if (seen.has(raw)) continue;
      seen.add(raw);
      out.push(raw);
      continue;
    }
    const next = !raw || isFragileRemoteSrc(raw) ? card : raw;
    const key = isLudusCardSrc(next) ? `card:${next}` : next;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(isLudusCardSrc(next) ? next : next);
  }
  if (!out.length) out.push(card);
  return out;
}

import type { EvidenceImage } from "@/lib/types";

/** Ads, logos, UI chrome, and non-content assets — never extract these. */
const BLOCKED_NAME =
  /logo|icon|sprite|badge|banner|advert|ads?[-_/]|sponsor|favicon|wordmark|button|smiley|emoji|stub|disambig|edit[-_]?icon|ambox|wiki\.png|commons-logo|mediawiki|w\.svg|lock-green|magnify|sound[-_]?icon|qrcode|qr[-_]?code|tracking|pixel\.gif|1x1|spacer|placeholder|avatar|profile[-_]?pic|coat[-_]?of[-_]?arms|flag[-_]?of|emblem|seal[-_]?of|signature/i;

/** True HD floor: reject anything below this. */
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;
const MIN_LONG_EDGE = 1280;
const MIN_AREA = 1280 * 720;

const ALLOWED_IMAGE_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

export function isAllowedImageHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    // thumb.wikimedia.org is preview-only — not accepted as final HD source
    return ALLOWED_IMAGE_HOSTS.has(host);
  } catch {
    return false;
  }
}

function cleanImageUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Prefer the full Wikimedia original when given a /thumb/ URL.
 * Example: .../thumb/a/ab/File.jpg/330px-File.jpg → .../a/ab/File.jpg
 */
export function resolveWikimediaOriginal(url: string): string {
  const cleaned = cleanImageUrl(url);
  const thumbMatch = cleaned.match(
    /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+\/)thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/[^/]+$/i,
  );
  if (thumbMatch) return `${thumbMatch[1]}${thumbMatch[2]}`;
  return cleaned;
}

function isHighDefinition(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  if (width <= 0 || height <= 0) return false;
  const longEdge = Math.max(width, height);
  if (longEdge < MIN_LONG_EDGE) return false;
  if (width < MIN_WIDTH && height < MIN_HEIGHT) return false;
  if (width * height < MIN_AREA) return false;
  return true;
}

function looksRelevantToSource(img: EvidenceImage, topicHint?: string): boolean {
  if (!topicHint?.trim()) return true;
  const hay = `${img.alt} ${img.url}`.toLowerCase();
  const tokens = topicHint
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3)
    .slice(0, 8);
  if (tokens.length === 0) return true;
  // At least one meaningful topic token should appear, or the image is generic chrome
  return tokens.some((t) => hay.includes(t));
}

/** Keep only high-definition, content-relevant source images — no ads, logos, or UI chrome. */
export function filterHdRelevantImages(
  images: EvidenceImage[],
  options?: { topicHint?: string },
): EvidenceImage[] {
  const seen = new Set<string>();
  const out: EvidenceImage[] = [];
  for (const img of images) {
    const url = resolveWikimediaOriginal(img.url);
    if (!url || !isAllowedImageHost(url)) continue;
    if (BLOCKED_NAME.test(url) || BLOCKED_NAME.test(img.alt || "")) continue;
    // Unknown dimensions are not trusted as HD — reject
    if (!isHighDefinition(img.width, img.height)) continue;
    if (!looksRelevantToSource(img, options?.topicHint)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ ...img, url });
  }
  return out.slice(0, 3);
}

/**
 * Fetch lead imagery via Wikipedia REST summary (allowlisted hosts only).
 * Uses originalimage only — never low-res thumbnails.
 */
export async function fetchWikipediaHdImage(
  lang: string,
  pageTitle: string,
  pageUrl: string,
): Promise<EvidenceImage | null> {
  const host = `${lang}.wikipedia.org`;
  const titlePath = encodeURIComponent(pageTitle.replace(/ /g, "_"));
  const url = `https://${host}/api/rest_v1/page/summary/${titlePath}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SimulumCatalogue/0.2",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      originalimage?: { source?: string; width?: number; height?: number };
      thumbnail?: { source?: string; width?: number; height?: number };
    };

    // HD only: require originalimage with known dimensions. Do not fall back to thumbnail.
    const original = data.originalimage;
    if (!original?.source) return null;
    const width = Number(original.width ?? 0);
    const height = Number(original.height ?? 0);
    if (!isHighDefinition(width, height)) return null;

    const candidate: EvidenceImage = {
      url: original.source,
      alt: data.title || pageTitle,
      width,
      height,
      credit: "Wikimedia / Wikipedia",
      sourceUrl: pageUrl,
    };
    return (
      filterHdRelevantImages([candidate], { topicHint: pageTitle })[0] ?? null
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

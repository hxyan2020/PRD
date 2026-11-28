import type { EvidenceImage } from "@/lib/types";

const BLOCKED_NAME =
  /logo|icon|sprite|badge|banner|advert|ads?[-_]|sponsor|favicon|wordmark|button|smiley|emoji|stub|disambig|edit[-_]?icon|ambox|wiki\.png|commons-logo|w.svg|lock-green|magnify|sound[-_]?icon/i;

const MIN_WIDTH = 640;
const MIN_HEIGHT = 360;
const MIN_AREA = 640 * 360;

const ALLOWED_IMAGE_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "thumb.wikimedia.org",
]);

export function isAllowedImageHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
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

/** Keep only high-definition, content-relevant images — no ads, logos, or UI chrome. */
export function filterHdRelevantImages(images: EvidenceImage[]): EvidenceImage[] {
  const seen = new Set<string>();
  const out: EvidenceImage[] = [];
  for (const img of images) {
    const url = cleanImageUrl(img.url);
    if (!url || !isAllowedImageHost(url)) continue;
    if (BLOCKED_NAME.test(url) || BLOCKED_NAME.test(img.alt || "")) continue;
    if (img.width > 0 && img.height > 0) {
      if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) continue;
      if (img.width * img.height < MIN_AREA) continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ ...img, url });
  }
  return out.slice(0, 4);
}

/**
 * Fetch lead imagery via Wikipedia REST summary (allowlisted hosts only).
 * Rejects small thumbs, logos, and UI assets.
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
    const pick = data.originalimage?.source ? data.originalimage : data.thumbnail;
    if (!pick?.source) return null;
    const candidate: EvidenceImage = {
      url: pick.source,
      alt: data.title || pageTitle,
      width: Number(pick.width ?? 0),
      height: Number(pick.height ?? 0),
      credit: "Wikimedia / Wikipedia",
      sourceUrl: pageUrl,
    };
    return filterHdRelevantImages([candidate])[0] ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

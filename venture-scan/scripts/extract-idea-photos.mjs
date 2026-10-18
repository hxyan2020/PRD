#!/usr/bin/env node
/**
 * Build a photo album (1–9 images) for every catalog idea from reliable sources:
 *  1. Existing local idea-article images (wire coverage already vetted)
 *  2. Official website og:image / twitter:image + same-origin content images
 *
 * Wikipedia / Wikimedia are intentionally excluded — albums must come from the
 * startup’s official site or data-source articles only.
 *
 * Images are downloaded, lightly resized with sharp, and written under
 * public/idea-photos/{slug}/ with a manifest for the dossier UI.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "idea-photos");
const manifestPath = join(outDir, "manifest.json");
const articlesDir = join(root, "public", "idea-articles");
const articlesManifestPath = join(articlesDir, "manifest.json");
const ideasSnapshot = join(root, "public", "data", "ideas.json");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_PHOTOS = 9;
const MIN_PHOTOS = 1;
const MAX_BYTES = 900_000;
const MIN_BYTES = 4_000;

const TRUSTED_CDN = [
  /images\.unsplash\.com$/i,
  /cdn\.sanity\.io$/i,
  /cdn\.shopify\.com$/i,
  /res\.cloudinary\.com$/i,
  /images\.ctfassets\.net$/i,
  /cdn\.prod\.website-files\.com$/i,
  /uploads-ssl\.webflow\.com$/i,
  /imgix\.net$/i,
  /googleusercontent\.com$/i,
  /twimg\.com$/i,
  /linkedin\.com$/i,
  /licdn\.com$/i,
  /media\.licdn\.com$/i,
  /techcrunch\.com$/i,
  /wp\.com$/i,
  /cloudfront\.net$/i,
  /antora\.com$/i,
  /framerusercontent\.com$/i,
  /motherduck\.com$/i,
];

function loadIdeas() {
  const snap = JSON.parse(readFileSync(ideasSnapshot, "utf8"));
  return snap.ideas;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function resolveUrl(raw, base) {
  try {
    return new URL(raw.replace(/&amp;/g, "&"), base).href;
  } catch {
    return null;
  }
}

function isTrustedImageHost(host, siteHost) {
  if (!host) return false;
  if (siteHost && (host === siteHost || host.endsWith(`.${siteHost}`))) return true;
  return TRUSTED_CDN.some((re) => re.test(host));
}

function pickMetaImages(html, pageUrl) {
  const out = [];
  const metas = [
    [/property=["']og:image["'][^>]*content=["']([^"']+)["']/i, "official-og"],
    [/content=["']([^"']+)["'][^>]*property=["']og:image["']/i, "official-og"],
    [/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i, "official-twitter"],
    [/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i, "official-twitter"],
  ];
  for (const [re, kind] of metas) {
    const m = html.match(re);
    if (!m) continue;
    const url = resolveUrl(m[1], pageUrl);
    if (!url) continue;
    out.push({
      url,
      kind,
      caption: "Official site",
      sourceUrl: pageUrl,
    });
  }
  return out;
}

function pickContentImages(html, pageUrl, siteHost) {
  const out = [];
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 24) {
    const url = resolveUrl(m[1], pageUrl);
    if (!url || url.startsWith("data:")) continue;
    const host = hostnameOf(url);
    if (!isTrustedImageHost(host, siteHost)) continue;
    if (/\.svg(\?|$)/i.test(url)) continue;
    out.push({
      url,
      kind: "official-content",
      caption: "Official site",
      sourceUrl: pageUrl,
    });
  }
  return out;
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 18_000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBytes(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "image/*,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES || buf.length > 8_000_000) return null;
    return { buf, contentType: res.headers.get("content-type") };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function normalizeImage(buf) {
  try {
    const img = sharp(buf, { failOn: "none" });
    const meta = await img.metadata();
    if ((meta.width && meta.width < 160) || (meta.height && meta.height < 100)) {
      return null;
    }
    const out = await img
      .rotate()
      .resize({ width: 1280, height: 960, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    if (out.length < MIN_BYTES || out.length > MAX_BYTES) return null;
    return out;
  } catch {
    return null;
  }
}

function articlePhotosForSlug(slug, articlesManifest) {
  const rows = articlesManifest[slug] ?? [];
  return rows.slice(0, MAX_PHOTOS).map((a, i) => ({
    localFrom: join(articlesDir, slug, a.imageFile),
    kind: "media-coverage",
    caption: a.title,
    sourceUrl: a.url,
    sourceLabel: a.sourceId,
    preferIndex: i,
  }));
}

function dedupeCandidates(list) {
  const seen = new Set();
  const out = [];
  for (const c of list) {
    const key = (c.url || c.localFrom || "").split("?")[0].toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

async function buildAlbum(idea, articlesManifest) {
  const siteHost = hostnameOf(idea.website);
  const candidates = [];

  for (const a of articlePhotosForSlug(idea.slug, articlesManifest)) {
    candidates.push(a);
  }

  if (idea.website) {
    const html = await fetchText(idea.website);
    if (html) {
      candidates.push(...pickMetaImages(html, idea.website));
      candidates.push(...pickContentImages(html, idea.website, siteHost).slice(0, 12));
    }
  }

  const unique = dedupeCandidates(candidates);
  const albumDir = join(outDir, idea.slug);
  mkdirSync(albumDir, { recursive: true });

  const photos = [];
  let idx = 0;
  for (const c of unique) {
    if (photos.length >= MAX_PHOTOS) break;
    let jpeg = null;
    if (c.localFrom && existsSync(c.localFrom)) {
      jpeg = await normalizeImage(readFileSync(c.localFrom));
    } else if (c.url) {
      const fetched = await fetchBytes(c.url);
      if (fetched) jpeg = await normalizeImage(fetched.buf);
    }
    if (!jpeg) continue;
    const file = `${String(idx).padStart(2, "0")}.jpg`;
    writeFileSync(join(albumDir, file), jpeg);
    photos.push({
      id: `${idea.slug}-${idx}`,
      file,
      imagePath: `/idea-photos/${idea.slug}/${file}`,
      kind: c.kind,
      caption: c.caption || idea.name,
      sourceUrl: c.sourceUrl || idea.website || null,
      sourceLabel:
        c.sourceLabel ||
        (c.kind.startsWith("official")
          ? siteHost || "Official site"
          : c.kind === "media-coverage"
            ? "Media coverage"
            : "Source"),
      bytes: jpeg.length,
    });
    idx += 1;
  }

  return photos;
}

async function main() {
  const ideas = loadIdeas();
  const articlesManifest = existsSync(articlesManifestPath)
    ? JSON.parse(readFileSync(articlesManifestPath, "utf8"))
    : {};

  const only = process.env.PHOTO_SLUGS
    ? new Set(process.env.PHOTO_SLUGS.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  mkdirSync(outDir, { recursive: true });

  let previous = {};
  if (existsSync(manifestPath)) {
    try {
      previous = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      previous = {};
    }
  }

  const catalogSlugs = new Set(ideas.map((i) => i.slug));

  // Drop albums for ideas no longer in the catalog
  for (const name of readdirSync(outDir)) {
    if (name === "manifest.json") continue;
    if (!catalogSlugs.has(name)) {
      rmSync(join(outDir, name), { recursive: true, force: true });
    }
  }

  const manifest = {};
  for (const [slug, photos] of Object.entries(previous)) {
    if (!catalogSlugs.has(slug)) continue;
    // Strip any legacy Wikipedia entries from prior runs
    const cleaned = (photos || []).filter(
      (p) => p.kind !== "wikipedia" && !(p.sourceLabel || "").toLowerCase().includes("wikipedia"),
    );
    if (cleaned.length) manifest[slug] = cleaned;
  }

  const queue = ideas.filter((idea) => {
    if (only && !only.has(idea.slug)) return false;
    const existing = manifest[idea.slug] ?? [];
    return existing.length < MIN_PHOTOS || Boolean(only);
  });

  let withPhotos = 0;
  let totalPhotos = 0;
  const workers = 4;

  async function worker() {
    while (queue.length) {
      const idea = queue.shift();
      if (!idea) return;
      process.stdout.write(`photos ${idea.slug} … `);
      try {
        // Rebuild this slug folder fresh
        rmSync(join(outDir, idea.slug), { recursive: true, force: true });
        const photos = await buildAlbum(idea, articlesManifest);
        manifest[idea.slug] = photos;
        if (photos.length >= MIN_PHOTOS) {
          withPhotos += 1;
          totalPhotos += photos.length;
          console.log(`${photos.length} ok`);
        } else {
          console.log(`ONLY ${photos.length}`);
        }
      } catch (err) {
        console.log(`FAIL ${err?.message || err}`);
        manifest[idea.slug] = [];
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));

  // Recount after merge
  withPhotos = 0;
  totalPhotos = 0;
  for (const idea of ideas) {
    const photos = manifest[idea.slug] ?? [];
    if (photos.length >= MIN_PHOTOS) {
      withPhotos += 1;
      totalPhotos += photos.length;
    }
  }

  // Keep only catalog keys
  const finalManifest = {};
  for (const idea of ideas) {
    finalManifest[idea.slug] = manifest[idea.slug] ?? [];
  }

  writeFileSync(manifestPath, JSON.stringify(finalManifest, null, 2) + "\n");
  const missing = ideas.filter((i) => (finalManifest[i.slug] ?? []).length < MIN_PHOTOS).map((i) => i.slug);
  console.log(
    JSON.stringify(
      {
        ideas: ideas.length,
        withPhotos,
        totalPhotos,
        missingCount: missing.length,
        missing: missing.slice(0, 30),
        rebuilt: only ? [...only] : "gaps-only",
        manifest: manifestPath,
      },
      null,
      2,
    ),
  );
  if (missing.length) process.exitCode = 2;
}

main();

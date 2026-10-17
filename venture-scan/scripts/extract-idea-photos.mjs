#!/usr/bin/env node
/**
 * Build a photo album (1–9 images) for every catalog idea from reliable sources:
 *  1. Existing local idea-article images (wire coverage already vetted)
 *  2. Official website og:image / twitter:image + same-origin content images
 *  3. Wikimedia Commons / Wikipedia summary thumbnail when the brand is notable
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
import { dirname, extname, join } from "node:path";
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
  "Mozilla/5.0 (compatible; VentureScanPhotoBot/1.0; +https://hxyan2020.github.io/PRD/venture-scan/)";
const MAX_PHOTOS = 9;
const MIN_PHOTOS = 1;
const MAX_BYTES = 900_000;
const MIN_BYTES = 4_000;

/** Optional Wikipedia titles for well-known operator brands (hostname → page). */
const WIKI_BY_HOST = {
  "personio.com": "Personio",
  "bytedance.com": "ByteDance",
  "grab.com": "Grab_(company)",
  "stripe.com": "Stripe,_Inc.",
  "databricks.com": "Databricks",
  "openai.com": "OpenAI",
  "notion.so": "Notion_(productivity_software)",
  "canva.com": "Canva",
  "shopify.com": "Shopify",
  "spotify.com": "Spotify",
  "airbnb.com": "Airbnb",
  "uber.com": "Uber",
  "nubank.com.br": "Nubank",
  "revolut.com": "Revolut",
  "klarna.com": "Klarna",
  "figma.com": "Figma_(software)",
  "gitlab.com": "GitLab",
  "hashicorp.com": "HashiCorp",
  "snowflake.com": "Snowflake_Inc.",
  "cloudflare.com": "Cloudflare",
  "twilio.com": "Twilio",
  "zendesk.com": "Zendesk",
  "hubspot.com": "HubSpot",
  "atlassian.com": "Atlassian",
  "asana.com": "Asana,_Inc.",
  "monday.com": "Monday.com",
  "intercom.com": "Intercom_(company)",
  "miro.com": "Miro_(collaboration_platform)",
  "webflow.com": "Webflow",
  "vercel.com": "Vercel",
  "supabase.com": "Supabase",
  "anthropic.com": "Anthropic",
  "mistral.ai": "Mistral_AI",
  "deepmind.google": "Google_DeepMind",
  "tesla.com": "Tesla,_Inc.",
  "rivian.com": "Rivian",
  "gogoro.com": "Gogoro",
  "classdojo.com": "ClassDojo",
  "ambiencehealthcare.com": "Ambience_Healthcare",
};

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
  /wikimedia\.org$/i,
  /wikipedia\.org$/i,
  /twimg\.com$/i,
  /linkedin\.com$/i,
  /licdn\.com$/i,
  /media\.licdn\.com$/i,
  /techcrunch\.com$/i,
  /wp\.com$/i,
  /cloudfront\.net$/i,
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

function pickMetaImages(html, baseUrl) {
  const out = [];
  const patterns = [
    /property=["']og:image(?::url)?["']\s+content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["']\s+property=["']og:image(?::url)?["']/gi,
    /name=["']twitter:image(?::src)?["']\s+content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["']\s+name=["']twitter:image(?::src)?["']/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) {
      const href = resolveUrl(m[1], baseUrl);
      if (href) out.push({ url: href, kind: "official-og", caption: "Official website" });
    }
  }
  return out;
}

function pickContentImages(html, baseUrl, siteHost) {
  const out = [];
  const re = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const href = resolveUrl(m[1], baseUrl);
    if (!href) continue;
    if (/data:|svg\+xml|sprite|icon|logo\.svg|1x1|pixel|tracking|badge/i.test(href + tag)) {
      continue;
    }
    const w = Number(tag.match(/\bwidth=["']?(\d+)/i)?.[1] ?? 0);
    const h = Number(tag.match(/\bheight=["']?(\d+)/i)?.[1] ?? 0);
    if ((w && w < 120) || (h && h < 80)) continue;
    const host = hostnameOf(href);
    const sameOrigin =
      host === siteHost || host.endsWith(`.${siteHost}`) || siteHost.endsWith(`.${host}`);
    const trusted = TRUSTED_CDN.some((r) => r.test(host));
    if (!sameOrigin && !trusted) continue;
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
    out.push({
      url: href,
      kind: sameOrigin ? "official-site" : "cdn",
      caption: alt || "Official website",
    });
  }
  return out;
}

async function fetchText(url, timeoutMs = 18000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
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

async function fetchBytes(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "image/*,*/*;q=0.8" },
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

async function wikiThumbnail(title) {
  const api = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(api, { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const json = await res.json();
    const src = json.originalimage?.source || json.thumbnail?.source;
    if (!src) return null;
    return {
      url: src,
      kind: "wikipedia",
      caption: `Wikipedia · ${json.title ?? title}`,
      sourceUrl: json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${title}`,
    };
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

  const wikiTitle = WIKI_BY_HOST[siteHost];
  if (wikiTitle) {
    const thumb = await wikiThumbnail(wikiTitle);
    if (thumb) candidates.push(thumb);
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
        (c.kind === "wikipedia"
          ? "Wikipedia"
          : c.kind.startsWith("official")
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

  mkdirSync(outDir, { recursive: true });
  // Clean previous slug folders but keep outDir
  for (const name of readdirSync(outDir)) {
    if (name === "manifest.json") continue;
    rmSync(join(outDir, name), { recursive: true, force: true });
  }

  const manifest = {};
  let withPhotos = 0;
  let totalPhotos = 0;

  // Bound concurrency
  const queue = [...ideas];
  const workers = 4;
  async function worker() {
    while (queue.length) {
      const idea = queue.shift();
      if (!idea) return;
      process.stdout.write(`photos ${idea.slug} … `);
      try {
        const photos = await buildAlbum(idea, articlesManifest);
        if (photos.length >= MIN_PHOTOS) {
          manifest[idea.slug] = photos;
          withPhotos += 1;
          totalPhotos += photos.length;
          console.log(`${photos.length} ok`);
        } else {
          manifest[idea.slug] = photos;
          console.log(`ONLY ${photos.length}`);
        }
      } catch (err) {
        console.log(`FAIL ${err?.message || err}`);
        manifest[idea.slug] = [];
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));

  // Second pass: ideas still empty — try website again more aggressively / wiki by name
  for (const idea of ideas) {
    if ((manifest[idea.slug] ?? []).length >= MIN_PHOTOS) continue;
    const host = hostnameOf(idea.website);
    const wiki =
      (await wikiThumbnail(idea.name.replace(/\s+/g, "_"))) ||
      (host ? await wikiThumbnail(host.split(".")[0]) : null);
    if (!wiki) continue;
    const fetched = await fetchBytes(wiki.url);
    if (!fetched) continue;
    const jpeg = await normalizeImage(fetched.buf);
    if (!jpeg) continue;
    const albumDir = join(outDir, idea.slug);
    mkdirSync(albumDir, { recursive: true });
    const file = "00.jpg";
    writeFileSync(join(albumDir, file), jpeg);
    manifest[idea.slug] = [
      {
        id: `${idea.slug}-0`,
        file,
        imagePath: `/idea-photos/${idea.slug}/${file}`,
        kind: "wikipedia",
        caption: wiki.caption,
        sourceUrl: wiki.sourceUrl,
        sourceLabel: "Wikipedia",
        bytes: jpeg.length,
      },
    ];
    withPhotos += 1;
    totalPhotos += 1;
    console.log(`fallback wiki ${idea.slug}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const missing = ideas.filter((i) => (manifest[i.slug] ?? []).length < MIN_PHOTOS).map((i) => i.slug);
  console.log(
    JSON.stringify(
      {
        ideas: ideas.length,
        withPhotos,
        totalPhotos,
        missingCount: missing.length,
        missing: missing.slice(0, 30),
        manifest: manifestPath,
      },
      null,
      2,
    ),
  );
  if (missing.length) process.exitCode = 2;
}

main();

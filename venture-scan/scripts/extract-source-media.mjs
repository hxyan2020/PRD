#!/usr/bin/env node
/**
 * Extract brand / OG images from each data-source homepage and store them
 * under public/source-media/ for idea dossier galleries.
 *
 * Priority per source:
 *  1. og:image / twitter:image from the source homepage
 *  2. icon.horse brand tile
 *  3. Google favicon sz=256
 *  4. Existing local /logos/{id}.png fallback (copied)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "source-media");
const logosDir = join(root, "public", "logos");
const manifestPath = join(outDir, "manifest.json");

mkdirSync(outDir, { recursive: true });

/** Minimal parse of data-sources.ts without a TS loader. */
function loadSources() {
  const text = readFileSync(join(root, "lib", "data-sources.ts"), "utf8");
  const sources = [];
  const objects = text.match(/\{\s*id:\s*"[^"]+"[\s\S]*?\n\s*\},?/g) ?? [];
  for (const obj of objects) {
    const id = obj.match(/id:\s*"([^"]+)"/)?.[1];
    const name = obj.match(/name:\s*"([^"]+)"/)?.[1];
    const url = obj.match(/url:\s*"([^"]+)"/)?.[1];
    const logoDomain = obj.match(/logoDomain:\s*"([^"]+)"/)?.[1];
    if (id && name && url && logoDomain) {
      sources.push({ id, name, url, logoDomain });
    }
  }
  return sources;
}

function pickMetaImage(html, baseUrl) {
  const patterns = [
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
    /property=["']og:image:url["']\s+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      try {
        return new URL(m[1].replace(/&amp;/g, "&"), baseUrl).href;
      } catch {
        /* continue */
      }
    }
  }
  return null;
}

function extFromContentType(ct, url) {
  const lower = (ct ?? "").toLowerCase();
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("svg")) return ".svg";
  if (lower.includes("icon") || lower.includes("x-icon")) return ".ico";
  if (lower.includes("png")) return ".png";
  const fromUrl = extname(new URL(url).pathname).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico"].includes(fromUrl)) {
    return fromUrl === ".jpeg" ? ".jpg" : fromUrl;
  }
  return ".png";
}

async function fetchBytes(url, { timeoutMs = 20000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "VentureScanMediaBot/1.0 (+https://hxyan2020.github.io/PRD/venture-scan/; research)",
        Accept: "image/*,text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, contentType: res.headers.get("content-type"), finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function tryOgImage(source) {
  try {
    const page = await fetchBytes(source.url, { timeoutMs: 18000 });
    const html = page.buf.toString("utf8");
    const imageUrl = pickMetaImage(html, page.finalUrl || source.url);
    if (!imageUrl) return null;
    const img = await fetchBytes(imageUrl, { timeoutMs: 18000 });
    if (img.buf.length < 800) return null;
    // Keep dossier galleries lean — skip huge marketing heroes
    if (img.buf.length > 350_000) return null;
    // Reject HTML error pages
    const head = img.buf.slice(0, 32).toString("utf8").toLowerCase();
    if (head.includes("<!doctype") || head.includes("<html")) return null;
    return { ...img, kind: "og", imageUrl };
  } catch {
    return null;
  }
}

async function tryIconHorse(source) {
  try {
    const img = await fetchBytes(`https://icon.horse/icon/${source.logoDomain}`, {
      timeoutMs: 15000,
    });
    if (img.buf.length < 600) return null;
    return { ...img, kind: "icon", imageUrl: `https://icon.horse/icon/${source.logoDomain}` };
  } catch {
    return null;
  }
}

async function tryGoogleFavicon(source) {
  try {
    const imageUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(source.logoDomain)}&sz=256`;
    const img = await fetchBytes(imageUrl, { timeoutMs: 12000 });
    if (img.buf.length < 200) return null;
    return { ...img, kind: "favicon", imageUrl };
  } catch {
    return null;
  }
}

function copyLocalLogo(source) {
  for (const ext of [".png", ".svg", ".jpg"]) {
    const src = join(logosDir, `${source.id}${ext}`);
    if (existsSync(src)) {
      const dest = join(outDir, `${source.id}${ext}`);
      copyFileSync(src, dest);
      return { file: `${source.id}${ext}`, kind: "logo-fallback", bytes: readFileSync(src).length };
    }
  }
  return null;
}

async function extractOne(source) {
  if (source.id === "offline-probe") {
    const fallback = copyLocalLogo(source);
    return fallback
      ? { id: source.id, name: source.name, ...fallback, imageUrl: null }
      : null;
  }

  const candidates = [tryOgImage, tryIconHorse, tryGoogleFavicon];
  for (const attempt of candidates) {
    const result = await attempt(source);
    if (!result) continue;
    const ext = extFromContentType(result.contentType, result.imageUrl);
    const file = `${source.id}${ext}`;
    const dest = join(outDir, file);
    writeFileSync(dest, result.buf);
    return {
      id: source.id,
      name: source.name,
      file,
      kind: result.kind,
      bytes: result.buf.length,
      imageUrl: result.imageUrl,
      contentType: result.contentType,
    };
  }

  const fallback = copyLocalLogo(source);
  if (fallback) {
    return { id: source.id, name: source.name, ...fallback, imageUrl: null };
  }
  return null;
}

async function main() {
  const sources = loadSources();
  console.log(`Extracting media for ${sources.length} data sources…`);
  const manifest = {};
  for (const source of sources) {
    process.stdout.write(`  ${source.id}… `);
    try {
      const entry = await extractOne(source);
      if (entry) {
        manifest[source.id] = entry;
        console.log(`${entry.kind} → ${entry.file} (${entry.bytes}b)`);
      } else {
        console.log("FAILED");
      }
    } catch (err) {
      console.log(`ERROR ${err.message}`);
    }
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${Object.keys(manifest).length} entries → ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

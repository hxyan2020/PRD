#!/usr/bin/env node
/**
 * Match real wire articles to each seed idea, scrape article OG/content images,
 * and write public/idea-articles/{slug}/ + manifest.json for dossier galleries.
 *
 * Sources: RSS feeds from DATA_SOURCES desks. Links are specific article URLs
 * (never desk homepages). Images are downloaded locally so the UI can embed them.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "idea-articles");
const manifestPath = join(outDir, "manifest.json");
const seedPath = join(root, "lib", "seed-ideas.ts");

const FEEDS = [
  { sourceId: "techcrunch", feed: "https://techcrunch.com/feed/" },
  { sourceId: "crunchbase-news", feed: "https://news.crunchbase.com/feed/" },
  { sourceId: "rest-of-world", feed: "https://www.restofworld.org/feed/" },
  { sourceId: "sifted", feed: "https://sifted.eu/feed" },
  { sourceId: "eu-startups", feed: "https://www.eu-startups.com/feed/" },
  { sourceId: "inc42", feed: "https://inc42.com/feed/" },
  { sourceId: "yourstory", feed: "https://yourstory.com/feed" },
  { sourceId: "techinasia", feed: "https://www.techinasia.com/feed" },
  { sourceId: "pulse-ng", feed: "https://techcabal.com/feed/" },
  { sourceId: "contxto", feed: "https://contxto.com/en/feed/" },
  { sourceId: "venturebeat", feed: "https://venturebeat.com/feed/" },
  { sourceId: "gruenderszene", feed: "https://www.gruenderszene.de/feed" },
];

/** Explicit topic keywords per idea for tighter article matching. */
const IDEA_TOPIC_KEYWORDS = {
  "reef-credit-exchange": [
    "climate",
    "carbon",
    "biodiversity",
    "ocean",
    "blue",
    "sustainab",
    "green",
    "energy",
    "asia",
    "singapore",
  ],
  "nightshift-nursing-ai": [
    "health",
    "hospital",
    "care",
    "medical",
    "ai",
    "clinic",
    "biotech",
    "nurse",
  ],
  "kiln-microfactory": [
    "hardware",
    "manufactur",
    "robot",
    "industrial",
    "3d",
    "factory",
    "europe",
    "germany",
  ],
  "farmstack-coldchain": [
    "agricult",
    "farm",
    "food",
    "supply",
    "logistics",
    "africa",
    "climate",
    "cold",
  ],
  "elderloop-companion": [
    "health",
    "care",
    "aging",
    "elder",
    "consumer",
    "japan",
    "asia",
    "medical",
  ],
  "ledgerlane-freight": [
    "logistics",
    "trade",
    "freight",
    "india",
    "supply",
    "export",
    "fintech",
    "saas",
  ],
  "playpane-classroom": [
    "edtech",
    "education",
    "school",
    "learning",
    "kids",
    "uk",
    "europe",
  ],
  "voltpath-depot": [
    "ev",
    "electric",
    "battery",
    "mobility",
    "indonesia",
    "asia",
    "fleet",
    "energy",
  ],
  "cuecraft-ads": [
    "marketing",
    "ads",
    "advertis",
    "creative",
    "generative",
    "ai",
    "brand",
  ],
  "harbor-legal-ops": [
    "legal",
    "saas",
    "software",
    "compliance",
    "dubai",
    "visa",
    "immigration",
  ],
  "spore-kitchen": [
    "food",
    "protein",
    "climate",
    "ferment",
    "agricult",
    "europe",
    "sustainab",
  ],
  "meshpay-remit": [
    "fintech",
    "payment",
    "remit",
    "bank",
    "brazil",
    "latam",
    "stablecoin",
    "pay",
  ],
  "bushfire-mesh-sensors": [
    "climate",
    "australia",
    "sensor",
    "disaster",
    "fire",
    "energy",
    "insurance",
  ],
  "hanok-energy-retrofit": [
    "energy",
    "climate",
    "korea",
    "housing",
    "retrofit",
    "green",
    "heat",
  ],
  "atelier-carbon-ledger": [
    "climate",
    "carbon",
    "esg",
    "sustainab",
    "france",
    "europe",
    "supply",
  ],
  "mercado-voice-pos": [
    "fintech",
    "payment",
    "mexico",
    "latam",
    "pos",
    "smb",
    "merchant",
    "voice",
  ],
  "cape-clinic-triage": [
    "health",
    "africa",
    "clinic",
    "care",
    "mobile",
    "south africa",
    "hospital",
  ],
  "fjord-battery-secondlife": [
    "battery",
    "energy",
    "europe",
    "nordic",
    "sweden",
    "ev",
    "climate",
    "circular",
  ],
  "saigon-microgrid-coops": [
    "energy",
    "solar",
    "vietnam",
    "asia",
    "grid",
    "climate",
    "power",
  ],
  "iron-dome-devsecops": [
    "security",
    "cyber",
    "ai",
    "israel",
    "software",
    "devsec",
    "cloud",
  ],
};
const UA =
  "Mozilla/5.0 (compatible; VentureScanMediaBot/1.1; +https://hxyan2020.github.io/PRD/venture-scan/)";

function loadIdeas() {
  const text = readFileSync(seedPath, "utf8");
  const ideas = [];
  const blocks = text.split(/\{\s*id:\s*"idea_/).slice(1);
  for (const block of blocks) {
    const slug = block.match(/slug:\s*"([^"]+)"/)?.[1];
    const name = block.match(/name:\s*"([^"]+)"/)?.[1];
    const industry = block.match(/industry:\s*"([^"]+)"/)?.[1];
    const sector = block.match(/sector:\s*"([^"]+)"/)?.[1];
    const teamCountry = block.match(/teamCountry:\s*"([^"]+)"/)?.[1];
    const tags =
      block
        .match(/tags:\s*\[([^\]]*)\]/)?.[1]
        ?.match(/"([^"]+)"/g)
        ?.map((s) => s.replace(/"/g, "")) ?? [];
    const source = block.match(/source:\s*"([^"]+)"/)?.[1] ?? "";
    if (slug && name) {
      ideas.push({ slug, name, industry, sector, teamCountry, tags, source });
    }
  }
  return ideas;
}

async function fetchText(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "application/rss+xml,application/xml,text/xml,text/html,*/*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { text: await res.text(), finalUrl: res.url };
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
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "image/*,*/*;q=0.8" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, contentType: res.headers.get("content-type"), finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

function decodeXml(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function parseFeed(xml, sourceId) {
  const items = [];
  const chunks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  for (const chunk of chunks.slice(0, 25)) {
    const title = decodeXml(chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    let link =
      decodeXml(chunk.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "") ||
      chunk.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ||
      "";
    link = link.split("?")[0]; // strip tracking
    const summary = decodeXml(
      chunk.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
        chunk.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ??
        chunk.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
        "",
    )
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
    const image =
      chunk.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] ||
      chunk.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i)?.[1] ||
      chunk.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
      null;
    if (title && link && /^https?:\/\//i.test(link)) {
      items.push({ sourceId, title, url: link, excerpt: summary, rssImage: image });
    }
  }
  return items;
}

function pickMetaImage(html, baseUrl) {
  const patterns = [
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /name=["']twitter:image(?::src)?["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+name=["']twitter:image(?::src)?["']/i,
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
  // First large-ish content image
  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  for (const src of imgs) {
    if (/logo|avatar|sprite|icon|emoji|1x1|pixel/i.test(src)) continue;
    try {
      return new URL(src.replace(/&amp;/g, "&"), baseUrl).href;
    } catch {
      /* continue */
    }
  }
  return null;
}

function extFrom(ct, url) {
  const lower = (ct ?? "").toLowerCase();
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("png")) return ".png";
  const fromUrl = extname(new URL(url).pathname).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(fromUrl)) {
    return fromUrl === ".jpeg" ? ".jpg" : fromUrl;
  }
  return ".jpg";
}

function ideaKeywords(idea) {
  return IDEA_TOPIC_KEYWORDS[idea.slug] ?? [
    idea.industry,
    idea.sector,
    idea.teamCountry,
    ...idea.tags,
  ].map((x) => String(x).toLowerCase());
}

function scoreArticle(idea, article) {
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  let score = 0;
  for (const kw of ideaKeywords(idea)) {
    if (text.includes(kw)) score += kw.length > 5 ? 4 : 2;
  }
  if (idea.source.includes("eu") && (article.sourceId === "sifted" || article.sourceId === "eu-startups")) {
    score += 2;
  }
  if (idea.source.includes("india") && (article.sourceId === "inc42" || article.sourceId === "yourstory")) {
    score += 3;
  }
  if (idea.source.includes("africa") || idea.source.includes("za")) {
    if (article.sourceId === "pulse-ng" || article.sourceId === "africarena") score += 3;
  }
  if (idea.source.includes("latam") || idea.source.includes("mx")) {
    if (article.sourceId === "contxto") score += 3;
  }
  if (idea.source.includes("sea") || idea.source.includes("vn") || idea.source.includes("apac")) {
    if (article.sourceId === "techinasia" || article.sourceId === "krasia") score += 2;
  }
  if (idea.source.includes("na") || idea.source.includes("us")) {
    if (article.sourceId === "techcrunch" || article.sourceId === "crunchbase-news") score += 1;
  }
  return score;
}

async function resolveArticleImage(article) {
  if (article.rssImage) {
    try {
      const img = await fetchBytes(article.rssImage);
      if (img.buf.length >= 1500 && img.buf.length <= 900_000) {
        const head = img.buf.slice(0, 32).toString("utf8").toLowerCase();
        if (!head.includes("<!doctype") && !head.includes("<html")) {
          return { ...img, imageUrl: article.rssImage, kind: "rss" };
        }
      }
    } catch {
      /* fall through */
    }
  }
  try {
    const page = await fetchText(article.url, 18000);
    const imageUrl = pickMetaImage(page.text, page.finalUrl || article.url);
    if (!imageUrl) return null;
    const img = await fetchBytes(imageUrl);
    if (img.buf.length < 1500 || img.buf.length > 900_000) return null;
    const head = img.buf.slice(0, 32).toString("utf8").toLowerCase();
    if (head.includes("<!doctype") || head.includes("<html")) return null;
    return { ...img, imageUrl, kind: "og" };
  } catch {
    return null;
  }
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const ideas = loadIdeas();
  console.log(`Loaded ${ideas.length} ideas`);

  const pool = [];
  for (const feed of FEEDS) {
    process.stdout.write(`Feed ${feed.sourceId}… `);
    try {
      const { text } = await fetchText(feed.feed, 20000);
      const items = parseFeed(text, feed.sourceId);
      console.log(`${items.length} articles`);
      pool.push(...items);
    } catch (err) {
      console.log(`FAIL ${err.message}`);
    }
  }
  console.log(`Article pool: ${pool.length}`);

  // Deduplicate by URL
  const seen = new Set();
  const unique = [];
  for (const a of pool) {
    if (seen.has(a.url)) continue;
    seen.add(a.url);
    unique.push(a);
  }

  const usedUrls = new Set();
  const manifest = {};

  for (const idea of ideas) {
    const ranked = unique
      .map((a) => ({ a, score: scoreArticle(idea, a) }))
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score || x.a.title.localeCompare(y.a.title));

    // Prefer unused URLs, but allow reuse if pool is thin
    const picks = [];
    for (const row of ranked) {
      if (picks.length >= 3) break;
      if (usedUrls.has(row.a.url) && picks.length < 2) continue;
      picks.push(row.a);
      usedUrls.add(row.a.url);
    }
    // Ensure at least 2 by relaxing uniqueness
    if (picks.length < 2) {
      for (const row of ranked) {
        if (picks.length >= 2) break;
        if (picks.some((p) => p.url === row.a.url)) continue;
        picks.push(row.a);
      }
    }

    const ideaDir = join(outDir, idea.slug);
    if (existsSync(ideaDir)) rmSync(ideaDir, { recursive: true, force: true });
    mkdirSync(ideaDir, { recursive: true });

    const articles = [];
    let idx = 0;
    for (const article of picks) {
      process.stdout.write(`  ${idea.slug} ← ${article.sourceId}: ${article.title.slice(0, 48)}… `);
      try {
        const media = await resolveArticleImage(article);
        if (!media) {
          console.log("no image, skip");
          continue;
        }
        const ext = extFrom(media.contentType, media.imageUrl);
        const file = `${String(idx).padStart(2, "0")}${ext}`;
        writeFileSync(join(ideaDir, file), media.buf);
        articles.push({
          id: `${idea.slug}-${idx}`,
          title: article.title,
          url: article.url,
          sourceId: article.sourceId,
          excerpt: article.excerpt || article.title,
          imageFile: file,
          imagePath: `/idea-articles/${idea.slug}/${file}`,
          imageKind: media.kind,
          bytes: media.buf.length,
        });
        console.log(`${media.kind} ${media.buf.length}b`);
        idx += 1;
        if (articles.length >= 3) break;
      } catch (err) {
        console.log(`ERR ${err.message}`);
      }
    }
    manifest[idea.slug] = articles;
    console.log(`  → ${articles.length} articles for ${idea.slug}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const total = Object.values(manifest).reduce((n, a) => n + a.length, 0);
  console.log(`Wrote manifest with ${total} articles → ${manifestPath}`);

  const thin = Object.entries(manifest).filter(([, a]) => a.length < 1);
  if (thin.length) {
    console.warn(
      `WARNING: ${thin.length} ideas have no articles: ${thin.map(([s]) => s).join(", ")}`,
    );
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

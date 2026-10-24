#!/usr/bin/env node
/**
 * Match real wire articles to each seed idea, scrape article OG/content images,
 * and write public/idea-articles/{slug}/ + manifest.json for dossier galleries.
 *
 * Matching strategy (relevance-first):
 *  1. Prefer curated topic-locked URLs in curated-idea-articles.json
 *  2. Optionally fill gaps from RSS only when EVERY required keyword group hits
 *     and no exclude keyword is present (never assign off-topic solar → reef, etc.)
 *
 * Links are specific article URLs (never desk homepages). Images are downloaded
 * locally so the UI can embed them.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "idea-articles");
const manifestPath = join(outDir, "manifest.json");
const seedPath = join(root, "lib", "seed-ideas.ts");
const curatedPath = join(__dirname, "curated-idea-articles.json");

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

/**
 * Strict relevance rules for RSS fallback.
 * Each idea must match ALL groups (at least one term per group) and none of exclude.
 */
const IDEA_MATCH_RULES = {
  "reef-credit-exchange": {
    requireGroups: [["coral", "reef", "ocean", "seagrass", "marine", "blue carbon", "biodiversity"]],
    exclude: ["solar energy in colombia", "erco"],
  },
  "nightshift-nursing-ai": {
    requireGroups: [
      ["hospital", "nurse", "nursing", "clinician", "clinical", "doctor", "healthcare", "health care"],
      ["ai", "ambient", "scribe", "notes", "copilot", "co-pilot"],
    ],
  },
  "kiln-microfactory": {
    requireGroups: [
      ["microfactory", "manufactur", "3d print", "factory", "fabrication", "machining"],
      ["robot", "hardware", "industrial", "precision"],
    ],
  },
  "farmstack-coldchain": {
    requireGroups: [["cold chain", "cold-chain", "cold storage", "refrigerat", "perishable", "spoilage"]],
  },
  "elderloop-companion": {
    requireGroups: [["elder", "aging", "ageing", "senior", "older adult", "loneliness"]],
  },
  "ledgerlane-freight": {
    requireGroups: [
      ["freight", "logistics", "customs", "export", "import", "trade", "cross-border", "cross border"],
      ["india", "indian", "msme", "sme"],
    ],
  },
  "playpane-classroom": {
    requireGroups: [["stem", "classroom", "edtech", "education", "school", "learning kit", "robotics kit"]],
  },
  "voltpath-depot": {
    requireGroups: [["battery swap", "battery-swapping", "swapping", "ev", "electric scooter", "two-wheeler"]],
  },
  "cuecraft-ads": {
    requireGroups: [["ad", "advertis", "creative", "marketing"], ["ai", "generat", "automat"]],
  },
  "harbor-legal-ops": {
    requireGroups: [["immigration", "visa", "green card", "relocation"], ["legal", "law", "attorney", "saas"]],
  },
  "spore-kitchen": {
    requireGroups: [["fermentation", "alternative protein", "animal-free", "dairy protein", "casein", "alt protein"]],
  },
  "meshpay-remit": {
    requireGroups: [["remit", "cross-border", "money transfer", "stablecoin", "usdc", "payment"], ["latin", "brazil", "mexico", "latam"]],
  },
  "bushfire-mesh-sensors": {
    requireGroups: [["wildfire", "bushfire", "forest fire", "fire detection"]],
  },
  "hanok-energy-retrofit": {
    requireGroups: [["heat pump", "retrofit", "renovation", "building emission", "insulation", "residential energy"]],
  },
  "atelier-carbon-ledger": {
    requireGroups: [["carbon", "scope 3", "esg", "emission"], ["fashion", "apparel", "supply chain", "accounting"]],
  },
  "mercado-voice-pos": {
    requireGroups: [["pos", "point of sale", "merchant", "payment", "smb", "tienda"], ["mexico", "mexican", "voice", "latin"]],
  },
  "cape-clinic-triage": {
    requireGroups: [["health", "clinic", "telehealth", "triage", "hospital", "care"], ["africa", "ghana", "south africa", "whatsapp"]],
  },
  "fjord-battery-secondlife": {
    requireGroups: [["second-life", "second life", "battery recycling", "repurpos", "circular"], ["battery", "ev"]],
  },
  "saigon-microgrid-coops": {
    requireGroups: [["solar", "mini-grid", "minigrid", "microgrid", "distributed energy", "rooftop solar"]],
  },
  "iron-dome-devsecops": {
    requireGroups: [["devops", "devsecops", "supply chain", "sbom", "pbom", "pipeline", "cyber", "security"], ["code", "software", "cloud"]],
  },
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

function loadCurated() {
  if (!existsSync(curatedPath)) return {};
  const raw = JSON.parse(readFileSync(curatedPath, "utf8"));
  const out = {};
  for (const [slug, entries] of Object.entries(raw)) {
    if (slug.startsWith("_")) continue;
    if (!Array.isArray(entries)) continue;
    out[slug] = entries.filter((e) => e?.url && e?.sourceId);
  }
  return out;
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
    link = link.split("?")[0];
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

function pickMeta(html, prop) {
  const patterns = [
    new RegExp(`property=["']${prop}["']\\s+content=["']([^"']+)["']`, "i"),
    new RegExp(`content=["']([^"']+)["']\\s+property=["']${prop}["']`, "i"),
    new RegExp(`name=["']${prop}["']\\s+content=["']([^"']+)["']`, "i"),
    new RegExp(`content=["']([^"']+)["']\\s+name=["']${prop}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].replace(/&amp;/g, "&").trim();
  }
  return null;
}

function pickMetaImage(html, baseUrl) {
  const raw =
    pickMeta(html, "og:image") ||
    pickMeta(html, "twitter:image") ||
    pickMeta(html, "twitter:image:src");
  if (raw) {
    try {
      return new URL(raw, baseUrl).href;
    } catch {
      /* continue */
    }
  }
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

function articlePassesRules(slug, title, excerpt) {
  const rules = IDEA_MATCH_RULES[slug];
  if (!rules) return false;
  const text = `${title} ${excerpt}`.toLowerCase();
  for (const group of rules.requireGroups ?? []) {
    if (!group.some((term) => text.includes(term.toLowerCase()))) return false;
  }
  for (const bad of rules.exclude ?? []) {
    if (text.includes(bad.toLowerCase())) return false;
  }
  return true;
}

function scoreArticle(idea, article) {
  if (!articlePassesRules(idea.slug, article.title, article.excerpt)) return 0;
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  let score = 10;
  for (const tag of idea.tags) {
    if (text.includes(String(tag).toLowerCase())) score += 2;
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
  return score;
}

async function hydrateFromPage(url, sourceId) {
  const page = await fetchText(url, 20000);
  const titleRaw =
    pickMeta(page.text, "og:title") ||
    decodeXml(page.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ||
    url;
  const title = decodeHtmlEntities(titleRaw)
    .replace(/\s*[|–-]\s*(TechCrunch|TechCabal|Inc42).*/i, "")
    .trim();
  const excerpt = decodeHtmlEntities(
    pickMeta(page.text, "og:description") ||
      pickMeta(page.text, "description") ||
      title,
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
  const imageUrl = pickMetaImage(page.text, page.finalUrl || url);
  return {
    sourceId,
    title: title || decodeHtmlEntities(titleRaw),
    url: (page.finalUrl || url).split("?")[0],
    excerpt,
    rssImage: imageUrl,
  };
}

const MIN_IMAGE_BYTES = 12_000;
const MAX_IMAGE_BYTES = 2_500_000;

function decodeHtmlEntities(s) {
  return String(s ?? "")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function isSiteChromeImage(url) {
  return /logo|avatar|sprite|icon|emoji|1x1|pixel|lockup|\.svg|gravatar|wp-includes|\/themes\/|disrupt\d|tc-lockup|favicon|apple-touch/i.test(
    url,
  );
}

function imageCandidatesFromHtml(html, baseUrl, preferred) {
  const urls = [];
  if (preferred && !isSiteChromeImage(preferred)) urls.push(preferred);
  const og = pickMetaImage(html, baseUrl);
  if (og && !isSiteChromeImage(og)) urls.push(og);
  // Prefer WordPress resized variants when originals 404.
  for (const u of [...urls]) {
    if (/wp-content\/uploads/i.test(u) && !/[?&](w|resize)=/i.test(u)) {
      urls.push(u.includes("?") ? `${u}&w=1200` : `${u}?w=1200`);
      urls.push(u.replace(/\.(jpe?g|png|webp)(\?.*)?$/i, "-1200x675.$1"));
    }
  }
  // Only pull in-article media from known upload CDNs — never site chrome / promo banners.
  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  for (const src of imgs) {
    if (isSiteChromeImage(src)) continue;
    if (!/(wp-content\/uploads|mjedge\.net\/wp-content|images\.unsplash|cdn\.|cloudfront)/i.test(src)) {
      continue;
    }
    if (/[?&]w=(?:1\d{2}|[1-9]\d)\b/i.test(src)) continue; // skip tiny resized thumbs
    try {
      urls.push(new URL(src.replace(/&amp;/g, "&"), baseUrl).href);
    } catch {
      /* continue */
    }
  }
  return [...new Set(urls)];
}

async function tryImageUrl(imageUrl, kind) {
  try {
    const img = await fetchBytes(imageUrl);
    if (img.buf.length < MIN_IMAGE_BYTES || img.buf.length > MAX_IMAGE_BYTES) return null;
    const head = img.buf.slice(0, 32).toString("utf8").toLowerCase();
    if (head.includes("<!doctype") || head.includes("<html") || head.trim() === "") return null;
    const ct = (img.contentType ?? "").toLowerCase();
    if (ct.includes("text/html") || ct.includes("application/json")) return null;
    return { ...img, imageUrl, kind };
  } catch {
    return null;
  }
}

async function resolveArticleImage(article) {
  if (article.rssImage) {
    const hit = await tryImageUrl(article.rssImage, "rss");
    if (hit) return hit;
  }
  try {
    const page = await fetchText(article.url, 18000);
    const candidates = imageCandidatesFromHtml(page.text, page.finalUrl || article.url, article.rssImage);
    for (const imageUrl of candidates) {
      const hit = await tryImageUrl(imageUrl, "og");
      if (hit) return hit;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeArticlesForIdea(idea, candidates) {
  const ideaDir = join(outDir, idea.slug);
  if (existsSync(ideaDir)) rmSync(ideaDir, { recursive: true, force: true });
  mkdirSync(ideaDir, { recursive: true });

  const articles = [];
  let idx = 0;
  for (const article of candidates) {
    if (articles.length >= 3) break;
    process.stdout.write(`  ${idea.slug} ← ${article.sourceId}: ${article.title.slice(0, 56)}… `);
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
    } catch (err) {
      console.log(`ERR ${err.message}`);
    }
  }
  return articles;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const ideas = loadIdeas();
  const curated = loadCurated();
  console.log(`Loaded ${ideas.length} ideas; curated catalogs for ${Object.keys(curated).length}`);

  // RSS pool only used as strict fallback when curated yields < 1 image.
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
    const candidates = [];
    const curatedEntries = curated[idea.slug] ?? [];

    for (const entry of curatedEntries) {
      if (candidates.length >= 3) break;
      process.stdout.write(`  hydrate ${idea.slug} ← ${entry.url.slice(0, 70)}… `);
      try {
        const article = await hydrateFromPage(entry.url, entry.sourceId);
        // Curated URLs are trusted; still reject empty titles.
        if (!article.title) {
          console.log("empty title, skip");
          continue;
        }
        candidates.push(article);
        usedUrls.add(article.url);
        console.log("ok");
      } catch (err) {
        console.log(`FAIL ${err.message}`);
      }
    }

    // Strict RSS fill only if curated produced nothing usable yet (or <2 and we want more).
    if (candidates.length < 2) {
      const ranked = unique
        .map((a) => ({ a, score: scoreArticle(idea, a) }))
        .filter((x) => x.score > 0 && !usedUrls.has(x.a.url))
        .sort((x, y) => y.score - x.score || x.a.title.localeCompare(y.a.title));

      for (const row of ranked) {
        if (candidates.length >= 3) break;
        candidates.push(row.a);
        usedUrls.add(row.a.url);
      }
    }

    const articles = await writeArticlesForIdea(idea, candidates);
    manifest[idea.slug] = articles;
    console.log(`  → ${articles.length} articles for ${idea.slug}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const total = Object.values(manifest).reduce((n, a) => n + a.length, 0);
  console.log(`Wrote manifest with ${total} articles → ${manifestPath}`);

  // Relevance sanity: reef must not mention Erco/Colombia solar; titles should pass rules when possible.
  const reef = manifest["reef-credit-exchange"] ?? [];
  for (const a of reef) {
    const blob = `${a.title} ${a.excerpt}`.toLowerCase();
    if (blob.includes("erco") || blob.includes("colombia")) {
      console.error("RELEVANCE FAIL: reef-credit-exchange matched Erco/Colombia solar");
      process.exitCode = 3;
    }
  }

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

#!/usr/bin/env node
/**
 * Replace airline text-circle / bad marks with real logos via:
 *   1) Simple Icons (mapped)
 *   2) logo.uplead.com (mapped + guessed domains)
 *   3) Wikidata P154 / Commons
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

const UA = "SeenMarksBot/1.2 (brand-atlas airline logos; local)";
const CONCURRENCY = Number(process.env.MARK_CONCURRENCY || 6);

/** Explicit Simple Icons slugs */
const SIMPLE = {
  "airlines__air-france": "airfrance",
  "airlines__british-airways": "britishairways",
  "airlines__emirates": "emirates",
  "airlines__lufthansa": "lufthansa",
  "airlines__qatar": "qatarairways",
  "airlines__singapore": "singaporeairlines",
  "airlines__ryanair": "ryanair",
  "airlines__easyjet": "easyjet",
  "airlines__american": "americanairlines",
  "airlines__delta": "delta",
  "airlines__united": "unitedairlines",
  "airlines__southwest": "southwestairlines",
  "airlines__jetblue": "jetblue",
  "airlines__alaska": "alaskaairlines",
  "airlines__air-canada": "aircanada",
  "airlines__klm": "klm",
  "airlines__turkish": "turkishairlines",
  "airlines__qatar-airways": "qatarairways",
  "airlines__singapore-airlines": "singaporeairlines",
  "airlines__ana": "ana",
  "airlines__jal": "japanairlines",
  "airlines__cathay": "cathaypacific",
  "airlines__qantas": "qantas",
  "airlines__air-china": "airchina",
  "airlines__china-eastern": "chinaeasternairlines",
  "airlines__china-southern": "chinasouthernairlines",
  "airlines__korean": "koreanair",
  "airlines__asiana": "asianaairlines",
  "airlines__garuda": "garudaindonesia",
  "airlines__airasia": "airasia",
  "airlines__etihad": "etihadairways",
  "airlines__saudia": "saudia",
  "airlines__thai": "thaiairways",
  "airlines__vietnam-airlines": "vietnamairlines",
  "airlines__philippine": "philippineairlines",
  "airlines__cebupacific": "cebupacific",
  "airlines__eva": "evaair",
  "airlines__china-airlines": "chinaairlines",
  "airlines__aer-lingus": "aerlingus",
  "airlines__iberia": "iberia",
  "airlines__vueling": "vueling",
  "airlines__tap": "tapairportugal",
  "airlines__swiss": "swiss",
  "airlines__austrian": "austrianairlines",
  "airlines__sas": "scandinavianairlines",
  "airlines__finnair": "finnair",
  "airlines__icelandair": "icelandair",
  "airlines__lot": "lot",
  "airlines__wizz": "wizzair",
  "airlines__aegean": "aegeanairlines",
  "airlines__aeroflot": "aeroflot",
  "airlines__egyptair": "egyptair",
  "airlines__ethiopian": "ethiopianairlines",
  "airlines__kenya-airways": "kenyaairways",
  "airlines__south-african": "southafricanairways",
  "airlines__latam": "latamairlines",
  "airlines__avianca": "avianca",
  "airlines__copa": "copaairlines",
  "airlines__aeromexico": "aeromexico",
  "airlines__gol": "gol",
  "airlines__azul": "azul",
  "airlines__air-nz": "airnewzealand",
  "airlines__virgin-atlantic": "virginatlantic",
  "airlines__virgin-australia": "virginaustralia",
  "airlines__hawaiian": "hawaiianairlines",
  "airlines__spirit": "spiritairlines",
  "airlines__frontier": "frontierairlines",
  "airlines__allegiant": "allegiant",
  "airlines__westjet": "westjet",
  "airlines__norwegian": "norwegian",
  "airlines__transavia": "transavia",
  "airlines__eurowings": "eurowings",
  "airlines__condor": "condor",
  "airlines__pegasus": "pegasusairlines",
  "airlines__scoot": "scoot",
  "airlines__jetstar": "jetstar",
  "airlines__malaysia": "malaysiaairlines",
  "airlines__batik": "batikair",
  "airlines__citilink": "citilink",
  "airlines__lion-air": "lionair",
  "airlines__hainan": "hainanairlines",
  "airlines__xiamen": "xiamenair",
  "airlines__sichuan": "sichuanairlines",
  "airlines__shenzhen": "shenzhenairlines",
  "airlines__juneyao": "juneyaoair",
  "airlines__peach": "peach",
  "airlines__jeju": "jejuair",
  "airlines__jin-air": "jinair",
  "airlines__tway": "twayair",
  "airlines__air-busan": "airbusan",
  "airlines__air-seoul": "airseoul",
  "airlines__bangkok-airways": "bangkokairways",
  "airlines__fiji-airways": "fijiairways",
  "airlines__air-tahiti-nui": "airtahitinui",
  "airlines__royal-air-maroc": "royalairmaroc",
  "airlines__air-algerie": "airalgerie",
  "airlines__tunisair": "tunisair",
  "airlines__royal-jordanian": "royaljordanian",
  "airlines__mea": "middleeastairlines",
  "airlines__gulf-air": "gulfair",
  "airlines__oman-air": "omanair",
  "airlines__kuwait-airways": "kuwaitairways",
  "airlines__flydubai": "flydubai",
  "airlines__flynas": "flynas",
  "airlines__porter": "porterairlines",
  "airlines__alitalia": "itaairways",
  "airlines__ita": "itaairways",
  "airlines__ukraine-intl": "ukraineinternationalairlines",
  "airlines__airlink": "airlink",
  "airlines__rex": "rexairlines",
  "airlines__interjet": "interjet",
  "airlines__aerolineas": "aerolineasargentinas",
  "airlines__volaris": "volaris",
  "airlines__viva-aerobus": "vivaaerobus",
  "airlines__flybondi": "flybondi",
  "airlines__jetsmart": "jetsmart",
  "airlines__sky-airline": "skyairline",
};

/** Prefer official / known domains for uplead */
const DOMAINS = {
  "airlines__spirit": "spirit.com",
  "airlines__allegiant": "allegiantair.com",
  "airlines__porter": "flyporter.com",
  "airlines__eurowings": "eurowings.com",
  "airlines__tap": "flytap.com",
  "airlines__alitalia": "ita-airways.com",
  "airlines__ita": "ita-airways.com",
  "airlines__easyjet-ch": "easyjet.com",
  "airlines__austrian": "austrian.com",
  "airlines__icelandair": "icelandair.com",
  "airlines__lot": "lot.com",
  "airlines__aegean": "aegeanair.com",
  "airlines__ukraine-intl": "flyuia.com",
  "airlines__egyptair": "egyptair.com",
  "airlines__royal-jordanian": "rj.com",
  "airlines__mea": "mea.com.lb",
  "airlines__air-algerie": "airalgerie.dz",
  "airlines__south-african": "flysaa.com",
  "airlines__airlink": "flyairlink.com",
  "airlines__bangkok-airways": "bangkokair.com",
  "airlines__vietnam-airlines": "vietnamairlines.com",
  "airlines__singapore": "singaporeair.com",
  "airlines__scoot": "flyscoot.com",
  "airlines__garuda": "garuda-indonesia.com",
  "airlines__citilink": "citilink.co.id",
  "airlines__cebupacific": "cebupacificair.com",
  "airlines__cathay": "cathaypacific.com",
  "airlines__china-eastern": "ceair.com",
  "airlines__china-southern": "csair.com",
  "airlines__juneyao": "juneyaoair.com",
  "airlines__xiamen": "xiamenair.com",
  "airlines__sichuan": "sichuanair.com",
  "airlines__shenzhen": "shenzhenair.com",
  "airlines__tigerair-taiwan": "tigerairtw.com",
  "airlines__jal": "jal.co.jp",
  "airlines__peach": "flypeach.com",
  "airlines__jetstar-japan": "jetstar.com",
  "airlines__skymark": "skymark.co.jp",
  "airlines__vanilla": "vanilla-air.com",
  "airlines__korean": "koreanair.com",
  "airlines__asiana": "flyasiana.com",
  "airlines__jeju": "jejuair.net",
  "airlines__jin-air": "jinair.com",
  "airlines__tway": "twayair.com",
  "airlines__air-busan": "airbusan.com",
  "airlines__air-seoul": "flyairseoul.com",
  "airlines__rex": "rex.com.au",
  "airlines__fiji-airways": "fijiairways.com",
  "airlines__copa": "copaair.com",
  "airlines__gol": "voegol.com.br",
  "airlines__latam-br": "latam.com",
  "airlines__avianca-ecuador": "avianca.com",
  "airlines__latam-peru": "latam.com",
  "airlines__aires": "easyfly.com.co",
  "airlines__interjet": "interjet.com",
  "airlines__aerolineas": "aerolineas.com.ar",
  "airlines__jetsmart-ar": "jetsmart.com",
  "airlines__american": "aa.com",
  "airlines__air-tahiti-nui": "airtahitinui.com",
  "airlines__azul": "voeazul.com.br",
  "airlines__batik": "batikair.com",
  "airlines__china-airlines": "china-airlines.com",
  "airlines__ana": "ana.co.jp",
  "airlines__air-france": "airfrance.com",
};

/** Wikidata / Commons search overrides */
const WIKI = {
  "airlines__spirit": "Spirit Airlines",
  "airlines__allegiant": "Allegiant Air",
  "airlines__porter": "Porter Airlines",
  "airlines__eurowings": "Eurowings",
  "airlines__tap": "TAP Air Portugal",
  "airlines__alitalia": "ITA Airways",
  "airlines__ita": "ITA Airways",
  "airlines__easyjet-ch": "easyJet",
  "airlines__austrian": "Austrian Airlines",
  "airlines__icelandair": "Icelandair",
  "airlines__lot": "LOT Polish Airlines",
  "airlines__aegean": "Aegean Airlines",
  "airlines__ukraine-intl": "Ukraine International Airlines",
  "airlines__egyptair": "EgyptAir",
  "airlines__royal-jordanian": "Royal Jordanian",
  "airlines__mea": "Middle East Airlines",
  "airlines__air-algerie": "Air Algérie",
  "airlines__south-african": "South African Airways",
  "airlines__airlink": "Airlink",
  "airlines__bangkok-airways": "Bangkok Airways",
  "airlines__vietnam-airlines": "Vietnam Airlines",
  "airlines__singapore": "Singapore Airlines",
  "airlines__scoot": "Scoot",
  "airlines__garuda": "Garuda Indonesia",
  "airlines__citilink": "Citilink",
  "airlines__cebupacific": "Cebu Pacific",
  "airlines__cathay": "Cathay Pacific",
  "airlines__china-eastern": "China Eastern Airlines",
  "airlines__china-southern": "China Southern Airlines",
  "airlines__juneyao": "Juneyao Air",
  "airlines__xiamen": "XiamenAir",
  "airlines__sichuan": "Sichuan Airlines",
  "airlines__shenzhen": "Shenzhen Airlines",
  "airlines__tigerair-taiwan": "Tigerair Taiwan",
  "airlines__jal": "Japan Airlines",
  "airlines__peach": "Peach Aviation",
  "airlines__jetstar-japan": "Jetstar Japan",
  "airlines__skymark": "Skymark Airlines",
  "airlines__vanilla": "Vanilla Air",
  "airlines__korean": "Korean Air",
  "airlines__asiana": "Asiana Airlines",
  "airlines__jeju": "Jeju Air",
  "airlines__jin-air": "Jin Air",
  "airlines__tway": "T'way Air",
  "airlines__air-busan": "Air Busan",
  "airlines__air-seoul": "Air Seoul",
  "airlines__rex": "Rex Airlines",
  "airlines__fiji-airways": "Fiji Airways",
  "airlines__copa": "Copa Airlines",
  "airlines__gol": "Gol Transportes Aéreos",
  "airlines__latam-br": "LATAM Brasil",
  "airlines__avianca-ecuador": "Avianca Ecuador",
  "airlines__latam-peru": "LATAM Perú",
  "airlines__aires": "EasyFly",
  "airlines__interjet": "Interjet",
  "airlines__aerolineas": "Aerolíneas Argentinas",
  "airlines__jetsmart-ar": "JetSMART",
  "airlines__american": "American Airlines",
  "airlines__air-tahiti-nui": "Air Tahiti Nui",
  "airlines__azul": "Azul Brazilian Airlines",
  "airlines__batik": "Batik Air",
  "airlines__china-airlines": "China Airlines",
  "airlines__ana": "All Nippon Airways",
  "airlines__air-france": "Air France",
  "airlines__air-canada": "Air Canada",
  "airlines__british-airways": "British Airways",
};

function isEmblem(svg) {
  if (!svg) return true;
  if (svg.includes("<text")) return true;
  // Tiny simple-icons that render poorly in the circle should be upgraded when possible
  if (svg.includes('viewBox="0 0 24 24"') && svg.length < 900) return true;
  return false;
}

function wrapImage(b64, mime = "image/png") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <defs>
    <filter id="g"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.15"/><feFuncG type="linear" slope="1.15"/><feFuncB type="linear" slope="1.15"/></feComponentTransfer></filter>
  </defs>
  <image href="data:${mime};base64,${b64}" width="128" height="128" filter="url(#g)" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

function sniffMime(buf) {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "image/webp";
  const head = buf.slice(0, 200).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg") || head.includes("<svg")) return "image/svg+xml";
  return null;
}

function looksLikePhotoFilename(name) {
  const n = name.toLowerCase();
  if (/\b(flickr|dealership|headquarters|front|rear|side|interior|exterior|museum|factory|plant|showroom|street|crew|cabin|aircraft|airplane|boeing|airbus|img_|dsc_)\b/.test(n)) {
    return true;
  }
  if (/\.(jpe?g)$/i.test(n) && !/\b(logo|wordmark|emblem|symbol|badge|marque)\b/.test(n)) {
    return true;
  }
  return false;
}

function logoFilenameScore(name) {
  const n = name.toLowerCase();
  let score = 0;
  if (n.endsWith(".svg")) score += 50;
  if (/\b(logo|wordmark|emblem|symbol|badge|marque|typeface)\b/.test(n)) score += 30;
  if (n.endsWith(".png")) score += 10;
  if (looksLikePhotoFilename(name)) score -= 100;
  return score;
}

const normalizePy = join(root, "scripts", "normalize-mark-png.py");

function normalizeRaster(buf) {
  if (!existsSync(normalizePy)) {
    return { buf, mime: sniffMime(buf) || "image/png" };
  }
  const r = spawnSync("python3", [normalizePy], {
    input: buf,
    maxBuffer: 20_000_000,
  });
  if (r.status !== 0 || !r.stdout || r.stdout.length < 400) return null;
  return { buf: r.stdout, mime: "image/png" };
}

function brightenIfDark(buf, mime) {
  if (mime === "image/svg+xml") return { buf, mime };
  const script = `
import sys, io
from PIL import Image, ImageOps
raw = sys.stdin.buffer.read()
im = Image.open(io.BytesIO(raw)).convert("RGBA")
pixels = list(im.getdata())
opaque = [p for p in pixels if p[3] > 30]
if not opaque:
    sys.stdout.buffer.write(raw); raise SystemExit(0)
avg = sum((0.2126*r + 0.7152*g + 0.0722*b) for r,g,b,_ in opaque) / len(opaque)
if avg < 70:
    r,g,b,a = im.split()
    rgb = Image.merge("RGB", (r,g,b))
    rgb = ImageOps.invert(rgb)
    im = Image.merge("RGBA", (*rgb.split(), a))
out = io.BytesIO()
im.save(out, format="PNG")
sys.stdout.buffer.write(out.getvalue())
`;
  const r = spawnSync("python3", ["-c", script], { input: buf, maxBuffer: 20_000_000 });
  if (r.status !== 0) return { buf, mime };
  return { buf: r.stdout, mime: "image/png" };
}

async function wikiJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 || res.status === 403) {
        await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`wiki ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    }
  }
  return null;
}

async function fetchSimpleIcon(slug) {
  if (!slug) return null;
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${slug}.svg`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    let svg = await res.text();
    if (!svg.includes("<path") && !svg.includes("<polygon")) return null;
    svg = svg.replace(/fill="[^"]*"/g, 'fill="#E8E8E8"');
    if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#E8E8E8" ');
    return svg;
  } catch {
    return null;
  }
}

function domainsFor(item) {
  const out = [];
  if (DOMAINS[item.id]) out.push(DOMAINS[item.id]);
  const cleaned = String(item.name || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''´`]/g, "")
    .replace(/\b(inc|ltd|llc|co|corp|the|airlines?|airways?|air|aviation|group)\b/gi, " ")
    .trim();
  const compact = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  const slug = item.id.split("__")[1] || "";
  if (compact.length >= 3) {
    out.push(`${compact}.com`, `fly${compact}.com`);
  }
  if (slug) {
    const s = slug.replace(/-/g, "");
    out.push(`${s}.com`, `${slug}.com`, `fly${s}.com`);
  }
  return [...new Set(out)].slice(0, 6);
}

async function fetchUplead(domains) {
  for (const domain of domains) {
    try {
      const res = await fetch(`https://logo.uplead.com/${domain}`, {
        redirect: "follow",
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      let buf = Buffer.from(await res.arrayBuffer());
      let mime = sniffMime(buf);
      if (!mime || buf.length < 800) continue;
      if (mime === "image/svg+xml") {
        let svg = buf.toString("utf8");
        if (!svg.includes("<path") && !svg.includes("<polygon") && !svg.includes("<g")) continue;
        svg = svg.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
        return { kind: "svg", svg, source: `uplead:${domain}` };
      }
      const norm = normalizeRaster(buf) || brightenIfDark(buf, mime);
      if (!norm || norm.buf.length < 600) continue;
      return {
        kind: "raster",
        b64: norm.buf.toString("base64"),
        mime: norm.mime || "image/png",
        source: `uplead:${domain}`,
      };
    } catch {
      /* next */
    }
  }
  return null;
}

async function fetchWikidataLogo(item) {
  const search = WIKI[item.id] || item.name;
  const q = new URLSearchParams({
    action: "wbsearchentities",
    search,
    language: "en",
    format: "json",
    limit: "8",
  });
  const found = await wikiJson(`https://www.wikidata.org/w/api.php?${q}`);
  const hits = found?.search || [];
  let bestFile = null;
  let bestScore = -999;

  for (const hit of hits.slice(0, 6)) {
    const ent = await wikiJson(`https://www.wikidata.org/wiki/Special:EntityData/${hit.id}.json`);
    const entity = ent?.entities?.[hit.id];
    const logos = entity?.claims?.P154 || [];
    for (const claim of logos) {
      const fname = claim?.mainsnak?.datavalue?.value;
      if (!fname) continue;
      let score = logoFilenameScore(fname);
      const tokens = String(item.name)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3 && !["air", "airlines", "airways"].includes(t));
      const fn = fname.toLowerCase();
      if (tokens.some((t) => fn.includes(t))) score += 25;
      if (bestScore < score) {
        bestScore = score;
        bestFile = fname;
      }
    }
    if (bestScore >= 70) break;
  }

  if (!bestFile || bestScore < 10) return null;

  const fileUrl =
    "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(bestFile) +
    "?width=256";
  const res = await fetch(fileUrl, {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  let buf = Buffer.from(await res.arrayBuffer());
  let mime = sniffMime(buf) || "image/png";

  if (mime === "image/svg+xml") {
    let svg = buf.toString("utf8");
    if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#E8E8E8" ');
    else svg = svg.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
    return { kind: "svg", svg, source: `wiki:${bestFile}`, score: bestScore };
  }

  const norm = normalizeRaster(buf) || brightenIfDark(buf, mime);
  if (!norm || norm.buf.length < 600) return null;
  return {
    kind: "raster",
    b64: norm.buf.toString("base64"),
    mime: norm.mime || "image/png",
    source: `wiki:${bestFile}`,
    score: bestScore,
  };
}

async function resolveLogo(item) {
  const si = await fetchSimpleIcon(SIMPLE[item.id]);
  if (si) return { kind: "svg", svg: si, source: `simple:${SIMPLE[item.id]}` };

  const up = await fetchUplead(domainsFor(item));
  if (up) return up;

  const wiki = await fetchWikidataLogo(item);
  if (wiki) return wiki;

  return null;
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const FORCE = new Set([
  "airlines__american",
  "airlines__air-tahiti-nui",
  "airlines__azul",
  "airlines__batik",
  "airlines__china-airlines",
  "airlines__ana",
  "airlines__air-france",
  "airlines__avianca",
]);

const airlines = catalog.items.filter((it) => it.categoryId === "airlines");
const todo = [];
for (const item of airlines) {
  const out = join(marksDir, `${item.id}.svg`);
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (FORCE.has(item.id) || isEmblem(existing)) todo.push(item);
}

console.error(`Fixing ${todo.length}/${airlines.length} airline marks…`);

let ok = 0;
let fail = 0;
const sample = [];
const failed = [];

await mapPool(todo, CONCURRENCY, async (item) => {
  const out = join(marksDir, `${item.id}.svg`);
  try {
    const logo = await resolveLogo(item);
    if (!logo) {
      fail += 1;
      failed.push(item.id);
      return;
    }
    if (logo.kind === "svg") writeFileSync(out, logo.svg);
    else writeFileSync(out, wrapImage(logo.b64, logo.mime));
    // Keep catalog mark path as .svg
    ok += 1;
    if (sample.length < 80) sample.push([item.id, logo.source]);
  } catch (e) {
    fail += 1;
    failed.push(`${item.id}:${e?.message || e}`);
  }
});

const scrub = join(root, "scripts", "scrub-mark-backgrounds.py");
if (existsSync(scrub)) {
  console.error("Scrubbing…");
  spawnSync("python3", [scrub], { cwd: root, encoding: "utf8", stdio: "inherit" });
}

console.log(JSON.stringify({ todo: todo.length, ok, fail, sample, failed }, null, 2));

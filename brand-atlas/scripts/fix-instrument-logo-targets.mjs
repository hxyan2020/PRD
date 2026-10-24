#!/usr/bin/env node
/**
 * Replace known-bad instrument marks (blobs, wrong brands, photos, text emblems)
 * with explicit Commons / Uplead / Simple Icons sources. Strict acceptance.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const UA = "SeenMarksBot/1.3 (brand-atlas instrument logo repair; local)";

/** id → ordered list of sources: commons:<file> | uplead:<domain> | simpleicons:<slug> | gfav:<domain> */
const TARGETS = {
  "instruments__neural": [
    "uplead:neuraldsp.com",
    "gfav:neuraldsp.com",
    "commons:Neural DSP logo.png",
  ],
  "instruments__pearl": [
    "commons:Pearl Drums logo.svg",
    "commons:Pearl drum logo.png",
    "uplead:pearldrum.com",
    "gfav:pearldrum.com",
  ],
  "instruments__premus": [
    "uplead:premieremusic.net",
    "gfav:premieremusic.net",
    "uplead:guitarcenter.com",
  ],
  "instruments__lowden": [
    "uplead:georgelowden.com",
    "uplead:lowdanguitars.com",
    "gfav:georgelowden.com",
    "gfav:lowdanguitars.com",
    "commons:George Lowden.jpg",
  ],
  "instruments__eastman": [
    "uplead:eastmanmusiccompany.com",
    "uplead:eastmanstrings.com",
    "gfav:eastmanmusiccompany.com",
    "commons:Eastman Strings logo.png",
  ],
  "instruments__jupiter": [
    "commons:Jupiter Band Instruments logo.png",
    "uplead:jupitermusic.com",
    "gfav:jupitermusic.com",
  ],
  "instruments__charvel": [
    "commons:Charvel logo.svg",
    "commons:Charvel logo.png",
    "uplead:charvel.com",
    "gfav:charvel.com",
  ],
  "instruments__rickenbacker": [
    "commons:Rickenbacker logo.svg",
    "commons:Rickenbacker logo.png",
    "uplead:rickenbacker.com",
    "gfav:rickenbacker.com",
  ],
  "instruments__gemeinhardt": [
    "commons:Gemeinhardt logo.png",
    "uplead:gemeinhardt.com",
    "gfav:gemeinhardt.com",
  ],
  "instruments__electro-harmonix": [
    "commons:Electro-Harmonix logo.svg",
    "commons:Electro-Harmonix logo.png",
    "uplead:ehx.com",
    "gfav:ehx.com",
  ],
  "instruments__scherl": [
    "commons:Scherl and Roth logo.png",
    "uplead:conn-selmer.com",
    "gfav:conn-selmer.com",
  ],
  "instruments__bach": [
    "commons:Vincent Bach logo.png",
    "commons:Bach Stradivarius logo.png",
    "uplead:bachbrass.com",
    "gfav:bachbrass.com",
  ],
  "instruments__pirastro": [
    "commons:Pirastro logo.svg",
    "commons:Pirastro Logo.png",
    "uplead:pirastro.com",
    "gfav:pirastro.com",
  ],
  "instruments__breedlove": [
    "uplead:breedloveguitars.com",
    "gfav:breedloveguitars.com",
    "commons:Breedlove Guitars logo.png",
  ],
  "instruments__squier": [
    "commons:Squier guitars logo.svg",
    "uplead:squierguitars.com",
    "gfav:squierguitars.com",
  ],
  "instruments__zoom-audio": [
    "commons:Zoom Corporation logo.svg",
    "uplead:zoom.co.jp",
    "gfav:zoomcorp.com",
  ],
  "instruments__kemper": [
    "uplead:kemper-amps.com",
    "gfav:kemper-amps.com",
    "commons:Kemper Profiler logo.png",
  ],
  "instruments__mxr": [
    "commons:MXR logo.svg",
    "uplead:jimdunlop.com",
    "gfav:jimdunlop.com",
  ],
  "instruments__apogee": [
    "uplead:apogeedigital.com",
    "gfav:apogeedigital.com",
  ],
  "instruments__ludwig": [
    "commons:Ludwig Drums logo.svg",
    "uplead:ludwig-drums.com",
    "gfav:ludwig-drums.com",
  ],
  "instruments__mapex": [
    "commons:Mapex logo.png",
    "uplead:mapexdrums.com",
    "gfav:mapexdrums.com",
  ],
  "instruments__meinl": [
    "commons:Meinl cymbals logo.png",
    "uplead:meinlpercussion.com",
    "gfav:meinlpercussion.com",
  ],
  "instruments__king": [
    "commons:King Musical Instruments logo.png",
    "uplead:kinghorns.com",
    "gfav:conn-selmer.com",
  ],
  "instruments__elixir": [
    "commons:Elixir Strings logo.png",
    "uplead:elixirstrings.com",
    "gfav:elixirstrings.com",
  ],
  "instruments__kawai": [
    "commons:Kawai logo.svg",
    "uplead:kawaius.com",
    "gfav:kawai-global.com",
  ],
  "instruments__korg": [
    "commons:Korg logo.svg",
    "uplead:korg.com",
    "gfav:korg.com",
  ],
  "instruments__casio-instruments": [
    "commons:Casio logo.svg",
    "uplead:casio.com",
    "gfav:casio.com",
  ],
  "instruments__shure": [
    "commons:Shure Logo 2024.svg",
    "uplead:shure.com",
    "gfav:shure.com",
  ],
  "instruments__sonor": [
    "commons:Sonor logo.svg",
    "uplead:sonor.com",
    "gfav:sonor.com",
  ],
  "instruments__guild": [
    "commons:Guild Guitar Company logo.png",
    "uplead:guildguitars.com",
    "gfav:guildguitars.com",
  ],
  "instruments__ovation": [
    "commons:Ovation Guitar Company logo.png",
    "uplead:ovationguitars.com",
    "gfav:ovationguitars.com",
  ],
  "instruments__seagull": [
    "uplead:seagullguitars.com",
    "uplead:godinguitars.com",
    "gfav:seagullguitars.com",
  ],
  "instruments__collings": [
    "commons:Collings Guitars Logo.svg",
    "uplead:collingsguitars.com",
    "gfav:collingsguitars.com",
  ],
  "instruments__santa-cruz": [
    "uplead:santacruzguitar.com",
    "gfav:santacruzguitar.com",
  ],
  "instruments__strymon": [
    "uplead:strymon.net",
    "gfav:strymon.net",
  ],
  "instruments__sequential": [
    "commons:Dave Smith Instruments Logo.svg",
    "uplead:sequential.com",
    "gfav:sequential.com",
  ],
  "instruments__universal-audio": [
    "commons:UA Logo.svg",
    "uplead:uaudio.com",
    "gfav:uaudio.com",
  ],
  "instruments__steinberg": [
    "commons:Steinberg Media Technologies logo.svg",
    "uplead:steinberg.net",
    "gfav:steinberg.net",
  ],
  "instruments__ableton": [
    "commons:Ableton.svg",
    "uplead:ableton.com",
    "gfav:ableton.com",
  ],
  "instruments__boss": [
    "commons:BOSS logo.svg",
    "uplead:boss.info",
    "gfav:boss.info",
  ],
  "instruments__prs": [
    "commons:PRS Guitars logo.svg",
    "uplead:prsguitars.com",
    "gfav:prsguitars.com",
  ],
  "instruments__ltd": [
    "commons:ESP Logo.svg",
    "uplead:espguitars.com",
    "gfav:espguitars.com",
  ],
  "instruments__thomann": [
    "commons:Thomann logo.svg",
    "uplead:thomann.de",
    "gfav:thomann.de",
  ],
  "instruments__motu": [
    "commons:MOTU logo.svg",
    "uplead:motu.com",
    "gfav:motu.com",
  ],
  "instruments__native-instruments": [
    "commons:Native Instruments logo.svg",
    "uplead:native-instruments.com",
    "gfav:native-instruments.com",
  ],
  "instruments__larivee": [
    "uplead:larrivee.com",
    "gfav:larrivee.com",
  ],
};

function wrapImage(b64, mime = "image/png") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <image href="data:${mime};base64,${b64}" width="128" height="128" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

function sniffMime(buf) {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  const head = buf.slice(0, 200).toString("utf8").trim().toLowerCase();
  if (head.includes("<svg")) return "image/svg+xml";
  return null;
}

function lightenSvg(svg) {
  let out = svg;
  if (!/fill=/.test(out)) out = out.replace(/<path /g, '<path fill="#FFFFFF" ');
  else out = out.replace(/fill="(?!none)[^"]*"/g, 'fill="#FFFFFF"');
  out = out.replace(/stroke="(?!none)[^"]*"/g, 'stroke="#FFFFFF"');
  return out;
}

function normalizePng(buf) {
  const r = spawnSync("python3", [join(root, "scripts", "normalize-mark-png.py")], {
    input: buf,
    maxBuffer: 12_000_000,
  });
  if (r.status === 0 && r.stdout && r.stdout.length > 400) return r.stdout;
  // Aggressive solid-bg scrub → white silhouette
  const script = `
import sys, io
from PIL import Image
raw = sys.stdin.buffer.read()
im = Image.open(io.BytesIO(raw)).convert("RGBA")
im.thumbnail((256, 256), Image.Resampling.LANCZOS)
w, h = im.size
px = list(im.getdata())
bg = px[0][:3]
def close(a, b, tol=42):
    return all(abs(x - y) <= tol for x, y in zip(a, b))
# If already transparent corners, keep alpha and force white
if px[0][3] < 30:
    out = [(255, 255, 255, 255) if a > 40 else (0, 0, 0, 0) for r, g, b, a in px]
else:
    out = [(0, 0, 0, 0) if close((r, g, b), bg, 45) else (255, 255, 255, 255) for r, g, b, a in px]
op = sum(1 for p in out if p[3] > 0)
if op < 40:
    sys.exit(1)
im.putdata(out)
b = io.BytesIO(); im.save(b, format="PNG"); sys.stdout.buffer.write(b.getvalue())
`;
  const r2 = spawnSync("python3", ["-c", script], { input: buf, maxBuffer: 12_000_000 });
  if (r2.status === 0 && r2.stdout && r2.stdout.length > 300) return r2.stdout;
  return null;
}

function qualityOk(pngBuf) {
  const script = `
import sys, io
from PIL import Image
im = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert("RGBA")
w, h = im.size
px = list(im.getdata())
op = [(i, p) for i, p in enumerate(px) if p[3] > 40]
if len(op) < 60: raise SystemExit(1)
xs = [i % w for i, _ in op]; ys = [i // w for i, _ in op]
bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
fill = len(op) / (bw * bh)
mask = [1 if p[3] > 40 else 0 for p in px]
edges = 0
for y in range(h):
  for x in range(w - 1):
    if mask[y * w + x] != mask[y * w + x + 1]: edges += 1
for x in range(w):
  for y in range(h - 1):
    if mask[y * w + x] != mask[(y + 1) * w + x]: edges += 1
# Reject near-solid blobs (favicon squares) and empty scraps
if fill > 0.92 and edges < 120: raise SystemExit(2)
if fill > 0.88 and edges / max(1, len(op)) < 0.02: raise SystemExit(3)
print(f"ok fill={fill:.2f} edges={edges} op={len(op)}")
`;
  const r = spawnSync("python3", ["-c", script], { input: pngBuf, encoding: "utf8" });
  if (r.status !== 0) return false;
  process.stderr.write(`  ${r.stdout}`);
  return true;
}

async function fetchBuf(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        redirect: "follow",
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  return null;
}

function sourceUrl(spec) {
  if (spec.startsWith("commons:")) {
    return (
      "https://commons.wikimedia.org/wiki/Special:FilePath/" +
      encodeURIComponent(spec.slice(8)) +
      "?width=256"
    );
  }
  if (spec.startsWith("uplead:")) return `https://logo.uplead.com/${spec.slice(7)}`;
  if (spec.startsWith("gfav:"))
    return `https://www.google.com/s2/favicons?domain=${spec.slice(5)}&sz=128`;
  if (spec.startsWith("simpleicons:"))
    return `https://cdn.simpleicons.org/${spec.slice(12)}/FFFFFF`;
  return null;
}

async function resolve(id, specs) {
  for (const spec of specs) {
    const url = sourceUrl(spec);
    if (!url) continue;
    const buf = await fetchBuf(url);
    if (!buf || buf.length < 250) {
      console.error(`  miss ${spec}`);
      continue;
    }
    // HTML/XML error pages
    const head = buf.slice(0, 80).toString("utf8");
    if (head.startsWith("<!DOCTYPE") || head.startsWith("<Error") || head.startsWith("<?xml")) {
      if (!head.includes("<svg")) {
        console.error(`  bad ${spec}`);
        continue;
      }
    }
    const mime = sniffMime(buf);
    if (mime === "image/svg+xml") {
      // Prefer keeping vector if it has paths
      const svg = lightenSvg(buf.toString("utf8"));
      if (svg.includes("<path") || svg.includes("<polygon") || svg.includes("<g")) {
        // Rasterize via rsvg if available for quality gate, else accept svg
        const rast = spawnSync("rsvg-convert", ["-w", "256"], { input: Buffer.from(svg) });
        if (rast.status === 0 && rast.stdout?.length > 400) {
          const png = normalizePng(rast.stdout) || rast.stdout;
          if (qualityOk(png)) {
            writeFileSync(join(marksDir, `${id}.svg`), wrapImage(png.toString("base64")));
            return spec;
          }
        }
        writeFileSync(join(marksDir, `${id}.svg`), svg);
        return `${spec}:svg`;
      }
      continue;
    }
    if (!mime) {
      console.error(`  nomime ${spec}`);
      continue;
    }
    const png = normalizePng(buf);
    if (!png) {
      console.error(`  norm-fail ${spec}`);
      continue;
    }
    if (!qualityOk(png)) {
      console.error(`  quality-fail ${spec}`);
      continue;
    }
    writeFileSync(join(marksDir, `${id}.svg`), wrapImage(png.toString("base64")));
    return spec;
  }
  return null;
}

// Fitted wordmark fallback (better than blank / wrong brand)
function wordmark(name) {
  const short = name.length > 18 ? name.slice(0, 16) + "…" : name;
  const size = short.length > 12 ? 16 : short.length > 8 ? 20 : 26;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 64" role="img" aria-label="${name}">
  <text x="80" y="40" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${size}" font-weight="700" letter-spacing="0.12em"
        fill="#FFFFFF">${short.toUpperCase()}</text>
</svg>
`;
}

const catalog = JSON.parse(readFileSync(join(root, "public", "data", "catalog.json"), "utf8"));
const byId = Object.fromEntries(catalog.items.map((it) => [it.id, it]));

let ok = 0;
let fail = 0;
const results = [];
for (const [id, specs] of Object.entries(TARGETS)) {
  console.error(`\n${id}`);
  const src = await resolve(id, specs);
  if (src) {
    ok += 1;
    results.push([id, src]);
    console.error(`ok ← ${src}`);
  } else {
    fail += 1;
    const name = byId[id]?.name || id;
    writeFileSync(join(marksDir, `${id}.svg`), wordmark(name));
    results.push([id, "wordmark-fallback"]);
    console.error(`fallback wordmark ${name}`);
  }
  await new Promise((r) => setTimeout(r, 200));
}

console.log(JSON.stringify({ ok, fail, results }, null, 2));

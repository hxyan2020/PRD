#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const UA = "SeenMarksBot/1.2 (brand-atlas instrument logos; local)";

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
  const head = buf.slice(0, 200).toString("utf8").trim().toLowerCase();
  if (head.includes("<svg")) return "image/svg+xml";
  return null;
}

function brightenIfDark(buf, mime) {
  if (mime === "image/svg+xml") return { buf, mime };
  const script = `
import sys, io
from PIL import Image, ImageOps
raw = sys.stdin.buffer.read()
im = Image.open(io.BytesIO(raw)).convert("RGBA")
opaque = [p for p in im.getdata() if p[3] > 30]
if not opaque:
    sys.stdout.buffer.write(raw); sys.exit(0)
avg = sum((0.2126*r + 0.7152*g + 0.0722*b) for r,g,b,_ in opaque) / len(opaque)
if avg < 80:
    r,g,b,a = im.split()
    rgb = ImageOps.invert(Image.merge("RGB", (r,g,b)))
    im = Image.merge("RGBA", (*rgb.split(), a))
out = io.BytesIO(); im.save(out, format="PNG"); sys.stdout.buffer.write(out.getvalue())
`;
  const r = spawnSync("python3", ["-c", script], { input: buf, maxBuffer: 20_000_000 });
  if (r.status !== 0) return { buf, mime };
  return { buf: r.stdout, mime: "image/png" };
}

function lightenSvg(svg) {
  let out = svg;
  if (!/fill=/.test(out)) out = out.replace(/<path /g, '<path fill="#E8E8E8" ');
  else out = out.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
  return out;
}

function isWeak(id) {
  const p = join(marksDir, `${id}.svg`);
  if (!existsSync(p)) return true;
  const t = readFileSync(p, "utf8");
  return t.includes("<text") || (t.length < 900 && !t.includes("data:image"));
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
        await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
        continue;
      }
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  return null;
}

async function save(id, buf, src) {
  const mime = sniffMime(buf);
  if (!mime) return false;
  const out = join(marksDir, `${id}.svg`);
  if (mime === "image/svg+xml") {
    writeFileSync(out, lightenSvg(buf.toString("utf8")));
  } else {
    const b = brightenIfDark(buf, mime);
    if (b.buf.length < 400) return false;
    writeFileSync(out, wrapImage(b.buf.toString("base64"), b.mime));
  }
  console.log("ok", id, "←", src, buf.length);
  return true;
}

const FORCE = [
  "instruments__mxr",
  "instruments__sequential",
  "instruments__neural",
  "instruments__seagull",
  "instruments__apogee",
];

const jobs = [
  [
    "instruments__sequential",
    "https://commons.wikimedia.org/wiki/Special:FilePath/" +
      encodeURIComponent("Dave Smith Instruments Logo.svg") +
      "?width=256",
    "commons:DSI",
  ],
  ["instruments__mxr", "https://logo.uplead.com/jimdunlop.com", "uplead:jimdunlop"],
  ["instruments__neural", "https://logo.uplead.com/neuraldsp.com", "uplead:neuraldsp"],
  ["instruments__seagull", "https://logo.uplead.com/godinguitars.com", "uplead:godin"],
  ["instruments__apogee", "https://logo.uplead.com/apogeedigital.com", "uplead:apogee"],
  ["instruments__bach", "https://logo.uplead.com/conn-selmer.com", "uplead:conn-selmer"],
  ["instruments__scherl", "https://logo.uplead.com/conn-selmer.com", "uplead:conn-selmer"],
  ["instruments__eastman", "https://logo.uplead.com/eastmanmusiccompany.com", "uplead:eastman"],
  ["instruments__pirastro", "https://logo.uplead.com/thomastik-infeld.com", "uplead:thomastik-fallback"],
  ["instruments__lowden", "https://logo.uplead.com/georgelowden.com", "uplead:lowden"],
  ["instruments__kemper", "https://logo.uplead.com/native-instruments.com", "uplead:ni-skip"],
];

for (const [id, url, src] of jobs) {
  if (!FORCE.includes(id) && !isWeak(id)) continue;
  // skip intentional bad fallback for kemper
  if (id === "instruments__kemper" && src.includes("ni-skip")) continue;
  const buf = await fetchBuf(url);
  if (!buf) {
    console.log("miss", id, src);
    continue;
  }
  if (buf.toString("utf8").startsWith("<?xml") && !buf.toString("utf8").includes("<svg")) {
    console.log("xml-err", id, src);
    continue;
  }
  await save(id, buf, src);
  await new Promise((r) => setTimeout(r, 300));
}

const domains = [
  ["instruments__kemper", "kemper-amps.com"],
  ["instruments__bach", "bachbrass.com"],
  ["instruments__pirastro", "pirastro.com"],
  ["instruments__lowden", "lowdanguitars.com"],
  ["instruments__eastman", "eastmanstrings.com"],
  ["instruments__scherl", "conn-selmer.com"],
  ["instruments__premus", "premieremusic.net"],
  ["instruments__mxr", "jimdunlop.com"],
  ["instruments__neural", "neuraldsp.com"],
];

for (const [id, domain] of domains) {
  if (!isWeak(id) && !FORCE.includes(id)) continue;
  if (!isWeak(id) && id !== "instruments__mxr") continue;
  const candidates = [
    `https://logo.uplead.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://${domain}/favicon.ico`,
    `https://www.${domain}/favicon.ico`,
  ];
  let done = false;
  for (const url of candidates) {
    const buf = await fetchBuf(url);
    if (!buf || buf.length < 200) continue;
    if (buf.toString("utf8").startsWith("<?xml") && !sniffMime(buf)) continue;
    if (await save(id, buf, url)) {
      done = true;
      break;
    }
  }
  if (!done) console.log("still-weak", id);
  await new Promise((r) => setTimeout(r, 250));
}

// Styled wordmark fallback for stubborn niche brands (better than clipped circle text)
function wordmarkSvg(name) {
  const short = name.length > 14 ? name.slice(0, 12) + "…" : name;
  const size = short.length > 10 ? 18 : short.length > 7 ? 22 : 28;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${name}">
  <rect x="8" y="44" width="112" height="40" rx="6" fill="none" stroke="#E0E0E0" stroke-width="2"/>
  <text x="64" y="70" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="700" fill="#E8E8E8">${short}</text>
</svg>
`;
}

// Prefer copying a parent mark where relationship is clear
const copies = {
  instruments__bach: "instruments__conn-selmer",
  instruments__scherl: "instruments__conn-selmer",
};
for (const [child, parent] of Object.entries(copies)) {
  if (!isWeak(child)) continue;
  const src = join(marksDir, `${parent}.svg`);
  if (!existsSync(src) || isWeak(parent)) continue;
  writeFileSync(join(marksDir, `${child}.svg`), readFileSync(src));
  console.log("copy", child, "←", parent);
}

const catalog = JSON.parse(readFileSync(join(root, "public", "data", "catalog.json"), "utf8"));
const remaining = catalog.items
  .filter((it) => it.categoryId === "instruments" && isWeak(it.id))
  .map((it) => it.id);
console.log(JSON.stringify({ remaining }, null, 2));

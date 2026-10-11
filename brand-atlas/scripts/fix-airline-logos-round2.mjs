#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const UA = "SeenMarksBot/1.2 (brand-atlas airline logos; local)";
const normalizePy = join(root, "scripts", "normalize-mark-png.py");

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
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  const head = buf.slice(0, 120).toString("utf8").toLowerCase();
  if (head.includes("<svg")) return "image/svg+xml";
  return "image/png";
}

function normalize(buf) {
  const r = spawnSync("python3", [normalizePy], { input: buf, maxBuffer: 20_000_000 });
  if (r.status !== 0 || !r.stdout || r.stdout.length < 400) return null;
  return r.stdout;
}

async function fetchBuf(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function save(id, buf) {
  const mime = sniffMime(buf);
  const out = join(marksDir, `${id}.svg`);
  if (mime === "image/svg+xml") {
    let svg = buf.toString("utf8");
    if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#E8E8E8" ');
    else svg = svg.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
    writeFileSync(out, svg);
  } else {
    const norm = normalize(buf);
    if (!norm) throw new Error("normalize failed");
    writeFileSync(out, wrapImage(norm.toString("base64"), "image/png"));
  }
  console.log("OK", id, mime, buf.length);
}

function commons(file, w = 256) {
  return (
    "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(file) +
    `?width=${w}`
  );
}

async function wikiPageImage(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  const j = await res.json();
  return j.originalimage?.source || j.thumbnail?.source || null;
}

async function tryUrls(id, urls) {
  for (const url of urls) {
    try {
      const buf = await fetchBuf(url);
      if (buf.length < 500) continue;
      await save(id, buf);
      return true;
    } catch (e) {
      console.log("miss", id, String(e.message).slice(0, 100));
    }
  }
  return false;
}

const jobs = [
  ["airlines__xiamen", [commons("Xiamen Air Logo.svg"), "https://logo.clearbit.com/xiamenair.com"]],
  ["airlines__jeju", [commons("Jeju Air Logo.svg"), commons("Jeju Air Logo black.png"), "https://logo.clearbit.com/jejuair.net"]],
  ["airlines__tway", [commons("T'way Air logo.svg"), commons("T'way Airlines Logo.png")]],
  ["airlines__air-busan", [commons("Air Busan logo.svg")]],
  [
    "airlines__garuda",
    [
      "https://logo.clearbit.com/garuda-indonesia.com",
      commons("Garuda Indonesia 1969.png"),
      "https://www.google.com/s2/favicons?domain=garuda-indonesia.com&sz=128",
    ],
  ],
  ["airlines__juneyao", ["https://logo.clearbit.com/juneyaoair.com", "https://www.google.com/s2/favicons?domain=juneyaoair.com&sz=128"]],
  [
    "airlines__sichuan",
    [
      "https://logo.clearbit.com/sichuanair.com",
      "https://logo.clearbit.com/scal.com.cn",
      "https://www.google.com/s2/favicons?domain=sichuanair.com&sz=128",
    ],
  ],
  ["airlines__jin-air", ["https://logo.clearbit.com/jinair.com", "https://www.google.com/s2/favicons?domain=jinair.com&sz=128"]],
  [
    "airlines__fiji-airways",
    [
      "https://logo.clearbit.com/fijiairways.com",
      commons("Air Pacific logo.svg"),
      "https://www.google.com/s2/favicons?domain=fijiairways.com&sz=128",
    ],
  ],
];

const wikiTitles = {
  "airlines__garuda": "Garuda Indonesia",
  "airlines__juneyao": "Juneyao Air",
  "airlines__sichuan": "Sichuan Airlines",
  "airlines__jin-air": "Jin Air",
  "airlines__fiji-airways": "Fiji Airways",
  "airlines__xiamen": "XiamenAir",
  "airlines__jeju": "Jeju Air",
};

for (const [id, urls] of jobs) {
  let done = await tryUrls(id, urls);
  if (!done && wikiTitles[id]) {
    try {
      const img = await wikiPageImage(wikiTitles[id]);
      if (img) {
        console.log("wikiimg", id, img);
        done = await tryUrls(id, [img]);
      }
    } catch (e) {
      console.log("wikiimg fail", id, e.message);
    }
  }
  if (!done) console.log("FAILED", id);
}

// Final audit
const left = [];
for (const [id] of jobs) {
  const p = join(marksDir, `${id}.svg`);
  if (!existsSync(p) || readFileSync(p, "utf8").includes("<text")) left.push(id);
}
console.log(JSON.stringify({ remainingText: left }, null, 2));

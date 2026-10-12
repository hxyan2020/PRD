#!/usr/bin/env node
/**
 * Stamp nature marks with parametric silhouettes that read as the real
 * category form (tree / flower / bird / animal / fungus), with enough
 * per-id variation that a grid isn't 2 repeating blobs.
 *
 * FORCE=1 rewrites every nature mark.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

const FILL = "#D0D0D0";
const FORCE = process.env.FORCE === "1";

function svg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  ${body}
</svg>
`;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic floats in [0,1) from id + salt. */
function rnd(id, salt = 0) {
  const h = hash(`${id}#${salt}`);
  return (h % 10000) / 10000;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function kindFor(item) {
  const tags = item.tags || [];
  if (item.categoryId === "birds") return "bird";
  if (item.categoryId === "flowers") return "flower";
  if (item.categoryId === "trees") return "tree";
  if (item.categoryId === "mushrooms") return "mushroom";
  for (const k of ["bird", "insect", "arachnid", "fish", "reptile", "amphibian", "mammal", "mollusc"]) {
    if (tags.includes(k)) return k;
  }
  // animals shelf mixes mammals/insects/etc — sniff name
  const hay = `${item.id} ${item.name}`.toLowerCase();
  if (/bird|eagle|owl|duck|sparrow|hawk|finch|accipiter|corvus|turdus/.test(hay)) return "bird";
  if (
    /bee|ant|butterfly|moth|beetle|spider|insect|wasp|fly|hornet|termite|cicada|mantis|aphid|weevil|centipede|cockroach|cricket|acheta|formica|apis|bombus|papilio|coccinella|libellula|orthoptera|coleoptera|hymenoptera|lepidoptera|diptera|odonata|hemiptera|odonata/.test(
      hay,
    )
  ) {
    return "insect";
  }
  if (/fish|shark|tuna|salmon|pisc/.test(hay)) return "fish";
  if (/snake|lizard|turtle|frog|toad|crocodile|serpent|python/.test(hay)) return "reptile";
  return "mammal";
}

/* -------------------- FUNGI -------------------- */
function mushroomBody(id) {
  const style = Math.floor(rnd(id, 1) * 6); // 6 structural families
  const stemW = lerp(8, 22, rnd(id, 2));
  const stemH = lerp(28, 58, rnd(id, 3));
  const capW = lerp(36, 110, rnd(id, 4));
  const capH = lerp(14, 42, rnd(id, 5));
  const cx = 64;
  const stemTop = 118 - stemH;
  const capY = stemTop;
  const spots = Math.floor(rnd(id, 6) * 5);
  const lean = lerp(-10, 10, rnd(id, 7));

  let cap = "";
  if (style === 0) {
    // classic dome toadstool
    const rx = capW / 2;
    const ry = capH;
    cap = `<path fill="${FILL}" d="M${cx - rx} ${capY} A${rx} ${ry} 0 0 1 ${cx + rx} ${capY} L${cx + rx * 0.92} ${capY + 6} L${cx - rx * 0.92} ${capY + 6} Z"/>`;
  } else if (style === 1) {
    // flat / shelf oyster
    const rx = capW / 2;
    cap = `<ellipse cx="${cx + lean * 0.4}" cy="${capY}" rx="${rx}" ry="${capH * 0.7}" fill="${FILL}"/>`;
  } else if (style === 2) {
    // funnel / chanterelle
    const top = capW / 2;
    const throat = stemW * 1.4;
    cap = `<path fill="${FILL}" d="M${cx - top} ${capY - capH * 0.3} Q${cx} ${capY - capH} ${cx + top} ${capY - capH * 0.3} L${cx + throat} ${capY + 8} L${cx - throat} ${capY + 8} Z"/>`;
  } else if (style === 3) {
    // tall thin enoki-like cluster (2-3 stems)
    const n = 2 + Math.floor(rnd(id, 8) * 2);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const ox = lerp(-22, 22, (i + 0.5) / n) + lean * 0.2;
      const sw = lerp(5, 10, rnd(id, 10 + i));
      const sh = lerp(40, 70, rnd(id, 20 + i));
      const st = 118 - sh;
      const cw = lerp(14, 28, rnd(id, 30 + i));
      parts.push(
        `<ellipse cx="${cx + ox}" cy="${st}" rx="${cw / 2}" ry="${lerp(8, 14, rnd(id, 40 + i))}" fill="${FILL}"/>`,
        `<rect x="${cx + ox - sw / 2}" y="${st}" width="${sw}" height="${sh}" rx="2" fill="${FILL}"/>`,
      );
    }
    return parts.join("");
  } else if (style === 4) {
    // morel / conical pitted
    const top = capW * 0.28;
    const bot = capW * 0.42;
    cap = `<path fill="${FILL}" d="M${cx - top} ${capY - capH} L${cx + top} ${capY - capH} L${cx + bot} ${capY + 4} L${cx - bot} ${capY + 4} Z"/>`;
    for (let i = 0; i < 4; i++) {
      const px = cx + lerp(-bot * 0.5, bot * 0.5, rnd(id, 50 + i));
      const py = capY - lerp(4, capH * 0.8, rnd(id, 60 + i));
      cap += `<circle cx="${px}" cy="${py}" r="2.2" fill="#8A8A8A"/>`;
    }
  } else {
    // umbrella with skirt ring
    const rx = capW / 2;
    const ry = capH;
    cap = `<path fill="${FILL}" d="M${cx - rx} ${capY} A${rx} ${ry} 0 0 1 ${cx + rx} ${capY} L${cx + stemW} ${capY + 8} L${cx - stemW} ${capY + 8} Z"/>`;
    cap += `<ellipse cx="${cx}" cy="${capY + stemH * 0.35}" rx="${stemW * 1.3}" ry="3" fill="${FILL}"/>`;
  }

  let dots = "";
  for (let i = 0; i < spots; i++) {
    const px = cx + lerp(-capW * 0.35, capW * 0.35, rnd(id, 70 + i));
    const py = capY - lerp(2, capH * 0.7, rnd(id, 80 + i));
    dots += `<circle cx="${px}" cy="${py}" r="${lerp(2, 4.5, rnd(id, 90 + i))}" fill="#8A8A8A"/>`;
  }

  const stem = `<rect x="${cx - stemW / 2 + lean * 0.15}" y="${stemTop}" width="${stemW}" height="${stemH}" rx="${Math.min(4, stemW / 3)}" fill="${FILL}"/>`;
  const base = `<ellipse cx="${cx}" cy="118" rx="${stemW * 1.5}" ry="4" fill="${FILL}" opacity="0.55"/>`;
  return `${cap}${dots}${stem}${base}`;
}

/* -------------------- TREES -------------------- */
function treeBody(id) {
  const style = Math.floor(rnd(id, 1) * 6);
  const trunkW = lerp(8, 18, rnd(id, 2));
  const trunkH = lerp(28, 52, rnd(id, 3));
  const crownR = lerp(28, 48, rnd(id, 4));
  const cx = 64;
  const trunkTop = 118 - trunkH;
  const trunk = `<rect x="${cx - trunkW / 2}" y="${trunkTop}" width="${trunkW}" height="${trunkH}" rx="2" fill="${FILL}"/>`;

  if (style === 0) {
    // round deciduous
    return `<ellipse cx="${cx}" cy="${trunkTop - crownR * 0.35}" rx="${crownR}" ry="${crownR * 0.85}" fill="${FILL}"/>${trunk}`;
  }
  if (style === 1) {
    // pine tiers
    const tiers = 3 + Math.floor(rnd(id, 5) * 2);
    let paths = "";
    let y = 14 + rnd(id, 6) * 8;
    for (let i = 0; i < tiers; i++) {
      const w = lerp(22, 56, (i + 1) / tiers) * lerp(0.85, 1.15, rnd(id, 10 + i));
      const h = lerp(18, 28, rnd(id, 20 + i));
      paths += `<path fill="${FILL}" d="M${cx} ${y} L${cx + w / 2} ${y + h} L${cx - w / 2} ${y + h} Z"/>`;
      y += h * 0.62;
    }
    return `${paths}${trunk}`;
  }
  if (style === 2) {
    // palm fronds
    let fronds = "";
    const n = 5 + Math.floor(rnd(id, 7) * 3);
    for (let i = 0; i < n; i++) {
      const ang = lerp(-140, -40, i / (n - 1)) + lerp(-8, 8, rnd(id, 30 + i));
      const rad = (ang * Math.PI) / 180;
      const len = lerp(34, 52, rnd(id, 40 + i));
      const x2 = cx + Math.cos(rad) * len;
      const y2 = trunkTop - 4 + Math.sin(rad) * len * 0.55;
      fronds += `<path fill="${FILL}" d="M${cx} ${trunkTop} Q${(cx + x2) / 2} ${trunkTop - 18} ${x2} ${y2} L${x2 + 4} ${y2 + 6} Q${(cx + x2) / 2 + 4} ${trunkTop - 8} ${cx + 3} ${trunkTop + 2} Z"/>`;
    }
    return `${fronds}${trunk}`;
  }
  if (style === 3) {
    // oak irregular multi-lobe
    const lobes = [];
    const n = 4 + Math.floor(rnd(id, 8) * 3);
    for (let i = 0; i < n; i++) {
      const ox = lerp(-crownR * 0.7, crownR * 0.7, rnd(id, 50 + i));
      const oy = lerp(-crownR * 0.9, crownR * 0.2, rnd(id, 60 + i));
      const r = lerp(16, 28, rnd(id, 70 + i));
      lobes.push(`<circle cx="${cx + ox}" cy="${trunkTop + oy}" r="${r}" fill="${FILL}"/>`);
    }
    return `${lobes.join("")}${trunk}`;
  }
  if (style === 4) {
    // willow droop
    let droop = `<ellipse cx="${cx}" cy="${trunkTop - 18}" rx="${crownR * 0.85}" ry="20" fill="${FILL}"/>`;
    for (let i = 0; i < 7; i++) {
      const x = cx + lerp(-crownR * 0.8, crownR * 0.8, i / 6);
      const len = lerp(28, 48, rnd(id, 80 + i));
      droop += `<path fill="none" stroke="${FILL}" stroke-width="3" stroke-linecap="round" d="M${x} ${trunkTop - 10} Q${x + lerp(-6, 6, rnd(id, 90 + i))} ${trunkTop + len * 0.4} ${x + lerp(-4, 4, rnd(id, 100 + i))} ${trunkTop + len}"/>`;
    }
    return `${droop}${trunk}`;
  }
  // cypress / columnar
  const top = trunkTop - lerp(50, 70, rnd(id, 9));
  return `<path fill="${FILL}" d="M${cx} ${top} L${cx + trunkW * 1.8} ${trunkTop} L${cx - trunkW * 1.8} ${trunkTop} Z"/><ellipse cx="${cx}" cy="${(top + trunkTop) / 2}" rx="${trunkW * 1.6}" ry="${(trunkTop - top) * 0.45}" fill="${FILL}"/>${trunk}`;
}

/* -------------------- FLOWERS -------------------- */
function flowerBody(id) {
  const style = Math.floor(rnd(id, 1) * 5);
  const petals = 4 + Math.floor(rnd(id, 2) * 6); // 4..9
  const petalLen = lerp(16, 32, rnd(id, 3));
  const petalW = lerp(7, 16, rnd(id, 4));
  const centerR = lerp(6, 14, rnd(id, 5));
  const stemH = lerp(36, 56, rnd(id, 6));
  const cy = 48;
  const cx = 64;
  const stem = `<rect x="${cx - 3}" y="${cy + centerR}" width="6" height="${stemH}" rx="2" fill="${FILL}"/>`;
  const leaf =
    rnd(id, 7) > 0.35
      ? `<ellipse cx="${cx - 14}" cy="${cy + centerR + stemH * 0.45}" rx="12" ry="5" transform="rotate(-35 ${cx - 14} ${cy + centerR + stemH * 0.45})" fill="${FILL}"/>`
      : "";

  if (style === 0) {
    // daisy radial
    let p = "";
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2 + rnd(id, 10) * 0.2;
      const px = cx + Math.cos(ang) * (centerR + petalLen * 0.35);
      const py = cy + Math.sin(ang) * (centerR + petalLen * 0.35);
      const deg = (ang * 180) / Math.PI;
      p += `<ellipse cx="${px}" cy="${py}" rx="${petalW}" ry="${petalLen}" transform="rotate(${deg} ${px} ${py})" fill="${FILL}"/>`;
    }
    return `${p}<circle cx="${cx}" cy="${cy}" r="${centerR}" fill="${FILL}"/>${stem}${leaf}`;
  }
  if (style === 1) {
    // tulip cup
    const w = lerp(22, 36, rnd(id, 8));
    const h = lerp(28, 42, rnd(id, 9));
    return `<path fill="${FILL}" d="M${cx - w} ${cy + 8} Q${cx - w * 0.3} ${cy - h} ${cx} ${cy - h * 0.55} Q${cx + w * 0.3} ${cy - h} ${cx + w} ${cy + 8} Q${cx} ${cy + 16} ${cx - w} ${cy + 8} Z"/>${stem}${leaf}`;
  }
  if (style === 2) {
    // rose layered circles
    return `<circle cx="${cx}" cy="${cy}" r="${centerR + petalLen * 0.7}" fill="${FILL}"/><circle cx="${cx}" cy="${cy}" r="${centerR + petalLen * 0.4}" fill="#A8A8A8"/><circle cx="${cx}" cy="${cy}" r="${centerR}" fill="${FILL}"/>${stem}${leaf}`;
  }
  if (style === 3) {
    // orchid asymmetric
    return `<ellipse cx="${cx - 18}" cy="${cy - 4}" rx="${petalLen * 0.7}" ry="${petalW * 1.4}" transform="rotate(-25 ${cx - 18} ${cy - 4})" fill="${FILL}"/><ellipse cx="${cx + 18}" cy="${cy - 4}" rx="${petalLen * 0.7}" ry="${petalW * 1.4}" transform="rotate(25 ${cx + 18} ${cy - 4})" fill="${FILL}"/><ellipse cx="${cx}" cy="${cy + 10}" rx="${petalW * 1.2}" ry="${petalLen * 0.85}" fill="${FILL}"/><circle cx="${cx}" cy="${cy}" r="${centerR * 0.7}" fill="${FILL}"/>${stem}${leaf}`;
  }
  // sunflower
  let p = "";
  const n = petals + 4;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const px = cx + Math.cos(ang) * (centerR + 12);
    const py = cy + Math.sin(ang) * (centerR + 12);
    const deg = (ang * 180) / Math.PI;
    p += `<ellipse cx="${px}" cy="${py}" rx="6" ry="${petalLen * 0.7}" transform="rotate(${deg} ${px} ${py})" fill="${FILL}"/>`;
  }
  return `${p}<circle cx="${cx}" cy="${cy}" r="${centerR * 1.2}" fill="${FILL}"/><circle cx="${cx}" cy="${cy}" r="${centerR * 0.55}" fill="#8A8A8A"/>${stem}${leaf}`;
}

/* -------------------- BIRDS -------------------- */
function birdBody(id) {
  const style = Math.floor(rnd(id, 1) * 5);
  const bodyW = lerp(22, 36, rnd(id, 2));
  const bodyH = lerp(14, 24, rnd(id, 3));
  const cx = 64;
  const cy = 68;

  if (style === 0) {
    // side-profile songbird
    const headR = lerp(8, 14, rnd(id, 4));
    const beak = lerp(8, 16, rnd(id, 5));
    const tail = lerp(14, 28, rnd(id, 6));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW}" ry="${bodyH}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.75}" cy="${cy - bodyH * 0.35}" r="${headR}" fill="${FILL}"/><path fill="${FILL}" d="M${cx + bodyW * 0.75 + headR * 0.6} ${cy - bodyH * 0.35} L${cx + bodyW * 0.75 + headR + beak} ${cy - bodyH * 0.2} L${cx + bodyW * 0.75 + headR * 0.6} ${cy - bodyH * 0.1} Z"/><path fill="${FILL}" d="M${cx - bodyW * 0.8} ${cy} L${cx - bodyW - tail} ${cy - tail * 0.4} L${cx - bodyW * 0.7} ${cy + 6} Z"/><circle cx="${cx + bodyW * 0.85}" cy="${cy - bodyH * 0.45}" r="2" fill="#6A6A6A"/><path fill="${FILL}" d="M${cx - 4} ${cy + bodyH * 0.7} L${cx - 8} ${cy + bodyH + 14} M${cx + 6} ${cy + bodyH * 0.7} L${cx + 10} ${cy + bodyH + 12}"/>`;
  }
  if (style === 1) {
    // raptor wings open
    const span = lerp(48, 58, rnd(id, 7));
    return `<path fill="${FILL}" d="M${cx} ${cy - 8} L${cx - span} ${cy + 18} L${cx - span + 10} ${cy + 28} L${cx - 8} ${cy + 6} L${cx - 8} ${cy + 34} L${cx + 8} ${cy + 34} L${cx + 8} ${cy + 6} L${cx + span - 10} ${cy + 28} L${cx + span} ${cy + 18} Z"/><circle cx="${cx}" cy="${cy - 14}" r="10" fill="${FILL}"/><path fill="${FILL}" d="M${cx + 6} ${cy - 14} L${cx + 18} ${cy - 10} L${cx + 6} ${cy - 8} Z"/>`;
  }
  if (style === 2) {
    // owl face
    const r = lerp(28, 38, rnd(id, 8));
    const eye = lerp(8, 13, rnd(id, 9));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.85}" ry="${r}" fill="${FILL}"/><circle cx="${cx - r * 0.35}" cy="${cy - 6}" r="${eye}" fill="#9A9A9A"/><circle cx="${cx + r * 0.35}" cy="${cy - 6}" r="${eye}" fill="#9A9A9A"/><circle cx="${cx - r * 0.35}" cy="${cy - 6}" r="${eye * 0.4}" fill="#4A4A4A"/><circle cx="${cx + r * 0.35}" cy="${cy - 6}" r="${eye * 0.4}" fill="#4A4A4A"/><path fill="${FILL}" d="M${cx} ${cy + 4} L${cx - 8} ${cy + 16} L${cx + 8} ${cy + 16} Z"/><path fill="${FILL}" d="M${cx - r * 0.7} ${cy - r * 0.7} L${cx - r * 0.35} ${cy - r * 0.2} L${cx - r * 0.15} ${cy - r * 0.55} Z M${cx + r * 0.7} ${cy - r * 0.7} L${cx + r * 0.35} ${cy - r * 0.2} L${cx + r * 0.15} ${cy - r * 0.55} Z"/>`;
  }
  if (style === 3) {
    // long-neck wader
    const neck = lerp(28, 44, rnd(id, 10));
    return `<ellipse cx="${cx - 8}" cy="${cy + 10}" rx="${bodyW}" ry="${bodyH}" fill="${FILL}"/><path fill="${FILL}" d="M${cx + 8} ${cy} Q${cx + 18} ${cy - neck * 0.5} ${cx + 10} ${cy - neck}"/><circle cx="${cx + 12}" cy="${cy - neck}" r="9" fill="${FILL}"/><path fill="${FILL}" d="M${cx + 18} ${cy - neck} L${cx + 30} ${cy - neck + 4} L${cx + 18} ${cy - neck + 6} Z"/><path fill="${FILL}" d="M${cx - 4} ${cy + bodyH} L${cx - 6} ${cy + bodyH + 28} M${cx + 8} ${cy + bodyH} L${cx + 12} ${cy + bodyH + 26}"/>`;
  }
  // duck
  return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW * 1.1}" ry="${bodyH}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.85}" cy="${cy - 8}" r="12" fill="${FILL}"/><path fill="${FILL}" d="M${cx + bodyW * 0.85 + 8} ${cy - 6} L${cx + bodyW * 0.85 + 22} ${cy - 2} L${cx + bodyW * 0.85 + 8} ${cy + 2} Z"/><path fill="${FILL}" d="M${cx - bodyW} ${cy - 4} Q${cx - bodyW - 8} ${cy - 20} ${cx - bodyW + 10} ${cy - 8}"/><circle cx="${cx + bodyW * 0.95}" cy="${cy - 10}" r="2" fill="#6A6A6A"/>`;
}

/* -------------------- ANIMALS / INSECTS / etc -------------------- */
function mammalBody(id) {
  const style = Math.floor(rnd(id, 1) * 7);
  const bodyW = lerp(24, 42, rnd(id, 2));
  const bodyH = lerp(14, 28, rnd(id, 3));
  const cx = 56 + lerp(-4, 6, rnd(id, 11));
  const cy = 68 + lerp(-4, 6, rnd(id, 12));
  const legH = lerp(16, 34, rnd(id, 4));
  const legW = lerp(5, 10, rnd(id, 13));
  const legs = `<path fill="${FILL}" d="M${cx - bodyW * 0.55} ${cy + bodyH * 0.5} V${cy + bodyH * 0.5 + legH} H${cx - bodyW * 0.55 + legW} V${cy + bodyH * 0.5} M${cx - bodyW * 0.15} ${cy + bodyH * 0.5} V${cy + bodyH * 0.5 + legH} H${cx - bodyW * 0.15 + legW} V${cy + bodyH * 0.5} M${cx + bodyW * 0.2} ${cy + bodyH * 0.5} V${cy + bodyH * 0.5 + legH} H${cx + bodyW * 0.2 + legW} V${cy + bodyH * 0.5} M${cx + bodyW * 0.55} ${cy + bodyH * 0.5} V${cy + bodyH * 0.5 + legH} H${cx + bodyW * 0.55 + legW} V${cy + bodyH * 0.5}"/>`;

  if (style === 0) {
    const headR = lerp(9, 18, rnd(id, 5));
    const snout = lerp(6, 14, rnd(id, 6));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW}" ry="${bodyH}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.9}" cy="${cy - bodyH * 0.35}" r="${headR}" fill="${FILL}"/>${legs}<path fill="${FILL}" d="M${cx + bodyW * 0.9 + headR * 0.5} ${cy - bodyH * 0.4} L${cx + bodyW * 0.9 + headR + snout} ${cy - bodyH * 0.25} L${cx + bodyW * 0.9 + headR * 0.5} ${cy - bodyH * 0.15} Z"/>`;
  }
  if (style === 1) {
    const ear = lerp(8, 16, rnd(id, 5));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW}" ry="${bodyH * 0.85}" fill="${FILL}"/><path fill="${FILL}" d="M${cx + bodyW * 0.7} ${cy - bodyH} L${cx + bodyW * 0.85} ${cy - bodyH * 0.4} L${cx + bodyW * 1.15} ${cy - bodyH * 0.5} L${cx + bodyW * 0.95} ${cy - bodyH - ear * 0.15} Z"/><circle cx="${cx + bodyW * 0.95}" cy="${cy - bodyH * 0.55}" r="${lerp(9, 14, rnd(id, 6))}" fill="${FILL}"/>${legs}<path fill="${FILL}" d="M${cx - bodyW} ${cy} Q${cx - bodyW - lerp(10, 20, rnd(id, 7))} ${cy - lerp(12, 22, rnd(id, 8))} ${cx - bodyW + 4} ${cy - 8}"/>`;
  }
  if (style === 2) {
    const headR = lerp(9, 14, rnd(id, 5));
    const antler = lerp(12, 24, rnd(id, 6));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW * 0.85}" ry="${bodyH}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.85}" cy="${cy - bodyH * 0.6}" r="${headR}" fill="${FILL}"/><path fill="${FILL}" d="M${cx + bodyW * 0.7} ${cy - bodyH * 0.9} L${cx + bodyW * 0.55} ${cy - bodyH * 0.9 - antler} M${cx + bodyW * 0.75} ${cy - bodyH * 1.15} L${cx + bodyW * 0.62} ${cy - bodyH * 0.9 - antler * 1.15} M${cx + bodyW} ${cy - bodyH * 0.9} L${cx + bodyW * 1.15} ${cy - bodyH * 0.9 - antler} M${cx + bodyW * 0.95} ${cy - bodyH * 1.15} L${cx + bodyW * 1.12} ${cy - bodyH * 0.9 - antler * 1.15}"/>${legs}`;
  }
  if (style === 3) {
    const ear = lerp(20, 36, rnd(id, 5));
    return `<ellipse cx="${cx}" cy="${cy + 4}" rx="${bodyW * 0.7}" ry="${bodyH * 1.1}" fill="${FILL}"/><path fill="${FILL}" d="M${cx - 10} ${cy - bodyH} Q${cx - 14} ${cy - bodyH - ear} ${cx - 4} ${cy - bodyH + 4} M${cx + 6} ${cy - bodyH} Q${cx + 12} ${cy - bodyH - ear} ${cx + 2} ${cy - bodyH + 4}"/><circle cx="${cx}" cy="${cy - bodyH * 0.3}" r="${lerp(11, 17, rnd(id, 6))}" fill="${FILL}"/>${legs}`;
  }
  if (style === 4) {
    const trunk = lerp(24, 44, rnd(id, 5));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW}" ry="${bodyH * 1.15}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.85}" cy="${cy - 4}" r="${lerp(12, 18, rnd(id, 6))}" fill="${FILL}"/><path fill="${FILL}" d="M${cx + bodyW * 0.95} ${cy + 6} Q${cx + bodyW * 1.25} ${cy + trunk * 0.55} ${cx + bodyW * 0.85} ${cy + trunk}"/><path fill="${FILL}" d="M${cx + bodyW * 0.55} ${cy - 8} Q${cx + bodyW * 0.3} ${cy - 28} ${cx + bodyW * 0.7} ${cy - 18}"/>${legs}`;
  }
  if (style === 5) {
    const ear = lerp(5, 10, rnd(id, 5));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW}" ry="${bodyH * 1.2}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.7}" cy="${cy - bodyH * 0.5}" r="${lerp(12, 18, rnd(id, 6))}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.45}" cy="${cy - bodyH * 1.05}" r="${ear}" fill="${FILL}"/><circle cx="${cx + bodyW * 0.95}" cy="${cy - bodyH * 1.05}" r="${ear}" fill="${FILL}"/>${legs}`;
  }
  const neck = lerp(0.8, 1.25, rnd(id, 5));
  return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW}" ry="${bodyH}" fill="${FILL}"/><path fill="${FILL}" d="M${cx + bodyW * 0.7} ${cy - bodyH * 0.3} L${cx + bodyW * 1.1} ${cy - bodyH * neck} L${cx + bodyW * 1.35} ${cy - bodyH * (neck - 0.2)} L${cx + bodyW * 0.95} ${cy - bodyH * 0.1} Z"/><path fill="${FILL}" d="M${cx + bodyW * 1.2} ${cy - bodyH * neck} L${cx + bodyW * 1.5} ${cy - bodyH * (neck - 0.3)}"/>${legs}<path fill="${FILL}" d="M${cx - bodyW} ${cy - 4} Q${cx - bodyW - 8} ${cy - 22} ${cx - bodyW + 8} ${cy - 10}"/>`;
}

function insectBody(id) {
  const style = Math.floor(rnd(id, 1) * 5);
  const cx = 64;
  const cy = 64 + lerp(-6, 8, rnd(id, 2));
  if (style === 0) {
    // butterfly — wing span / asymmetry vary
    const wing = lerp(24, 48, rnd(id, 3));
    const lift = lerp(0.7, 1.2, rnd(id, 4));
    const bodyH = lerp(40, 64, rnd(id, 5));
    return `<path fill="${FILL}" d="M${cx} ${cy} C${cx - wing} ${cy - wing * lift} ${cx - wing * 1.15} ${cy - 8} ${cx - 6} ${cy - 2} C${cx - wing} ${cy + 18} ${cx - wing * 0.65} ${cy + wing * 0.65} ${cx} ${cy} C${cx + wing * 0.65} ${cy + wing * 0.65} ${cx + wing} ${cy + 18} ${cx + 6} ${cy - 2} C${cx + wing * 1.15} ${cy - 8} ${cx + wing} ${cy - wing * lift} ${cx} ${cy} Z"/><rect x="${cx - 2}" y="${cy - bodyH * 0.45}" width="4" height="${bodyH}" rx="2" fill="${FILL}"/>`;
  }
  if (style === 1) {
    // beetle — body proportions + leg splay
    const rx = lerp(18, 34, rnd(id, 3));
    const ry = lerp(12, 22, rnd(id, 4));
    const head = lerp(7, 14, rnd(id, 5));
    const leg = lerp(12, 24, rnd(id, 6));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${FILL}"/><circle cx="${cx + rx * 0.95}" cy="${cy - ry * 0.25}" r="${head}" fill="${FILL}"/><path fill="${FILL}" d="M${cx - rx * 0.7} ${cy} L${cx - rx - leg * 0.6} ${cy + leg * 0.7} M${cx - rx * 0.3} ${cy - ry * 0.4} L${cx - rx - leg * 0.3} ${cy - leg} M${cx + rx * 1.05} ${cy - ry * 0.3} L${cx + rx + leg * 0.5} ${cy - leg * 0.9}"/>`;
  }
  if (style === 2) {
    // ant — segment sizes
    const h1 = lerp(7, 13, rnd(id, 3));
    const h2 = lerp(7, 12, rnd(id, 4));
    const h3 = lerp(12, 20, rnd(id, 5));
    const gap = lerp(14, 22, rnd(id, 6));
    return `<circle cx="${cx}" cy="${cy - gap}" r="${h1}" fill="${FILL}"/><ellipse cx="${cx}" cy="${cy}" rx="${h2}" ry="${h2 + 1}" fill="${FILL}"/><ellipse cx="${cx}" cy="${cy + gap}" rx="${h3 * 0.75}" ry="${h3}" fill="${FILL}"/><path fill="${FILL}" d="M${cx - h1 * 0.7} ${cy - gap} L${cx - h1 - 14} ${cy - gap - 12} M${cx + h1 * 0.7} ${cy - gap} L${cx + h1 + 14} ${cy - gap - 12} M${cx - h2} ${cy} H${cx - h2 - 18} M${cx + h2} ${cy} H${cx + h2 + 18}"/>`;
  }
  if (style === 3) {
    // bee — stripe count + wing size
    const rx = lerp(18, 30, rnd(id, 3));
    const ry = lerp(12, 20, rnd(id, 4));
    const wing = lerp(14, 28, rnd(id, 5));
    let stripes = "";
    const n = 2 + Math.floor(rnd(id, 6) * 3);
    for (let i = 0; i < n; i++) {
      const y = cy - ry * 0.5 + (i + 0.5) * ((ry) / n);
      stripes += `<rect x="${cx - rx * 0.55}" y="${y}" width="${rx * 1.1}" height="3.5" fill="#8A8A8A"/>`;
    }
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${FILL}"/>${stripes}<path fill="${FILL}" d="M${cx - rx * 0.5} ${cy - ry * 0.4} C${cx - rx - wing * 0.3} ${cy - ry - wing * 0.4} ${cx - 4} ${cy - ry - wing * 0.5} ${cx - 4} ${cy - ry * 0.2} M${cx + rx * 0.5} ${cy - ry * 0.4} C${cx + rx + wing * 0.3} ${cy - ry - wing * 0.4} ${cx + 4} ${cy - ry - wing * 0.5} ${cx + 4} ${cy - ry * 0.2}"/><circle cx="${cx + rx * 0.95}" cy="${cy}" r="${lerp(5, 10, rnd(id, 7))}" fill="${FILL}"/>`;
  }
  // spider — abdomen/leg length vary
  const body = lerp(10, 18, rnd(id, 3));
  const head = lerp(6, 12, rnd(id, 4));
  const leg = lerp(22, 40, rnd(id, 5));
  return `<circle cx="${cx}" cy="${cy}" r="${body}" fill="${FILL}"/><circle cx="${cx}" cy="${cy - body * 0.95}" r="${head}" fill="${FILL}"/><path fill="${FILL}" d="M${cx - body * 0.8} ${cy - 4} L${cx - leg} ${cy - leg * 0.55} M${cx - body * 0.9} ${cy + 2} H${cx - leg - 4} M${cx - body * 0.8} ${cy + 8} L${cx - leg} ${cy + leg * 0.55} M${cx + body * 0.8} ${cy - 4} L${cx + leg} ${cy - leg * 0.55} M${cx + body * 0.9} ${cy + 2} H${cx + leg + 4} M${cx + body * 0.8} ${cy + 8} L${cx + leg} ${cy + leg * 0.55}"/>`;
}

function fishBody(id) {
  const bodyW = lerp(36, 52, rnd(id, 1));
  const bodyH = lerp(14, 24, rnd(id, 2));
  const cx = 60;
  const cy = 64;
  const tail = lerp(14, 26, rnd(id, 3));
  return `<ellipse cx="${cx}" cy="${cy}" rx="${bodyW}" ry="${bodyH}" fill="${FILL}"/><path fill="${FILL}" d="M${cx - bodyW * 0.85} ${cy} L${cx - bodyW - tail} ${cy - tail * 0.7} L${cx - bodyW - 4} ${cy} L${cx - bodyW - tail} ${cy + tail * 0.7} Z"/><path fill="${FILL}" d="M${cx + 4} ${cy - bodyH * 0.7} L${cx + 12} ${cy - bodyH - 10} L${cx + 20} ${cy - bodyH * 0.5} Z"/><circle cx="${cx + bodyW * 0.55}" cy="${cy - 4}" r="3" fill="#6A6A6A"/>`;
}

function reptileBody(id) {
  const style = Math.floor(rnd(id, 1) * 3);
  if (style === 0) {
    // lizard
    return `<ellipse cx="58" cy="70" rx="40" ry="14" fill="${FILL}"/><circle cx="100" cy="64" r="11" fill="${FILL}"/><path fill="${FILL}" d="M30 82 L14 104 M48 86 L40 112 M70 86 L78 112 M90 82 L108 100 M108 60 L118 50"/>`;
  }
  if (style === 1) {
    // snake
    return `<path fill="${FILL}" d="M18 40 C40 20 60 40 70 58 C80 78 100 82 116 64 C100 90 74 92 58 72 C46 58 28 52 18 62 Z"/>`;
  }
  // turtle
  return `<ellipse cx="64" cy="70" rx="40" ry="24" fill="${FILL}"/><circle cx="106" cy="68" r="12" fill="${FILL}"/><path fill="${FILL}" d="M28 58 C12 58 10 78 22 80 M70 42 C70 26 90 24 92 40 M48 44 L64 66 L80 44"/>`;
}

function bodyFor(item) {
  const kind = kindFor(item);
  if (kind === "mushroom") return mushroomBody(item.id);
  if (kind === "tree") return treeBody(item.id);
  if (kind === "flower") return flowerBody(item.id);
  if (kind === "bird") return birdBody(item.id);
  if (kind === "insect" || kind === "arachnid") return insectBody(item.id);
  if (kind === "fish" || kind === "mollusc") return fishBody(item.id);
  if (kind === "reptile" || kind === "amphibian") return reptileBody(item.id);
  return mammalBody(item.id);
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const nature = catalog.items.filter((it) =>
  ["animals", "birds", "flowers", "trees", "mushrooms"].includes(it.categoryId),
);

let wrote = 0;
let skipped = 0;
for (const item of nature) {
  const out = join(marksDir, `${item.id}.svg`);
  if (!FORCE && existsSync(out) && readFileSync(out, "utf8").includes("data:image")) {
    skipped += 1;
    continue;
  }
  writeFileSync(out, svg(bodyFor(item)));
  wrote += 1;
}

console.log(JSON.stringify({ nature: nature.length, wrote, skipped, force: FORCE }, null, 2));

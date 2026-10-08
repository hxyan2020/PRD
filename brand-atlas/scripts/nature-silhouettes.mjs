#!/usr/bin/env node
/**
 * Write recognizable grey silhouette SVGs for trees / flowers / animals
 * so locked tiles match the car-brand look (shape mark, not monogram).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const marksDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "marks");
mkdirSync(marksDir, { recursive: true });

const FILL = "#C4C4C4";

function svg(paths, viewBox = "0 0 128 128") {
  const body = paths
    .map((d) =>
      typeof d === "string"
        ? `<path fill="${FILL}" d="${d}"/>`
        : `<${d.tag} ${Object.entries(d.attrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(" ")}/>`,
    )
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img">
  ${body}
</svg>
`;
}

/** Shared tree canopy helpers */
const TREES = {
  oak: [
    "M64 18c-18 0-32 12-34 28-10 2-18 12-18 24 0 14 11 26 26 28v22h12V98h16v22h12V98c15-2 26-14 26-28 0-12-8-22-18-24-2-16-16-28-34-28z",
  ],
  maple: [
    "M64 12l8 22 24-6-14 20 22 14-24 4 4 24-20-14-20 14 4-24-24-4 22-14-14-20 24 6z M58 78h12v38H58z",
  ],
  pine: [
    "M64 8L40 40h10L36 60h12L32 84h20v36h24V84h20L80 60h12L78 40h10z",
  ],
  cedar: [
    "M64 6L44 32h8L40 52h10L38 72h12L36 92h56L80 72h12L78 52h10L76 32h8z M58 92h12v28H58z",
  ],
  birch: [
    "M60 20h8v88h-8z M52 28c8-10 16-10 24 0 M48 48c10-12 22-12 32 0 M50 68c9-10 19-10 28 0",
    { tag: "ellipse", attrs: { cx: "64", cy: "22", rx: "18", ry: "14", fill: FILL } },
  ],
  willow: [
    "M64 16c-20 0-36 14-36 32 0 4 1 8 3 11 M40 48c0 0 4 40 8 52 M52 52c0 0 2 44 4 52 M64 54c0 0 0 48 0 52 M76 52c0 0-2 44-4 52 M88 48c0 0-4 40-8 52 M64 16c20 0 36 14 36 32",
    { tag: "ellipse", attrs: { cx: "64", cy: "30", rx: "28", ry: "18", fill: FILL } },
  ],
  "cherry-blossom": [
    "M64 40c0-8 6-14 0-22 8 0 14 6 22 0-6 8 0 14 0 22 8 0 14 6 22 0-8 6-6 14-14 14 0 8-6 14 0 22-8 0-14-6-22 0 6-8 0-14 0-22-8 0-14-6-22 0 8-6 6-14 14-14z",
    { tag: "circle", attrs: { cx: "64", cy: "54", r: "8", fill: FILL } },
    "M60 78h8v42h-8z",
  ],
  ginkgo: [
    "M64 20c-28 8-40 36-28 56 8-20 24-28 28-28s20 8 28 28c12-20 0-48-28-56z M60 76h8v44h-8z",
  ],
  baobab: [
    "M40 50c0-22 10-36 24-36s24 14 24 36c18 4 28 18 28 34H12c0-16 10-30 28-34z M56 84h16v36H56z M36 70l-12 20 M92 70l12 20 M48 66l-8 24 M80 66l8 24",
  ],
  sequoia: [
    "M64 6c-8 20-20 40-22 70h44c-2-30-14-50-22-70z M50 76h28v44H50z",
  ],
  redwood: [
    "M64 4c-10 18-24 42-26 72h52c-2-30-16-54-26-72z M48 76h32v44H48z",
  ],
  palm: [
    "M64 48c-4-20-20-36-36-40 16 8 28 24 32 40 4-20 20-36 36-40-16 8-28 24-32 40z M60 48h8v72h-8z M40 40c8 4 16 12 20 20 M88 40c-8 4-16 12-20 20 M32 56c12 2 20 8 24 16 M96 56c-12 2-20 8-24 16",
  ],
  olive: [
    { tag: "ellipse", attrs: { cx: "64", cy: "40", rx: "36", ry: "28", fill: FILL } },
    "M60 64h8v56h-8z M40 36c8 4 12 12 8 20 M88 36c-8 4-12 12-8 20",
  ],
  fig: [
    { tag: "ellipse", attrs: { cx: "64", cy: "44", rx: "40", ry: "32", fill: FILL } },
    "M58 70h12v50H58z",
  ],
  eucalyptus: [
    { tag: "ellipse", attrs: { cx: "64", cy: "36", rx: "22", ry: "30", fill: FILL } },
    "M60 60h8v60h-8z M48 28c-10 4-14 14-10 22 M80 28c10 4 14 14 10 22",
  ],
  cypress: [
    "M64 8c-10 20-16 48-16 80h32c0-32-6-60-16-80z M56 88h16v32H56z",
  ],
  elm: [
    { tag: "ellipse", attrs: { cx: "64", cy: "42", rx: "42", ry: "30", fill: FILL } },
    "M58 68h12v52H58z",
  ],
  ash: [
    { tag: "ellipse", attrs: { cx: "64", cy: "40", rx: "34", ry: "28", fill: FILL } },
    "M60 64h8v56h-8z M44 30l-8 16 M84 30l8 16",
  ],
  beech: [
    { tag: "ellipse", attrs: { cx: "64", cy: "44", rx: "38", ry: "34", fill: FILL } },
    "M58 72h12v48H58z",
  ],
  spruce: [
    "M64 6L42 36h10L38 56h12L34 78h20v42h20V78h20L78 56h12L76 36h10z",
  ],
  fir: [
    "M64 4L46 30h8L42 50h10L38 72h16v48h20V72h16L76 50h10L74 30h8z",
  ],
  jacaranda: [
    { tag: "ellipse", attrs: { cx: "64", cy: "38", rx: "40", ry: "26", fill: FILL } },
    "M58 58h12v62H58z M36 32c6-8 14-8 20 0 M72 28c6-8 14-8 20 0",
  ],
  magnolia: [
    "M64 24c-6-14 6-18 0-28 10 4 16 14 16 28 10-4 22 4 18 16-8-2-14 2-18 10 4 10-2 22-14 22s-18-12-14-22c-4-8-10-12-18-10-4-12 8-20 18-16z M60 72h8v48h-8z",
  ],
  poplar: [
    "M64 8c-12 16-18 40-18 72h36c0-32-6-56-18-72z M58 80h12v40H58z",
  ],
  plane: [
    { tag: "ellipse", attrs: { cx: "64", cy: "40", rx: "44", ry: "32", fill: FILL } },
    "M56 68h16v52H56z",
  ],
};

const FLOWERS = {
  rose: [
    "M64 28c-8-16 8-20 0-28 12 4 18 16 16 28 12-2 22 10 16 20-10 0-16 6-16 14 4 12-6 24-16 24s-20-12-16-24c0-8-6-14-16-14-6-10 4-22 16-20 0-12 4-24 16-28z",
    "M60 78c0 0-8 20-4 42h16c4-22-4-42-4-42z",
  ],
  tulip: [
    "M64 20c-16 8-24 28-20 48h40c4-20-4-40-20-48z M48 28c8-12 16-12 16-12s8 0 16 12 M60 68h8v52h-8z",
  ],
  sunflower: [
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "22", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "10", fill: "#8A8A8A" } },
    "M64 26l4-18-4 18-4-18z M64 70l4 18-4-18-4 18z M42 48l-18 4 18-4-18-4z M86 48l18 4-18-4 18-4z M48 32l-14-14 14 14-14 14z M80 32l14-14-14 14 14 14z M48 64l-14 14 14-14-14-14z M80 64l14 14-14-14 14-14z M60 70h8v50h-8z",
  ],
  orchid: [
    "M64 36c-20 0-28 16-20 28 0-12 8-18 20-18s20 6 20 18c8-12 0-28-20-28z M44 52c-16 8-16 24 0 28 4-8 12-12 20-12 M84 52c16 8 16 24 0 28-4-8-12-12-20-12 M64 64c-6 0-10 8-10 16h20c0-8-4-16-10-16z M60 80h8v40h-8z",
  ],
  lily: [
    "M64 24c-12 20-28 36-28 48 12-8 22-20 28-32 6 12 16 24 28 32 0-12-16-28-28-48z M60 72h8v48h-8z",
  ],
  lavender: [
    "M40 20c0 0 8 24 12 40 M52 16c0 0 6 28 8 44 M64 14c0 0 0 32 0 48 M76 16c0 0-6 28-8 44 M88 20c0 0-8 24-12 40 M60 64h8v56h-8z M36 24c4-6 10-6 12 0 M50 20c4-6 10-6 12 0 M70 20c4-6 10-6 12 0 M84 24c4-6 10-6 12 0",
  ],
  daisy: [
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "12", fill: FILL } },
    "M64 20c0 0 4 16 0 28-4-12 0-28 0-28z M64 76c0 0 4-16 0-28-4 12 0 28 0 28z M36 48c0 0 16 4 28 0-12-4-28 0-28 0z M92 48c0 0-16 4-28 0 12-4 28 0 28 0z M44 28c0 0 14 10 20 20-14-6-20-20-20-20z M84 28c0 0-14 10-20 20 14-6 20-20 20-20z M44 68c0 0 14-10 20-20-14 6-20 20-20 20z M84 68c0 0-14-10-20-20 14 6 20 20 20 20z M60 76h8v44h-8z",
  ],
  chrysanthemum: [
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "28", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "10", fill: "#8A8A8A" } },
    "M60 76h8v44h-8z",
  ],
  peony: [
    { tag: "circle", attrs: { cx: "64", cy: "46", r: "30", fill: FILL } },
    { tag: "circle", attrs: { cx: "52", cy: "40", r: "12", fill: "#B0B0B0" } },
    { tag: "circle", attrs: { cx: "76", cy: "40", r: "12", fill: "#B0B0B0" } },
    { tag: "circle", attrs: { cx: "64", cy: "56", r: "12", fill: "#B0B0B0" } },
    "M60 76h8v44h-8z",
  ],
  hydrangea: [
    { tag: "circle", attrs: { cx: "48", cy: "36", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "80", cy: "36", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "28", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "52", cy: "56", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "76", cy: "56", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "12", fill: FILL } },
    "M60 70h8v50h-8z",
  ],
  jasmine: [
    "M64 40l8-20-8 8-8-8z M64 40l20-8-8 8 8 8z M64 40l8 20-8-8-8 8z M64 40l-20 8 8-8-8-8z M64 40l20 8-8-8 8-8z M64 40l-20-8 8 8-8 8z",
    { tag: "circle", attrs: { cx: "64", cy: "40", r: "6", fill: FILL } },
    "M60 64h8v56h-8z",
  ],
  lotus: [
    "M64 70c-24-8-36-28-28-44 8 12 20 20 28 24 8-4 20-12 28-24 8 16-4 36-28 44z M36 50c8-4 16-4 28 4 M92 50c-8-4-16-4-28 4 M60 70h8v50h-8z",
  ],
  hibiscus: [
    "M64 28c-10-16 10-20 0-28 14 6 20 18 18 30 14 0 24 14 16 26-12-2-18 6-18 16 6 14-6 26-16 26s-22-12-16-26c0-10-6-18-18-16-8-12 2-26 16-26-2-12 4-24 18-30z",
    { tag: "circle", attrs: { cx: "64", cy: "52", r: "8", fill: "#8A8A8A" } },
    "M60 80h8v40h-8z",
  ],
  marigold: [
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "26", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "12", fill: "#9A9A9A" } },
    "M60 74h8v46h-8z",
  ],
  iris: [
    "M64 20c-8 16-24 28-24 44 10-8 18-18 24-30 6 12 14 22 24 30 0-16-16-28-24-44z M48 48c-12 4-16 16-8 24 M80 48c12 4 16 16 8 24 M60 68h8v52h-8z",
  ],
  poppy: [
    { tag: "circle", attrs: { cx: "50", cy: "40", r: "18", fill: FILL } },
    { tag: "circle", attrs: { cx: "78", cy: "40", r: "18", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "56", r: "18", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "44", r: "8", fill: "#8A8A8A" } },
    "M60 74h8v46h-8z",
  ],
  violet: [
    "M64 36c-16-8-28 4-20 18-12 4-12 20 4 22-4 14 10 24 20 14 10 10 24 0 20-14 16-2 16-18 4-22 8-14-4-26-20-18z M60 76h8v44h-8z",
  ],
  carnation: [
    "M40 48c0-16 10-28 24-28s24 12 24 28c8-4 16 4 12 14-6 0-10 6-10 12 4 10-4 20-14 20h-24c-10 0-18-10-14-20 0-6-4-12-10-12-4-10 4-18 12-14z M60 76h8v44h-8z",
  ],
  daffodil: [
    { tag: "circle", attrs: { cx: "64", cy: "44", r: "16", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "44", r: "8", fill: "#9A9A9A" } },
    "M64 28l0-16 M48 36l-14-10 M80 36l14-10 M48 52l-14 10 M80 52l14 10 M64 60v10 M60 70h8v50h-8z",
  ],
  camellia: [
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "28", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "12", fill: "#9A9A9A" } },
    "M60 76h8v44h-8z",
  ],
  azalea: [
    { tag: "ellipse", attrs: { cx: "48", cy: "44", rx: "16", ry: "22", fill: FILL } },
    { tag: "ellipse", attrs: { cx: "80", cy: "44", rx: "16", ry: "22", fill: FILL } },
    { tag: "ellipse", attrs: { cx: "64", cy: "40", rx: "14", ry: "20", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "52", r: "6", fill: "#8A8A8A" } },
    "M60 72h8v48h-8z",
  ],
  bougainvillea: [
    "M48 36l16-20 16 20-16 8z M32 56l20-12 12 16-20 8z M96 56l-20-12-12 16 20 8z",
    { tag: "circle", attrs: { cx: "64", cy: "52", r: "6", fill: FILL } },
    "M60 68h8v52h-8z",
  ],
  plumeria: [
    "M64 24c-4 12 0 20 0 20s4-8 0-20c12 4 20 12 20 20-12-4-20 0-20 0s8-4 20-20c-4 12-12 20-20 20 4 12 0 20 0 20s-4-8 0-20c-12 4-20 12-20 20 12-4 20 0 20 0s-8-4-20-20z",
    { tag: "circle", attrs: { cx: "64", cy: "44", r: "6", fill: "#8A8A8A" } },
    "M60 68h8v52h-8z",
  ],
  protea: [
    "M64 16c-20 20-28 44-20 64h40c8-20 0-44-20-64z M44 40l8 8 M84 40l-8 8 M48 56l8 6 M80 56l-8 6 M60 80h8v40h-8z",
  ],
  dahlia: [
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "30", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "14", fill: "#9A9A9A" } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "6", fill: FILL } },
    "M60 78h8v42h-8z",
  ],
};

const ANIMALS = {
  dog: [
    "M36 40c0-12 8-20 16-20 4 0 6 2 8 4 2-2 4-4 8-4 8 0 16 8 16 20v8H36z M40 48h40v28c0 8-6 14-14 14H54c-8 0-14-6-14-14z M44 90l-8 28h12l6-28 M76 90l8 28H72l-6-28 M28 44c-8 4-12 12-8 16 M92 44c8 4 12 12 8 16",
  ],
  cat: [
    "M40 28l8 20h32l8-20-12 8-12-12-12 12z M40 48h48c0 28-10 44-24 44S40 76 40 48z M52 60h6v6h-6z M70 60h6v6h-6z M58 74c2 4 10 4 12 0 M36 100c4 8 12 16 28 16s24-8 28-16",
  ],
  horse: [
    "M28 56c0-20 16-36 36-36 8 0 12 4 16 8l12-8 4 12-8 4c4 6 6 14 6 22v40H36V72c0-6-2-10-8-16z M88 44c8-4 16 0 20 8 M48 100v20h12V100 M72 100v20h12V100 M56 52h8v6h-8z",
  ],
  cow: [
    "M32 48c0-16 14-28 32-28s32 12 32 28v36H32z M28 44c-10 0-16 8-12 16 M100 44c10 0 16 8 12 16 M48 84v36h12V84 M68 84v36h12V84 M52 56h8v8h-8z M68 56h8v8h-8z M56 70h16v6H56z M48 24c-4-8 4-12 8-8 M80 24c4-8-4-12-8-8",
  ],
  elephant: [
    "M28 48c0-20 20-36 44-36 20 0 36 12 40 28v44H72v20c0 8-4 12-10 12s-10-4-10-12V84H28z M100 48c12 4 20 16 16 28l-8-4 M36 56h10v10H36z",
  ],
  lion: [
    "M64 20c-24 0-40 16-40 36 0 8 4 16 10 20v28h60V76c6-4 10-12 10-20 0-20-16-36-40-36z M48 52h8v8h-8z M72 52h8v8h-8z M56 68h16v6H56z M40 24c-8-8 0-16 8-12 M88 24c8-8 0-16-8-12 M52 24c-4-10 8-14 12-8 M76 24c4-10-8-14-12-8",
  ],
  tiger: [
    "M28 44c0-16 16-28 36-28s36 12 36 28v40H28z M24 40c-8 4-10 14-6 18 M104 40c8 4 10 14 6 18 M48 84v36h12V84 M68 84v36h12V84 M48 52h8v6h-8z M72 52h8v6h-8z M56 66h16v6H56z M44 36h8 M60 32h8 M76 36h8 M44 60h6 M78 60h6",
  ],
  panda: [
    { tag: "ellipse", attrs: { cx: "64", cy: "64", rx: "36", ry: "40", fill: FILL } },
    { tag: "circle", attrs: { cx: "36", cy: "32", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "92", cy: "32", r: "14", fill: FILL } },
    { tag: "ellipse", attrs: { cx: "50", cy: "58", rx: "10", ry: "12", fill: "#8A8A8A" } },
    { tag: "ellipse", attrs: { cx: "78", cy: "58", rx: "10", ry: "12", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "64", cy: "72", r: "6", fill: "#8A8A8A" } },
  ],
  dolphin: [
    "M20 64c8-24 36-40 68-36 16 2 28 12 32 24-20-4-36 4-44 16-4 6-4 14 2 18-12 0-24-6-32-16-6 8-16 12-26 10 4-6 4-12 0-16z M96 52c4-8 12-10 16-6",
  ],
  whale: [
    "M12 68c8-28 40-44 72-40 20 2 36 14 40 28H96c-4 12-16 20-32 20H40c-12 0-24-4-28-16z M100 56c8-4 16 0 20 8l-12 4 M36 76c4 8 12 12 24 12",
  ],
  eagle: [
    "M64 28c-8 0-14 8-14 16 0 4 2 8 6 10l-36 20 8 8 28-12v30h16V70l28 12 8-8-36-20c4-2 6-6 6-10 0-8-6-16-14-16z M56 36h4v4h-4z M68 36h4v4h-4z",
  ],
  owl: [
    { tag: "ellipse", attrs: { cx: "64", cy: "64", rx: "32", ry: "40", fill: FILL } },
    { tag: "circle", attrs: { cx: "50", cy: "56", r: "12", fill: "#9A9A9A" } },
    { tag: "circle", attrs: { cx: "78", cy: "56", r: "12", fill: "#9A9A9A" } },
    { tag: "circle", attrs: { cx: "50", cy: "56", r: "5", fill: FILL } },
    { tag: "circle", attrs: { cx: "78", cy: "56", r: "5", fill: FILL } },
    "M64 68l-6 10h12z M44 28l8 16 M84 28l-8 16",
  ],
  penguin: [
    { tag: "ellipse", attrs: { cx: "64", cy: "68", rx: "28", ry: "40", fill: FILL } },
    { tag: "ellipse", attrs: { cx: "64", cy: "72", rx: "16", ry: "24", fill: "#9A9A9A" } },
    { tag: "circle", attrs: { cx: "54", cy: "48", r: "4", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "74", cy: "48", r: "4", fill: "#8A8A8A" } },
    "M64 56l-6 8h12z M40 64c-8 4-12 12-8 16 M88 64c8 4 12 12 8 16 M52 108h10v8H52z M66 108h10v8H66z",
  ],
  butterfly: [
    "M64 64c-20-28-40-32-48-20 12 4 28 16 48 20-20 4-36 16-48 20 8 12 28 8 48-20 20 28 40 32 48 20-12-4-28-16-48-20 20-4 36-16 48-20-8-12-28-8-48 20z M62 40h4v56h-4z",
  ],
  bee: [
    { tag: "ellipse", attrs: { cx: "64", cy: "68", rx: "28", ry: "20", fill: FILL } },
    "M48 60h32v4H48z M48 72h32v4H48z M36 56c-12-16 0-28 12-20 M92 56c12-16 0-28-12-20 M88 68l16 4 M40 48l-8-12 M36 44l8-4",
  ],
  ant: [
    { tag: "circle", attrs: { cx: "64", cy: "36", r: "12", fill: FILL } },
    { tag: "ellipse", attrs: { cx: "64", cy: "58", rx: "10", ry: "12", fill: FILL } },
    { tag: "ellipse", attrs: { cx: "64", cy: "88", rx: "16", ry: "22", fill: FILL } },
    "M52 36l-16-12 M76 36l16-12 M48 58l-20 0 M80 58l20 0 M50 80l-18 12 M78 80l18 12",
  ],
  dragonfly: [
    "M20 56c20-8 36-4 44 8-8 12-24 16-44 8z M108 56c-20-8-36-4-44 8 8 12 24 16 44 8z M20 72c20 8 36 4 44-8-8-12-24-16-44 8z M108 72c-20 8-36 4-44-8 8-12 24-16 44 8z",
    { tag: "ellipse", attrs: { cx: "64", cy: "64", rx: "8", ry: "28", fill: FILL } },
    "M64 36l-4-12 M64 36l4-12",
  ],
  ladybug: [
    { tag: "ellipse", attrs: { cx: "64", cy: "68", rx: "32", ry: "28", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "40", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "52", cy: "60", r: "5", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "76", cy: "60", r: "5", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "64", cy: "78", r: "5", fill: "#8A8A8A" } },
    "M64 48v48 M52 36l-12-10 M76 36l12-10",
  ],
  mantis: [
    "M64 40c-8 0-14 8-14 20v40h28V60c0-12-6-20-14-20z M50 56c-16-12-28-8-32 0 12 4 24 12 32 16 M78 56c16-12 28-8 32 0-12 4-24 12-32 16 M50 100l-12 20 M78 100l12 20 M56 36l-8-16 M72 36l8-16",
  ],
  beetle: [
    { tag: "ellipse", attrs: { cx: "64", cy: "68", rx: "30", ry: "36", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "32", r: "14", fill: FILL } },
    "M64 40v64 M48 28l-12-12 M80 28l12-12 M40 60l-16 0 M88 60l16 0 M44 88l-14 12 M84 88l14 12",
  ],
  spider: [
    { tag: "circle", attrs: { cx: "64", cy: "64", r: "16", fill: FILL } },
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "10", fill: FILL } },
    "M48 56l-28-16 M48 64l-32 0 M48 72l-28 16 M80 56l28-16 M80 64l32 0 M80 72l28 16 M52 44l-12-16 M76 44l12-16",
  ],
  frog: [
    { tag: "ellipse", attrs: { cx: "64", cy: "72", rx: "36", ry: "28", fill: FILL } },
    { tag: "circle", attrs: { cx: "44", cy: "48", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "84", cy: "48", r: "14", fill: FILL } },
    { tag: "circle", attrs: { cx: "44", cy: "48", r: "5", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "84", cy: "48", r: "5", fill: "#8A8A8A" } },
    "M28 80c-12 8-16 20-8 24 M100 80c12 8 16 20 8 24 M48 92h32v8H48z",
  ],
  snake: [
    "M24 40c16-16 40-8 48 8 8 16 24 20 40 8-12 20-36 24-52 8-12-12-28-16-40-4 4-8 4-16 4-20z M104 52c8 0 12 8 8 14",
  ],
  turtle: [
    { tag: "ellipse", attrs: { cx: "64", cy: "64", rx: "40", ry: "28", fill: FILL } },
    { tag: "circle", attrs: { cx: "104", cy: "64", r: "12", fill: FILL } },
    "M28 56c-12 0-16 12-8 16 M28 72c-12 0-16-12-8-16 M72 36c0-12 12-16 16-8 M72 92c0 12 12 16 16 8 M48 40l16 24 16-24 M48 88l16-24 16 24 M64 40v48",
  ],
  fox: [
    "M32 36l16 24h32l16-24-14 6-18-18-18 18z M40 60h48c0 24-10 40-24 40S40 84 40 60z M52 68h6v6h-6z M70 68h6v6h-6z M58 82c2 4 10 4 12 0 M48 100h32v8H48z",
  ],
  wolf: [
    "M36 32l12 24h32l12-24-10 8-18-16-18 16z M40 56h48v36c0 10-8 18-20 18H60c-12 0-20-8-20-18z M48 68h6v6h-6z M74 68h6v6h-6z M56 84h16v6H56z M44 100h12v20H44z M72 100h12v20H72z",
  ],
  bear: [
    { tag: "circle", attrs: { cx: "36", cy: "36", r: "16", fill: FILL } },
    { tag: "circle", attrs: { cx: "92", cy: "36", r: "16", fill: FILL } },
    { tag: "ellipse", attrs: { cx: "64", cy: "64", rx: "40", ry: "44", fill: FILL } },
    { tag: "circle", attrs: { cx: "50", cy: "58", r: "6", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "78", cy: "58", r: "6", fill: "#8A8A8A" } },
    { tag: "ellipse", attrs: { cx: "64", cy: "76", rx: "12", ry: "10", fill: "#9A9A9A" } },
  ],
  deer: [
    "M40 20c0 0 8 20 12 28 M52 16c0 0 4 24 6 32 M76 16c0 0-4 24-6 32 M88 20c0 0-8 20-12 28 M48 52h32c0 28-8 44-16 44s-16-16-16-44z M44 96v24h10V96 M74 96v24h10V96 M54 64h6v6h-6z M68 64h6v6h-6z M36 48c-8 4-8 12-2 14 M92 48c8 4 8 12 2 14",
  ],
  rabbit: [
    "M48 12c-4 20 0 36 8 40 M80 12c4 20 0 36-8 40",
    { tag: "ellipse", attrs: { cx: "64", cy: "72", rx: "28", ry: "32", fill: FILL } },
    { tag: "circle", attrs: { cx: "52", cy: "64", r: "5", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "76", cy: "64", r: "5", fill: "#8A8A8A" } },
    { tag: "ellipse", attrs: { cx: "64", cy: "78", rx: "8", ry: "6", fill: "#9A9A9A" } },
  ],
  octopus: [
    { tag: "circle", attrs: { cx: "64", cy: "48", r: "28", fill: FILL } },
    { tag: "circle", attrs: { cx: "52", cy: "44", r: "5", fill: "#8A8A8A" } },
    { tag: "circle", attrs: { cx: "76", cy: "44", r: "5", fill: "#8A8A8A" } },
    "M40 68c-8 16-12 36-4 44 M52 72c-4 20-4 40 4 44 M64 74c0 22 0 42 0 46 M76 72c4 20 4 40-4 44 M88 68c8 16 12 36 4 44 M36 64c-12 8-20 4-24-4 M100 64c12 8 20 4 24-4",
  ],
};

let n = 0;
for (const [id, paths] of Object.entries(TREES)) {
  writeFileSync(join(marksDir, `trees__${id}.svg`), svg(paths));
  n += 1;
}
for (const [id, paths] of Object.entries(FLOWERS)) {
  writeFileSync(join(marksDir, `flowers__${id}.svg`), svg(paths));
  n += 1;
}
for (const [id, paths] of Object.entries(ANIMALS)) {
  writeFileSync(join(marksDir, `animals__${id}.svg`), svg(paths));
  n += 1;
}
console.log(`Wrote ${n} nature silhouette marks.`);

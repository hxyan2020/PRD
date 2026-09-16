import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(process.cwd(), "out");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (entry.name.endsWith(".html")) await relativizeHtml(full);
    if (entry.name.endsWith(".css")) await relativizeCss(full);
  }
}

function depthPrefix(file) {
  const rel = path.relative(OUT, path.dirname(file));
  if (!rel || rel === ".") return ".";
  return rel.split(path.sep).map(() => "..").join("/");
}

async function relativizeHtml(file) {
  const prefix = depthPrefix(file);
  let html = await readFile(file, "utf8");
  html = html.replaceAll('"/_next/', `"${prefix}/_next/`);
  html = html.replaceAll("'/_next/", `'${prefix}/_next/`);
  await writeFile(file, html);
}

async function relativizeCss(file) {
  let css = await readFile(file, "utf8");
  if (!css.includes("/_next/static/media/")) return;
  css = css.replaceAll("/_next/static/media/", "../media/");
  await writeFile(file, css);
}

await walk(OUT);
console.log("Relativized static export asset paths.");

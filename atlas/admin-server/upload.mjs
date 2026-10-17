import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { atlasRoot } from "./store.mjs";

const UPLOAD_ROOT = join(atlasRoot, "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function safeGameId(id) {
  return String(id || "misc")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "misc";
}

function safeFilename(name, mime) {
  const base = basename(String(name || "upload"))
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  let ext = extname(base).toLowerCase();
  const stem = ext ? base.slice(0, -ext.length) : base;
  if (!MIME_EXT[mime]) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }
  if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    ext = MIME_EXT[mime];
  }
  if (ext === ".jpeg") ext = ".jpg";
  return `${stem || "photo"}${ext}`;
}

/**
 * Persist a base64 image under public/uploads/{gameId}/ and return a site-relative URL.
 * @param {{ gameId: string, filename: string, mime: string, dataBase64: string }} input
 */
export function saveUploadedImage(input) {
  const mime = String(input.mime || "").toLowerCase().split(";")[0].trim();
  if (!MIME_EXT[mime]) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }

  let raw = String(input.dataBase64 || "");
  const dataUrl = raw.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUrl) {
    raw = dataUrl[2];
  }
  raw = raw.replace(/\s+/g, "");
  if (!raw) throw new Error("Empty image data");

  const buf = Buffer.from(raw, "base64");
  if (!buf.length) throw new Error("Could not decode image data");
  if (buf.length > MAX_BYTES) {
    throw new Error(`Image too large (max ${MAX_BYTES / (1024 * 1024)} MB)`);
  }

  const gameId = safeGameId(input.gameId);
  const dir = join(UPLOAD_ROOT, gameId);
  mkdirSync(dir, { recursive: true });

  const stamp = Date.now().toString(36);
  const file = `${stamp}-${safeFilename(input.filename, mime)}`;
  const abs = join(dir, file);
  if (!abs.startsWith(UPLOAD_ROOT)) {
    throw new Error("Invalid upload path");
  }
  writeFileSync(abs, buf);

  const url = `uploads/${gameId}/${file}`;
  return {
    url,
    bytes: buf.length,
    mime,
    absolutePath: abs,
  };
}

export function uploadsDir() {
  if (!existsSync(UPLOAD_ROOT)) mkdirSync(UPLOAD_ROOT, { recursive: true });
  return UPLOAD_ROOT;
}

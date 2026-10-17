import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const credPath = join(__dirname, ".credentials.json");

function loadCredentials() {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    return {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      sessionSecret:
        process.env.ADMIN_SESSION_SECRET ||
        "dev-only-change-me-ludus-atlas-admin",
    };
  }
  if (!existsSync(credPath)) {
    throw new Error(
      "Missing admin credentials. Set ADMIN_USERNAME/ADMIN_PASSWORD or create .credentials.json",
    );
  }
  return JSON.parse(readFileSync(credPath, "utf8"));
}

const creds = loadCredentials();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
/** @type {Map<string, { username: string, expires: number }>} */
const sessions = new Map();

function sign(value) {
  return createHmac("sha256", creds.sessionSecret)
    .update(value)
    .digest("hex");
}

export function verifyLogin(username, password) {
  if (!username || !password) return false;
  const uOk =
    username.length === creds.username.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(creds.username));
  const pOk =
    password.length === creds.password.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(creds.password));
  return uOk && pOk;
}

export function createSession(username) {
  const id = randomBytes(24).toString("hex");
  const expires = Date.now() + SESSION_TTL_MS;
  sessions.set(id, { username, expires });
  const sig = sign(id);
  return { token: `${id}.${sig}`, expires };
}

export function destroySession(token) {
  if (!token) return;
  const id = token.split(".")[0];
  sessions.delete(id);
}

export function getSessionUser(token) {
  if (!token || !token.includes(".")) return null;
  const [id, sig] = token.split(".");
  if (!id || !sig || sign(id) !== sig) return null;
  const row = sessions.get(id);
  if (!row) return null;
  if (Date.now() > row.expires) {
    sessions.delete(id);
    return null;
  }
  return row.username;
}

export function parseCookies(header = "") {
  /** @type {Record<string, string>} */
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function sessionCookie(token, expires) {
  const maxAge = Math.max(0, Math.floor((expires - Date.now()) / 1000));
  return `ludus_admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return "ludus_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

/** Hash helper kept for optional future password rotation. */
export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

export function getPublicUsername() {
  return creds.username;
}

import { get, put } from "@vercel/blob";
import { sanitizeUsers } from "../src/auth.js";
import { normalizeEmail, normalizePersonalPayload, timingSafeEqualText } from "../src/personalApi.js";

const AUTH_BLOB_PATH = "canon-auth-users.json";
const BLOB_PREFIX = "canon-personal/";

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID || process.env.VERCEL_OIDC_TOKEN);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === "object" ? body : null;
}

async function readStream(stream) {
  if (!stream) return "";
  if (typeof stream.text === "function") return stream.text();
  const response = new Response(stream);
  return response.text();
}

async function loadBlobUsers() {
  const result = await get(AUTH_BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return [];
  const parsed = JSON.parse(await readStream(result.stream));
  return sanitizeUsers(parsed?.users || parsed);
}

function personalPath(email) {
  return `${BLOB_PREFIX}${normalizeEmail(email)}.json`;
}

async function loadPersonal(email) {
  const result = await get(personalPath(email), { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  try {
    const parsed = JSON.parse(await readStream(result.stream));
    return normalizePersonalPayload(parsed?.personal || parsed);
  } catch {
    return null;
  }
}

async function savePersonal(email, personal) {
  await put(personalPath(email), JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), personal }), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json",
  });
}

export function createPersonalHandler({
  configured,
  loadUsers,
  loadUserPersonal,
  saveUserPersonal,
} = {}) {
  const isConfigured = configured || blobConfigured;
  const loadAuthUsers = loadUsers || loadBlobUsers;
  const load = loadUserPersonal || loadPersonal;
  const save = saveUserPersonal || savePersonal;

  return async function handler(req, res) {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "unavailable" });
      return;
    }
    if (!isConfigured()) {
      json(res, 503, { ok: false, error: "unavailable" });
      return;
    }

    const payload = parseBody(req);
    if (!payload) {
      json(res, 400, { ok: false, error: "unavailable" });
      return;
    }

    const email = normalizeEmail(payload.email);
    const action = String(payload.action || "");
    if (!email || (action !== "get" && action !== "put")) {
      json(res, 400, { ok: false, error: "unavailable" });
      return;
    }

    try {
      const users = await loadAuthUsers();
      const record = users.find((user) => user.email === email) || null;
      if (!record) {
        json(res, 400, { ok: false, error: "no_account" });
        return;
      }
      if (!timingSafeEqualText(record.hash, payload.hash) || !timingSafeEqualText(record.salt, payload.salt)) {
        json(res, 400, { ok: false, error: "bad_password" });
        return;
      }

      if (action === "get") {
        const personal = (await load(email)) || normalizePersonalPayload(null);
        json(res, 200, { ok: true, error: "", personal });
        return;
      }

      const personal = normalizePersonalPayload(payload.personal);
      await save(email, personal);
      json(res, 200, { ok: true, error: "", personal });
    } catch {
      json(res, 503, { ok: false, error: "unavailable" });
    }
  };
}

export default createPersonalHandler();

import { put, get } from "@vercel/blob";
import { applyAuthAction, publicUser, sanitizeUsers } from "../src/auth.js";

const BLOB_PATH = "canon-auth-users.json";

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
  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return [];
  const parsed = JSON.parse(await readStream(result.stream));
  return sanitizeUsers(parsed?.users || parsed);
}

async function saveBlobUsers(users) {
  await put(BLOB_PATH, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), users }), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json",
  });
}

export function createAuthHandler({ loadUsers, saveUsers, configured } = {}) {
  const isConfigured = configured || blobConfigured;
  const load = loadUsers || loadBlobUsers;
  const save = saveUsers || saveBlobUsers;

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

    try {
      const current = await load();
      const result = await applyAuthAction(current, payload);
      if (result.ok && result.users !== current) await save(result.users);
      json(res, result.ok ? 200 : 400, {
        ok: result.ok,
        error: result.error || "",
        user: result.user || null,
        record: result.ok ? result.record : undefined,
      });
    } catch {
      json(res, 503, { ok: false, error: "unavailable" });
    }
  };
}

export { publicUser };

export default createAuthHandler();

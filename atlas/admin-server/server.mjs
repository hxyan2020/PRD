import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  verifyLogin,
  createSession,
  destroySession,
  getSessionUser,
  parseCookies,
  sessionCookie,
  clearSessionCookie,
  getPublicUsername,
} from "./auth.mjs";
import {
  listGames,
  getGame,
  saveGame,
  supportedLocales,
  localeCatalog,
  extractYoutubeId,
} from "./store.mjs";
import { publishCatalog } from "./publish.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "public");
const flagsDir = join(__dirname, "..", "public", "flags");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function requireAuth(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  const user = getSessionUser(cookies.ludus_admin_session);
  if (!user) {
    sendJson(res, 401, { error: "Unauthorized" });
    return null;
  }
  return user;
}

function serveStatic(req, res, urlPath) {
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  rel = rel.replace(/\?.*$/, "");
  const filePath = join(publicDir, rel);
  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }
  const ext = extname(filePath);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control":
      ext === ".html" || ext === ".js" || ext === ".css"
        ? "no-store"
        : "public, max-age=300",
  });
  res.end(readFileSync(filePath));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const path = url.pathname;
    const method = req.method || "GET";

    if (path === "/api/health") {
      return sendJson(res, 200, { ok: true, service: "ludus-atlas-admin" });
    }

    if (path === "/api/login" && method === "POST") {
      const body = await readBody(req);
      if (!verifyLogin(body.username, body.password)) {
        return sendJson(res, 401, { error: "Invalid username or password" });
      }
      const { token, expires } = createSession(body.username);
      return sendJson(
        res,
        200,
        { ok: true, username: body.username },
        { "Set-Cookie": sessionCookie(token, expires) },
      );
    }

    if (path === "/api/logout" && method === "POST") {
      const cookies = parseCookies(req.headers.cookie || "");
      destroySession(cookies.ludus_admin_session);
      return sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
    }

    if (path === "/api/me" && method === "GET") {
      const cookies = parseCookies(req.headers.cookie || "");
      const user = getSessionUser(cookies.ludus_admin_session);
      if (!user) return sendJson(res, 401, { error: "Unauthorized" });
      return sendJson(res, 200, { username: user });
    }

    if (path === "/api/locales" && method === "GET") {
      if (!requireAuth(req, res)) return;
      const catalog = localeCatalog();
      return sendJson(res, 200, {
        locales: catalog.map((l) => l.code),
        catalog,
        overlayLocales: supportedLocales(),
      });
    }

    if (path === "/api/games" && method === "GET") {
      if (!requireAuth(req, res)) return;
      const q = url.searchParams.get("q") || "";
      const page = Number(url.searchParams.get("page") || 1);
      const limit = Math.min(100, Number(url.searchParams.get("limit") || 40));
      return sendJson(res, 200, listGames({ q, page, limit }));
    }

    const gameMatch = path.match(/^\/api\/games\/([^/]+)$/);
    if (gameMatch && method === "GET") {
      if (!requireAuth(req, res)) return;
      const row = getGame(decodeURIComponent(gameMatch[1]));
      if (!row) return sendJson(res, 404, { error: "Game not found" });
      return sendJson(res, 200, row);
    }

    if (gameMatch && method === "PUT") {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      try {
        const saved = saveGame(decodeURIComponent(gameMatch[1]), body);
        return sendJson(res, 200, { ok: true, ...saved });
      } catch (e) {
        return sendJson(res, 400, { error: e.message || "Save failed" });
      }
    }

    if (path === "/api/youtube/parse" && method === "POST") {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const videoId = extractYoutubeId(body.url || body.videoId || "");
      return sendJson(res, 200, {
        videoId,
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
      });
    }

    if (path === "/api/publish" && method === "POST") {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const result = publishCatalog({
        deploy: body.deploy !== false,
        commitMessage: body.commitMessage,
      });
      return sendJson(res, result.ok ? 200 : 500, result);
    }

    if (path.startsWith("/api/")) {
      return sendJson(res, 404, { error: "Not found" });
    }

    // Self-hosted SVG flags (same assets as the public site).
    const flagMatch = path.match(/^\/flags\/([a-z]{2})\.svg$/);
    if (flagMatch && method === "GET") {
      const filePath = join(flagsDir, `${flagMatch[1]}.svg`);
      if (!filePath.startsWith(flagsDir) || !existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      });
      res.end(readFileSync(filePath));
      return;
    }

    return serveStatic(req, res, path);
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message || "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Ludus Atlas admin listening on http://${HOST}:${PORT}`);
  console.log(`Login user: ${getPublicUsername()}`);
});

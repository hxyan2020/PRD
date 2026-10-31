import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createAuthHandler } from "./api/auth.js";

const localUsers = [];
const localAuth = createAuthHandler({
  configured: () => true,
  loadUsers: async () => localUsers,
  saveUsers: async (next) => {
    localUsers.splice(0, localUsers.length, ...next);
  },
});

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function localAuthPlugin() {
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const path = String(req.url || "").split("?")[0];
      if (path !== "/api/auth") {
        next();
        return;
      }
      try {
        req.body = req.method === "POST" ? await readJsonBody(req) : {};
        await localAuth(req, res);
      } catch {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "unavailable" }));
      }
    });
  };
  return {
    name: "canon-local-auth",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === "build" ? [] : [localAuthPlugin()])],
  // Nested GitHack/docs build uses relative URLs; Vercel and local serve from `/`.
  base: process.env.CANON_OUTDIR ? "./" : "/",
  build: {
    outDir: process.env.CANON_OUTDIR || "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/hx-viewership": {
        target: "https://viewership.168.144.109.12.nip.io",
        changeOrigin: true,
        rewrite: () => "/collect",
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    proxy: {
      "/api/hx-viewership": {
        target: "https://viewership.168.144.109.12.nip.io",
        changeOrigin: true,
        rewrite: () => "/collect",
      },
    },
  },
}));

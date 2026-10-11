import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
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
        target: "http://188.166.214.47:3520",
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
        target: "http://188.166.214.47:3520",
        changeOrigin: true,
        rewrite: () => "/collect",
      },
    },
  },
}));

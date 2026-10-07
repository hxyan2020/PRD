import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pagesBase = process.env.GITHUB_PAGES === "1" ? "/PRD/ludus-atlas/" : "/";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: pagesBase,
});

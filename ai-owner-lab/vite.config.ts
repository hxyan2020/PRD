import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: /PRD/ownlab/ — Vercel (and local override) use /
const base =
  process.env.BASE_PATH ??
  (process.env.VERCEL ? '/' : '/PRD/ownlab/')

export default defineConfig({
  base,
  plugins: [react()],
})

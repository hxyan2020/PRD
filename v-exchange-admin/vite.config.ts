import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Publish under /matching-management/ so the repo Pages root can host Fatum Atlas
  // (and other sibling apps) instead of landing on this admin SPA.
  base: process.env.GITHUB_PAGES === 'true' ? '/PRD/matching-management/' : '/',
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Nested under /PRD/matching-management/ so sibling Pages apps (Fatum Atlas, CRMP, …) coexist.
  base: process.env.GITHUB_PAGES === 'true' ? '/PRD/matching-management/' : '/',
})

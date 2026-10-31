import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages production host: https://hxyan2020.github.io/PRD/matching-management/
const pagesBase = process.env.GITHUB_PAGES === '1' ? '/PRD/matching-management/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base: pagesBase,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})

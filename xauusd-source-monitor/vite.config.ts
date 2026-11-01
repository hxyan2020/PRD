import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pagesBase = process.env.GITHUB_PAGES === '1' ? '/PRD/xauusd-source-monitor/' : '/'

export default defineConfig({
  base: pagesBase,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5180,
  },
  preview: {
    host: '0.0.0.0',
    port: 4180,
  },
})

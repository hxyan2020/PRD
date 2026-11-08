import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pagesBase = process.env.GITHUB_PAGES === '1' ? '/PRD/xauusd-source-monitor/' : '/'

export default defineConfig({
  base: pagesBase,
  plugins: [react()],
  define: {
    // Non-secret URL only (e.g. https://xxx.vercel.app). Never bake API keys into the client.
    __VEX_LLM_PROXY_BASE__: JSON.stringify(process.env.LLM_PROXY_BASE || ''),
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
    proxy: {
      '/api/chat': {
        target: process.env.LLM_PROXY_TARGET || 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4180,
  },
})

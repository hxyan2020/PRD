import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

const pagesBase = process.env.GITHUB_PAGES === '1' ? '/PRD/xauusd-source-monitor/' : '/'

/** Serve multi-asset board JSON in Vite dev/preview (Vercel uses api/market/board.ts). */
function marketBoardApiPlugin(): Plugin {
  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url || ''
      if (!url.startsWith('/api/market/board')) return next()
      try {
        const { fetchMultiAssetBoard } = await import('./src/engine/multiAssetMarket.ts')
        const board = await fetchMultiAssetBoard()
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify({ ok: true, board }))
      } catch (e) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }))
      }
    })
  }
  return {
    name: 'market-board-api',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

export default defineConfig({
  base: pagesBase,
  plugins: [react(), marketBoardApiPlugin()],
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

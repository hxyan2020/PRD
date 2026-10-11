import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local: `/` ; GitHub Pages project site under /PRD/mille/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/PRD/mille/' : '/',
}))

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages project site: https://hxyan2020.github.io/PRD/ownlab/
export default defineConfig({
  base: '/PRD/ownlab/',
  plugins: [react()],
})

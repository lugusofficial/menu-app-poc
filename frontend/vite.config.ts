import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// `base` matches the GitHub Pages project path. Override it with BASE_PATH=/
// for local dev or any other host.
const base = process.env.BASE_PATH ?? '/menu-app-poc/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})

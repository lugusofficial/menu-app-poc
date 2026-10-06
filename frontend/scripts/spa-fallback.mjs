// GitHub Pages serves static files only: a deep link such as /t/mesa-15 has no
// file behind it and Pages answers with 404.html. Copying index.html there lets
// the SPA boot on that URL and let React Router read the real path, so QR codes
// can point straight at a table.
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const index = resolve(dist, 'index.html')

if (!existsSync(index)) {
  console.error('spa-fallback: dist/index.html not found, run the build first')
  process.exit(1)
}

copyFileSync(index, resolve(dist, '404.html'))
console.log('spa-fallback: wrote dist/404.html')

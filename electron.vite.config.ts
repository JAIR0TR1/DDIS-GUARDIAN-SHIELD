import { readFileSync } from 'node:fs'
import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// La versión que muestra la app sale de package.json: así nunca se desincroniza.
const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf-8')) as {
  version: string
}

const shared = resolve('src/shared')
const domain = resolve('src/domain')
const design = resolve('src/design')

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': shared, '@domain': domain } }
  },
  preload: {
    resolve: { alias: { '@shared': shared } }
  },
  renderer: {
    define: { __APP_VERSION__: JSON.stringify(version) },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': shared,
        '@domain': domain,
        '@design': design,
        '@data': resolve('data')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})

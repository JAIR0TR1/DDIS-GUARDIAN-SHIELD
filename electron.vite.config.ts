import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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

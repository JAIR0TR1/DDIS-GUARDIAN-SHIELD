/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
// Convierte la captura de Nilo (.screenshots/icon-source.png) en build/icon.png y build/icon.ico:
// redondea las esquinas con un borde suave (alfa) y arma el .ico con varios tamaños.
// Se ejecuta con Electron: node scripts/run-electron.mjs scripts/finish-icon.cjs
const { app, nativeImage } = require('electron')
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')

const ROOT = join(__dirname, '..')
const SIZE = 512
const RADIUS = 112

/** Alfa de un cuadrado de esquinas redondeadas con borde suavizado (distancia con signo). */
function alphaAt(x, y) {
  const cx = Math.min(Math.max(x + 0.5, RADIUS), SIZE - RADIUS)
  const cy = Math.min(Math.max(y + 0.5, RADIUS), SIZE - RADIUS)
  const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - RADIUS
  return Math.min(1, Math.max(0, 0.5 - d))
}

function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + 16 * images.length
  const entries = images.map(({ size, png }) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(png.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += png.length
    return e
  })
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)])
}

app.whenReady().then(() => {
  const source = nativeImage.createFromBuffer(
    readFileSync(join(ROOT, '.screenshots', 'icon-source.png'))
  )
  const resized = source.resize({ width: SIZE, height: SIZE, quality: 'best' })
  const bitmap = Buffer.from(resized.toBitmap()) // BGRA
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      const a = alphaAt(x, y)
      // Alfa premultiplicada: se escalan también los colores.
      bitmap[i] = Math.round(bitmap[i] * a)
      bitmap[i + 1] = Math.round(bitmap[i + 1] * a)
      bitmap[i + 2] = Math.round(bitmap[i + 2] * a)
      bitmap[i + 3] = Math.round(255 * a)
    }
  }
  const masked = nativeImage.createFromBitmap(bitmap, { width: SIZE, height: SIZE })
  mkdirSync(join(ROOT, 'build'), { recursive: true })
  writeFileSync(join(ROOT, 'build', 'icon.png'), masked.toPNG())
  const sizes = [256, 128, 64, 48, 32, 24, 16]
  const images = sizes.map((size) => ({
    size,
    png: masked.resize({ width: size, height: size, quality: 'best' }).toPNG()
  }))
  writeFileSync(join(ROOT, 'build', 'icon.ico'), buildIco(images))
  console.log('Iconos generados: build/icon.png y build/icon.ico')
  app.quit()
})

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
// Genera build/icon.png y build/icon.ico con Nilo. Se ejecuta con Electron (renderiza el SVG):
//   node scripts/run-electron.mjs scripts/make-icon.cjs
const { app, BrowserWindow, nativeImage } = require('electron')
const { mkdirSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const SIZE = 512
const OUT = join(__dirname, '..', 'build')

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0E2036"/><stop offset="1" stop-color="#05070D"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="46%" r="50%">
      <stop offset="0" stop-color="#22D3EE" stop-opacity=".55"/><stop offset=".6" stop-color="#22D3EE" stop-opacity=".12"/><stop offset="1" stop-color="#22D3EE" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="head" cx="50%" cy="28%" r="78%">
      <stop offset="0" stop-color="#17304D"/><stop offset=".55" stop-color="#0B1A2E"/><stop offset="1" stop-color="#050C18"/>
    </radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#A5F3FC"/><stop offset=".5" stop-color="#22D3EE"/><stop offset="1" stop-color="#0E7490"/>
    </linearGradient>
    <linearGradient id="ear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B3556"/><stop offset="1" stop-color="#081425"/></linearGradient>
    <linearGradient id="earIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B5CF6" stop-opacity=".8"/><stop offset="1" stop-color="#22D3EE" stop-opacity=".1"/></linearGradient>
    <radialGradient id="eye" cx="40%" cy="32%" r="75%"><stop offset="0" stop-color="#ECFEFF"/><stop offset=".4" stop-color="#5EEAF8"/><stop offset="1" stop-color="#0891B2"/></radialGradient>
    <linearGradient id="shield" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4B5FD"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#plate)"/>
  <rect x="17.5" y="17.5" width="477" height="477" rx="110.5" fill="none" stroke="#22D3EE" stroke-opacity=".35" stroke-width="3"/>
  <circle cx="256" cy="262" r="230" fill="url(#halo)"/>
  <g transform="translate(-6 30) scale(2.62)">
    <g stroke="url(#rim)" stroke-width="2.4" stroke-linejoin="round">
      <path d="M52 80 L38 18 L98 56 Z" fill="url(#ear)"/><path d="M148 80 L162 18 L102 56 Z" fill="url(#ear)"/>
    </g>
    <g fill="url(#earIn)"><path d="M54 68 L46 33 L82 55 Z"/><path d="M146 68 L154 33 L118 55 Z"/></g>
    <circle cx="100" cy="106" r="62" fill="url(#head)"/>
    <circle cx="100" cy="106" r="62" fill="none" stroke="url(#rim)" stroke-width="2.6"/>
    <path d="M56 90 Q100 56 144 90" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="66" cy="136" rx="9" ry="4.5" fill="#8B5CF6" fill-opacity=".25"/><ellipse cx="134" cy="136" rx="9" ry="4.5" fill="#8B5CF6" fill-opacity=".25"/>
    <g filter="url(#glow)">
      <path d="M100 60 L114 65.5 V80 C114 89 108 94 100 97.5 C92 94 86 89 86 80 V65.5 Z" fill="url(#shield)" fill-opacity=".3" stroke="url(#shield)" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M100 70 L103 77 L100 87 L97 77 Z" fill="#EDE9FE" fill-opacity=".9"/>
    </g>
    <g filter="url(#glow)"><ellipse cx="77" cy="116" rx="9.5" ry="13.5" fill="url(#eye)"/><ellipse cx="123" cy="116" rx="9.5" ry="13.5" fill="url(#eye)"/></g>
    <circle cx="73.5" cy="110" r="3.4" fill="#fff"/><circle cx="119.5" cy="110" r="3.4" fill="#fff"/>
    <path d="M97.5 133 H102.5 L100 136.5 Z" fill="#5EEAF8"/>
    <path d="M91 142 Q100 149 109 142" stroke="#5EEAF8" stroke-width="2.8" stroke-linecap="round" fill="none"/>
  </g>
</svg>`

/** Arma un .ico con imágenes PNG (formato válido desde Windows Vista). */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
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

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: SIZE,
    height: SIZE,
    useContentSize: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: { offscreen: false }
  })
  const html = `<html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await new Promise((r) => setTimeout(r, 400))
  const full = await win.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE })

  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'icon.png'), full.toPNG())
  const sizes = [256, 128, 64, 48, 32, 24, 16]
  const images = sizes.map((size) => ({
    size,
    png: nativeImage
      .createFromBuffer(full.toPNG())
      .resize({ width: size, height: size, quality: 'best' })
      .toPNG()
  }))
  writeFileSync(join(OUT, 'icon.ico'), buildIco(images))
  console.log('Iconos generados en build/: icon.png e icon.ico')
  app.quit()
})

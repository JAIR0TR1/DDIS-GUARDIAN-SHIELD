import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import type { BrowserWindow } from 'electron'

/** Carga la interfaz (desarrollo o compilada). `hash` elige la pantalla: p. ej. «alert». */
export function loadRenderer(win: BrowserWindow, hash?: string): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = process.env['ELECTRON_RENDERER_URL']
    void win.loadURL(hash ? `${url}#${hash}` : url)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), hash ? { hash } : undefined)
  }
}

/** Preferencias web seguras: iguales en todas las ventanas. */
export function secureWebPreferences(): Electron.WebPreferences {
  return {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true
  }
}

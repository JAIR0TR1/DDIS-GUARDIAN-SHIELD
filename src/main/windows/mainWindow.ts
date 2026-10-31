import { app, BrowserWindow, shell } from 'electron'
import icon from '../../../build/icon.png?asset'
import { runDevScreenshots } from '../devScreenshot'
import { loadRenderer, secureWebPreferences } from './loadRenderer'

const BACKGROUND = '#05070D'

let mainWin: BrowserWindow | null = null
let quitting = false
app.on('before-quit', () => {
  quitting = true
})

export function getMainWindow(): BrowserWindow | null {
  return mainWin && !mainWin.isDestroyed() ? mainWin : null
}

/**
 * Crea la ventana principal. `shouldHideOnClose` decide si al cerrarla la app se queda en la
 * bandeja (vigilante activo) o termina.
 */
export function createMainWindow(shouldHideOnClose: () => boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: BACKGROUND,
    title: 'Escudo Guardián',
    icon,
    webPreferences: secureWebPreferences()
  })
  mainWin = win

  win.on('ready-to-show', () => win.show())
  win.on('close', (event) => {
    if (!quitting && shouldHideOnClose()) {
      event.preventDefault()
      win.hide()
    }
  })
  win.on('closed', () => {
    if (mainWin === win) mainWin = null
  })

  // Los enlaces nunca se abren dentro de la app ni automáticamente.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault()
      if (/^https:\/\//i.test(url)) void shell.openExternal(url)
    }
  })

  loadRenderer(win)
  runDevScreenshots(win)
  return win
}

/** Trae la ventana principal al frente (desde la bandeja, minimizada u oculta). */
export function showMainWindow(): BrowserWindow | null {
  const win = getMainWindow()
  if (!win) return null
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  return win
}

/** Envía un mensaje a la interfaz principal, esperando a que termine de cargar si hace falta. */
export function sendToMain(channel: string, payload?: unknown): void {
  const win = getMainWindow()
  if (!win) return
  const send = (): void => {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', send)
  else send()
}

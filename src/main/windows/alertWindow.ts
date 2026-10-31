import { BrowserWindow, ipcMain, screen } from 'electron'
import { IPC } from '../../shared/ipc'
import type { AlertPayload } from '../../shared/alert'
import { loadRenderer, secureWebPreferences } from './loadRenderer'

const WIDTH = 520
const HEIGHT = 236
/** Distancia desde el borde superior de la pantalla (estilo «launcher»). */
const TOP_OFFSET = 72

let win: BrowserWindow | null = null
let ready = false
let pending: AlertPayload | null = null
let hideOnBlur = false

function position(target: BrowserWindow): void {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { x, y, width } = display.workArea
  target.setBounds({
    x: Math.round(x + (width - WIDTH) / 2),
    y: y + TOP_OFFSET,
    width: WIDTH,
    height: HEIGHT
  })
}

function ensure(): BrowserWindow {
  if (win && !win.isDestroyed()) return win
  const created = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    title: 'Escudo Guardián · Alerta',
    webPreferences: secureWebPreferences()
  })
  created.setAlwaysOnTop(true, 'screen-saver')
  created.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  created.on('blur', () => {
    // Estilo launcher: si pediste la alerta tú mismo y haces clic en otro lado, se va sola.
    if (hideOnBlur) created.hide()
  })
  created.on('closed', () => {
    win = null
    ready = false
  })
  ready = false
  loadRenderer(created, 'alert')
  win = created
  return created
}

/** La interfaz de la alerta avisa que ya está lista para recibir contenido. */
export function registerAlertReady(): void {
  ipcMain.on(IPC.alert.ready, () => {
    ready = true
    if (pending && win && !win.isDestroyed()) {
      win.webContents.send(IPC.alert.show, pending)
      pending = null
    }
  })
}

/** Crea la ventana oculta al arrancar, para que la primera alerta aparezca al instante. */
export function prepareAlertWindow(): void {
  ensure()
}

export interface ShowAlertOptions {
  /** `true`: toma el foco (Enter y Esc funcionan de inmediato). `false`: no interrumpe lo que escribes. */
  focus: boolean
}

export function showAlert(payload: AlertPayload, { focus }: ShowAlertOptions): void {
  const target = ensure()
  hideOnBlur = focus
  position(target)
  if (ready) target.webContents.send(IPC.alert.show, payload)
  else pending = payload
  if (focus) target.show()
  else target.showInactive()
}

/** Solo para pruebas de desarrollo. */
export function getAlertWindow(): BrowserWindow | null {
  return win && !win.isDestroyed() ? win : null
}

export function hideAlert(): void {
  if (win && !win.isDestroyed()) win.hide()
}

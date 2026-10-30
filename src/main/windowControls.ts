import { app, BrowserWindow, ipcMain } from 'electron'
import { IPC } from '../shared/ipc'

/** Controles de la barra de título propia (la ventana no tiene marco). */
export function registerWindowControls(): void {
  const fromEvent = (sender: Electron.WebContents): BrowserWindow | null =>
    BrowserWindow.fromWebContents(sender)

  ipcMain.on(IPC.window.minimize, (e) => fromEvent(e.sender)?.minimize())

  ipcMain.on(IPC.window.toggleMaximize, (e) => {
    const win = fromEvent(e.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  ipcMain.on(IPC.window.close, (e) => fromEvent(e.sender)?.close())

  ipcMain.handle(IPC.window.isMaximized, (e) => fromEvent(e.sender)?.isMaximized() ?? false)

  // Avisa al renderer cuando cambia el estado maximizado, para que el icono del botón sea correcto.
  const notify = (win: BrowserWindow, maximized: boolean): void => {
    if (!win.isDestroyed()) win.webContents.send(IPC.window.maximizedChanged, maximized)
  }
  const attach = (win: BrowserWindow): void => {
    win.on('maximize', () => notify(win, true))
    win.on('unmaximize', () => notify(win, false))
  }
  BrowserWindow.getAllWindows().forEach(attach)
  // Ventanas creadas después de registrar los controles.
  app.on('browser-window-created', (_e, win) => attach(win))
}

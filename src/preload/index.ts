import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'
import type { GuardianApi } from '../shared/api'

/** Preload mínimo: solo expone funciones concretas, nunca ipcRenderer completo. */
const api: GuardianApi = {
  window: {
    minimize: () => ipcRenderer.send(IPC.window.minimize),
    toggleMaximize: () => ipcRenderer.send(IPC.window.toggleMaximize),
    close: () => ipcRenderer.send(IPC.window.close),
    isMaximized: () => ipcRenderer.invoke(IPC.window.isMaximized),
    onMaximizedChange: (listener) => {
      const handler = (_: unknown, maximized: boolean): void => listener(maximized)
      ipcRenderer.on(IPC.window.maximizedChanged, handler)
      return () => ipcRenderer.removeListener(IPC.window.maximizedChanged, handler)
    }
  }
}

contextBridge.exposeInMainWorld('guardian', api)

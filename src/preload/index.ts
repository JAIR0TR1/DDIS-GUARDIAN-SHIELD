import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'
import type { GuardianApi } from '../shared/api'

/** Escucha un evento del proceso principal y devuelve la función para dejar de escucharlo. */
function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_event: unknown, payload: T): void => listener(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

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
  },
  data: {
    getProfile: () => ipcRenderer.invoke(IPC.data.getProfile),
    saveProfile: (profile) => ipcRenderer.invoke(IPC.data.saveProfile, profile),
    getSettings: () => ipcRenderer.invoke(IPC.data.getSettings),
    saveSettings: (settings) => ipcRenderer.invoke(IPC.data.saveSettings, settings),
    getCreature: () => ipcRenderer.invoke(IPC.data.getCreature),
    saveCreature: (creature) => ipcRenderer.invoke(IPC.data.saveCreature, creature),
    getHistory: () => ipcRenderer.invoke(IPC.data.getHistory),
    clearHistory: () => ipcRenderer.invoke(IPC.data.clearHistory),
    onChanged: (listener) => subscribe(IPC.data.changed, () => listener())
  },
  alert: {
    onShow: (listener) => subscribe(IPC.alert.show, listener),
    ready: () => ipcRenderer.send(IPC.alert.ready),
    dismiss: () => ipcRenderer.send(IPC.alert.dismiss),
    openDetail: (entryId) => ipcRenderer.send(IPC.alert.openDetail, entryId)
  },
  nav: {
    onGo: (listener) => subscribe(IPC.nav.go, listener)
  },
  shortcut: {
    set: (shortcut) => ipcRenderer.invoke(IPC.shortcut.set, shortcut)
  },
  analysis: {
    run: (input) => ipcRenderer.invoke(IPC.analysis.run, input)
  },
  config: {
    get: () => ipcRenderer.invoke(IPC.config.get)
  },
  ai: {
    saveKey: (key) => ipcRenderer.invoke(IPC.ai.saveKey, key),
    clearKey: () => ipcRenderer.invoke(IPC.ai.clearKey),
    test: () => ipcRenderer.invoke(IPC.ai.test)
  },
  app: {
    relaunch: () => ipcRenderer.invoke(IPC.app.relaunch)
  }
}

contextBridge.exposeInMainWorld('guardian', api)

import { app, ipcMain } from 'electron'
import { IPC } from '../shared/ipc'
import { creatureSchema, profileSchema, settingsSchema } from '../shared/models'
import type { AiTestResult, AppConfig } from '../shared/analysis'
import { testGemini } from './analysis/aiTest'
import type { AnalysisService } from './analysis/service'
import { activeApiKey, type RuntimeConfig } from './config'
import type { ApiKeyStore } from './secrets/apiKeyStore'
import type { AppData } from './storage/appData'

export interface IpcDeps {
  data: AppData
  analysis: AnalysisService
  keys: ApiKeyStore
  config: RuntimeConfig
}

/** Los datos que llegan del renderer se validan siempre en main: no se confía en el renderer. */
export function registerDataIpc({ data, analysis, keys, config }: IpcDeps): void {
  ipcMain.handle(IPC.data.getProfile, () => data.getProfile())
  ipcMain.handle(IPC.data.saveProfile, (_e, value: unknown) =>
    data.saveProfile(profileSchema.parse(value))
  )
  ipcMain.handle(IPC.data.getSettings, () => data.getSettings())
  ipcMain.handle(IPC.data.saveSettings, (_e, value: unknown) =>
    data.saveSettings(settingsSchema.parse(value))
  )
  ipcMain.handle(IPC.data.getCreature, () => data.getCreature())
  ipcMain.handle(IPC.data.saveCreature, (_e, value: unknown) =>
    data.saveCreature(creatureSchema.parse(value))
  )
  ipcMain.handle(IPC.data.getHistory, () => data.getHistory())
  ipcMain.handle(IPC.data.clearHistory, () => data.clearHistory())
  ipcMain.handle(IPC.analysis.run, (_e, input: unknown) => analysis.run(input))

  ipcMain.handle(IPC.config.get, async (): Promise<AppConfig> => ({
    demoMode: config.demoMode,
    // La clave se calcula en vivo (guardarla desde Ajustes se nota sin reiniciar la pantalla).
    hasKey: (await activeApiKey(keys)) !== null,
    packaged: config.packaged
  }))

  // La clave solo viaja del renderer a main al guardarla; nunca en sentido contrario.
  ipcMain.handle(IPC.ai.saveKey, async (_e, key: unknown) => {
    if (typeof key !== 'string') throw new Error('La clave debe ser texto')
    await keys.set(key)
  })
  ipcMain.handle(IPC.ai.clearKey, () => keys.clear())
  ipcMain.handle(IPC.ai.test, async (): Promise<AiTestResult> => {
    const apiKey = await activeApiKey(keys)
    if (!apiKey) return { ok: false, message: 'Aún no hay una clave guardada.' }
    return testGemini(apiKey, config.modelFast)
  })

  ipcMain.handle(IPC.app.relaunch, () => {
    // En desarrollo no se reinicia: el reinicio lo hace electron-vite al guardar cambios.
    if (!app.isPackaged) return
    app.relaunch()
    app.exit(0)
  })
}

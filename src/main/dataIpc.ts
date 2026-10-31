import { ipcMain } from 'electron'
import { IPC } from '../shared/ipc'
import { creatureSchema, profileSchema, settingsSchema } from '../shared/models'
import type { AnalysisService } from './analysis/service'
import { getConfig } from './config'
import type { AppData } from './storage/appData'

/** Los datos que llegan del renderer se validan siempre en main: no se confía en el renderer. */
export function registerDataIpc(data: AppData, analysis: AnalysisService): void {
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
  ipcMain.handle(IPC.config.get, () => getConfig())
}

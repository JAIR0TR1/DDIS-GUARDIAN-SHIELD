import { app, ipcMain } from 'electron'
import { z } from 'zod'
import { addXp } from '../domain/xp'
import { MAX_GAME_XP } from '../domain/arena'
import { usableSkin } from '../domain/skins'
import { IPC } from '../shared/ipc'
import { creatureSchema, profileSchema, settingsSchema } from '../shared/models'
import { analyzeInputSchema, type AiTestResult, type AppConfig } from '../shared/analysis'
import type { ImageAnalysisResponse } from '../shared/image'
import { userMessageOf } from './analysis/providerError'
import { testGemini } from './analysis/aiTest'
import type { AnalysisService } from './analysis/service'
import { activeApiKey, type RuntimeConfig } from './config'
import type { ApiKeyStore } from './secrets/apiKeyStore'
import type { GuardianController } from './guardianController'
import type { AppData } from './storage/appData'

export interface IpcDeps {
  data: AppData
  analysis: AnalysisService
  keys: ApiKeyStore
  config: RuntimeConfig
  controller: GuardianController
}

/** Los datos que llegan del renderer se validan siempre en main: no se confía en el renderer. */
export function registerDataIpc({ data, analysis, keys, config, controller }: IpcDeps): void {
  ipcMain.handle(IPC.data.getProfile, () => data.getProfile())
  ipcMain.handle(IPC.data.saveProfile, async (_e, value: unknown) => {
    const saved = await data.saveProfile(profileSchema.parse(value))
    controller.onProfileSaved(saved)
    return saved
  })

  // Ventana flotante de alerta y atajo global.
  ipcMain.on(IPC.alert.dismiss, () => controller.dismissAlert())
  ipcMain.on(IPC.alert.openDetail, (_e, entryId: unknown) =>
    controller.openDetail(typeof entryId === 'string' ? entryId : undefined)
  )
  ipcMain.handle(IPC.shortcut.set, (_e, shortcut: unknown) =>
    controller.setShortcut(typeof shortcut === 'string' ? shortcut : '')
  )
  ipcMain.handle(IPC.data.getSettings, () => data.getSettings())
  ipcMain.handle(IPC.data.saveSettings, async (_e, value: unknown) => {
    const saved = await data.saveSettings(settingsSchema.parse(value))
    controller.onSettingsSaved(saved)
    return saved
  })
  ipcMain.handle(IPC.data.getCreature, () => data.getCreature())
  ipcMain.handle(IPC.data.saveCreature, (_e, value: unknown) => {
    const creature = creatureSchema.parse(value)
    // Una apariencia que aún no se desbloquea no se puede guardar.
    return data.saveCreature({ ...creature, skin: usableSkin(creature.skin, creature.level) })
  })
  // Arena: la XP llega del renderer, así que se valida y se limita aquí.
  ipcMain.handle(IPC.arena.reward, async (_e, value: unknown) => {
    const xp = z.number().int().min(0).max(MAX_GAME_XP).parse(value)
    const creature = await data.getCreature()
    const gain = addXp({ level: creature.level, xp: creature.xp }, xp)
    const updated = await data.saveCreature({ ...creature, ...gain.progress })
    return { creature: updated, levelsGained: gain.levelsGained }
  })
  ipcMain.handle(IPC.data.getHistory, () => data.getHistory())
  ipcMain.handle(IPC.data.clearHistory, () => data.clearHistory())
  ipcMain.handle(IPC.analysis.run, (_e, input: unknown) => analysis.run(input))
  ipcMain.handle(IPC.analysis.peek, (_e, text: unknown) =>
    // El texto se valida igual que en un análisis completo (tamaño máximo incluido).
    analysis.peek(analyzeInputSchema.shape.text.parse(text))
  )
  // Las capturas devuelven un mensaje amable en vez de lanzar: así llega a la pantalla tal cual.
  ipcMain.handle(
    IPC.analysis.runImage,
    async (_e, input: unknown): Promise<ImageAnalysisResponse> => {
      try {
        return { ok: true, outcomes: await analysis.runImage(input) }
      } catch (error) {
        console.warn(
          '[analysis] Falló el análisis de la captura:',
          error instanceof Error ? error.message : error
        )
        return { ok: false, message: userMessageOf(error) }
      }
    }
  )

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

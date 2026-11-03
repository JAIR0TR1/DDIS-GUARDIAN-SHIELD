import { app } from 'electron'
import { join } from 'node:path'
import {
  creatureSchema,
  DEFAULT_SETTINGS,
  profileSchema,
  settingsSchema,
  type Creature,
  type Profile,
  type Settings
} from '../../shared/models'
import { historySchema, type HistoryEntry } from '../../shared/history'
import creatureTemplate from '../../../data/creature.json'
import { JsonStore } from './jsonStore'

/**
 * Carpeta de datos del usuario. En desarrollo, `GUARDIAN_DATA_DIR` ya redirigió `userData`
 * desde index.ts (pruebas y capturas sin tocar los datos reales); en la app instalada se ignora.
 */
function dataDir(): string {
  return app.getPath('userData')
}

const MAX_HISTORY = 500

export interface AppData {
  getHistory: () => Promise<HistoryEntry[]>
  addHistory: (entry: HistoryEntry) => Promise<void>
  /** Reemplaza todo el historial (sincronización). */
  replaceHistory: (entries: HistoryEntry[]) => Promise<void>
  clearHistory: () => Promise<void>
  getProfile: () => Promise<Profile | null>
  saveProfile: (profile: Profile) => Promise<Profile>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<Settings>
  getCreature: () => Promise<Creature>
  saveCreature: (creature: Creature) => Promise<Creature>
}

/** Datos guardados en `dir` (por defecto, la carpeta de datos de la app; por cuenta, su subcarpeta). */
export function createAppData(dir: string = dataDir()): AppData {
  const profile = new JsonStore(join(dir, 'profile.json'), profileSchema)
  const settings = new JsonStore(join(dir, 'settings.json'), settingsSchema)
  const creature = new JsonStore(join(dir, 'creature.json'), creatureSchema)
  const history = new JsonStore(join(dir, 'history.json'), historySchema)
  const template = creatureSchema.parse(creatureTemplate)

  // Las escrituras del historial se encadenan para que dos análisis seguidos no se pisen.
  let queue: Promise<void> = Promise.resolve()
  const enqueue = (task: () => Promise<void>): Promise<void> => {
    const run = queue.then(task)
    queue = run.catch(() => undefined)
    return run
  }

  return {
    getHistory: async () => (await history.read()) ?? [],
    addHistory: (entry) =>
      enqueue(async () => {
        const current = (await history.read()) ?? []
        await history.write([entry, ...current].slice(0, MAX_HISTORY))
      }),
    replaceHistory: (entries) =>
      enqueue(async () => void (await history.write(entries.slice(0, MAX_HISTORY)))),
    clearHistory: () => enqueue(async () => void (await history.write([]))),
    getProfile: () => profile.read(),
    saveProfile: (value) => profile.write(value),
    getSettings: async () => (await settings.read()) ?? DEFAULT_SETTINGS,
    saveSettings: (value) => settings.write(value),
    getCreature: async () => (await creature.read()) ?? template,
    saveCreature: (value) => creature.write(value)
  }
}

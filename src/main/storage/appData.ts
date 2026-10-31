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
import creatureTemplate from '../../../data/creature.json'
import { JsonStore } from './jsonStore'

/**
 * Carpeta de datos del usuario. En desarrollo se puede redirigir con GUARDIAN_DATA_DIR
 * (útil para capturas y pruebas sin tocar los datos reales); en la app instalada se ignora.
 */
function dataDir(): string {
  const override = process.env['GUARDIAN_DATA_DIR']
  return !app.isPackaged && override ? override : app.getPath('userData')
}

export interface AppData {
  getProfile: () => Promise<Profile | null>
  saveProfile: (profile: Profile) => Promise<Profile>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<Settings>
  getCreature: () => Promise<Creature>
  saveCreature: (creature: Creature) => Promise<Creature>
}

export function createAppData(): AppData {
  const dir = dataDir()
  const profile = new JsonStore(join(dir, 'profile.json'), profileSchema)
  const settings = new JsonStore(join(dir, 'settings.json'), settingsSchema)
  const creature = new JsonStore(join(dir, 'creature.json'), creatureSchema)
  const template = creatureSchema.parse(creatureTemplate)

  return {
    getProfile: () => profile.read(),
    saveProfile: (value) => profile.write(value),
    getSettings: async () => (await settings.read()) ?? DEFAULT_SETTINGS,
    saveSettings: (value) => settings.write(value),
    getCreature: async () => (await creature.read()) ?? template,
    saveCreature: (value) => creature.write(value)
  }
}

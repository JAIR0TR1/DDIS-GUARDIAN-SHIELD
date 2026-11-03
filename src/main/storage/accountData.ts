import { app } from 'electron'
import { copyFile, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Account } from '../../shared/auth'
import type { Cloud, RemoteState } from '../cloud/cloud'
import { mergeHistory, stateDirection } from '../cloud/syncPlan'
import { createAppData, type AppData } from './appData'

/**
 * Datos de la cuenta activa. Cada usuario tiene su propia carpeta local
 * (`users/<id>/`), que funciona sin internet, y la nube (Supabase) es la copia común que
 * permite entrar desde cualquier equipo.
 *  - Cada cambio se guarda primero en local y luego se sube. Si no hay internet, se marca como
 *    pendiente y se sube en la siguiente sincronización.
 *  - Al iniciar sesión se sincroniza: el historial se une, el resto sigue `stateDirection`.
 */
export interface AccountData extends AppData {
  /** Activa la cuenta (o ninguna) y sincroniza con la nube. Nunca lanza por falta de red. */
  open: (account: Account | null) => Promise<void>
}

const LEGACY_FILES = ['profile.json', 'settings.json', 'creature.json', 'history.json']
const PENDING_FILE = 'sync-pending'
const MIGRATED_FLAG = 'legacy-migrated'

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export function createAccountData(cloud: Cloud | null): AccountData {
  const root = app.getPath('userData')
  // Sin nube configurada: un solo perfil local, como antes.
  let current: AppData = createAppData(cloud ? join(root, 'users', '_signed-out') : root)
  let account: Account | null = null
  let userDir = root

  const markPending = async (): Promise<void> => {
    if (account) await writeFile(join(userDir, PENDING_FILE), new Date().toISOString())
  }

  async function readState(data: AppData): Promise<RemoteState> {
    const [profile, settings] = await Promise.all([data.getProfile(), data.getSettings()])
    // Si aún no hay perfil, la criatura todavía no existe en este equipo (es la plantilla).
    const creature = profile ? await data.getCreature() : null
    return { profile, creature, settings: profile ? settings : null }
  }

  /** Sube perfil, criatura y ajustes. Si falla (sin red), queda pendiente. */
  async function pushState(): Promise<void> {
    if (!cloud || !account) return
    try {
      await cloud.pushState(account.userId, await readState(current))
    } catch (error) {
      console.warn('[sync] No pude subir los cambios; quedan pendientes', error)
      await markPending()
    }
  }

  /** La primera cuenta que entra en este equipo se lleva los datos que existían antes de las cuentas. */
  async function migrateLegacy(dir: string): Promise<void> {
    if (await exists(join(root, MIGRATED_FLAG))) return
    if (!(await exists(join(root, 'profile.json')))) return
    await mkdir(dir, { recursive: true })
    for (const file of LEGACY_FILES) {
      const from = join(root, file)
      if ((await exists(from)) && !(await exists(join(dir, file))))
        await copyFile(from, join(dir, file))
    }
    await writeFile(join(root, MIGRATED_FLAG), dir)
  }

  async function sync(): Promise<void> {
    if (!cloud || !account) return
    const userId = account.userId
    const pending = await exists(join(userDir, PENDING_FILE))
    try {
      const [remote, remoteHistory, local, localHistory] = await Promise.all([
        cloud.fetchState(userId),
        cloud.fetchHistory(userId),
        readState(current),
        current.getHistory()
      ])
      const direction = stateDirection({
        remoteHasState: remote.profile !== null,
        localHasState: local.profile !== null,
        localPending: pending
      })
      if (direction === 'pull') {
        if (remote.profile) await current.saveProfile(remote.profile)
        if (remote.creature) await current.saveCreature(remote.creature)
        if (remote.settings) await current.saveSettings(remote.settings)
      } else if (direction === 'push') {
        await cloud.pushState(userId, local)
      }

      const merged = mergeHistory(localHistory, remoteHistory)
      const remoteIds = new Set(remoteHistory.map((e) => e.id))
      await cloud.upsertHistory(
        userId,
        merged.filter((e) => !remoteIds.has(e.id))
      )
      await current.replaceHistory(merged)
      await rm(join(userDir, PENDING_FILE), { force: true })
    } catch (error) {
      console.warn('[sync] Sin conexión con la nube; sigo con los datos de este equipo', error)
    }
  }

  return {
    async open(next) {
      account = next
      if (!cloud) return
      if (!next) {
        current = createAppData(join(root, 'users', '_signed-out'))
        userDir = root
        return
      }
      userDir = join(root, 'users', next.userId)
      await migrateLegacy(userDir)
      current = createAppData(userDir)
      await sync()
    },

    getHistory: () => current.getHistory(),
    replaceHistory: (entries) => current.replaceHistory(entries),
    async addHistory(entry) {
      await current.addHistory(entry)
      if (!cloud || !account) return
      try {
        await cloud.upsertHistory(account.userId, [entry])
      } catch (error) {
        console.warn('[sync] No pude subir el análisis; queda pendiente', error)
        await markPending()
      }
    },
    async clearHistory() {
      await current.clearHistory()
      if (!cloud || !account) return
      try {
        await cloud.clearHistory(account.userId)
      } catch (error) {
        console.warn('[sync] No pude borrar el historial en la nube', error)
        await markPending()
      }
    },
    getProfile: () => current.getProfile(),
    async saveProfile(profile) {
      const saved = await current.saveProfile(profile)
      await pushState()
      return saved
    },
    getSettings: () => current.getSettings(),
    async saveSettings(settings) {
      const saved = await current.saveSettings(settings)
      await pushState()
      return saved
    },
    getCreature: () => current.getCreature(),
    async saveCreature(creature) {
      const saved = await current.saveCreature(creature)
      await pushState()
      return saved
    }
  }
}

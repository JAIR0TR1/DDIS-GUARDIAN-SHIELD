import { safeStorage } from 'electron'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

/** Almacenamiento clave-valor asíncrono, con la forma que espera supabase-js para la sesión. */
export interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/**
 * Guarda la sesión de Supabase (tokens de acceso y de renovación) CIFRADA con safeStorage
 * (DPAPI en Windows) en un solo archivo. Si el sistema no permite cifrar, la sesión vive solo en
 * memoria: es preferible pedir iniciar sesión de nuevo a guardar tokens en claro.
 */
export function createEncryptedStorage(file: string): AsyncStorage {
  let cache: Record<string, string> | null = null

  async function load(): Promise<Record<string, string>> {
    if (cache) return cache
    cache = {}
    try {
      const encrypted = await readFile(file)
      if (await safeStorage.isAsyncEncryptionAvailable()) {
        const { result } = await safeStorage.decryptStringAsync(encrypted)
        const parsed: unknown = JSON.parse(result)
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) if (typeof v === 'string') cache[k] = v
        }
      }
    } catch (error) {
      const missing =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
      if (!missing)
        console.warn('[cloud] No pude leer la sesión guardada; se pedirá entrar de nuevo')
    }
    return cache
  }

  async function persist(): Promise<void> {
    if (!cache) return
    if (!(await safeStorage.isAsyncEncryptionAvailable())) return
    if (Object.keys(cache).length === 0) {
      await rm(file, { force: true })
      return
    }
    const encrypted = await safeStorage.encryptStringAsync(JSON.stringify(cache))
    await mkdir(dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    await writeFile(tmp, encrypted)
    await rename(tmp, file)
  }

  return {
    async getItem(key) {
      return (await load())[key] ?? null
    },
    async setItem(key, value) {
      ;(await load())[key] = value
      await persist()
    },
    async removeItem(key) {
      delete (await load())[key]
      await persist()
    }
  }
}

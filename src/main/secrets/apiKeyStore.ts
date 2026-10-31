import { safeStorage } from 'electron'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export interface ApiKeyStore {
  /** Devuelve la clave descifrada. SOLO para uso dentro del proceso main. */
  get: () => Promise<string | null>
  has: () => Promise<boolean>
  set: (key: string) => Promise<void>
  clear: () => Promise<void>
}

/** Validación ligera: evita guardar basura (espacios, saltos de línea, textos enormes). */
export function isPlausibleKey(key: string): boolean {
  return /^[\w-]{20,200}$/.test(key)
}

/**
 * La clave se guarda CIFRADA en un archivo de la carpeta de datos del usuario. En Windows, Electron
 * usa DPAPI: solo este usuario de Windows puede descifrarla. Nunca se devuelve al renderer.
 * Se usa la API asíncrona de safeStorage (la síncrona está obsoleta).
 */
export function createApiKeyStore(file: string): ApiKeyStore {
  async function read(): Promise<Buffer | null> {
    try {
      return await readFile(file)
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
        return null
      throw error
    }
  }

  return {
    async get() {
      const encrypted = await read()
      if (!encrypted) return null
      if (!(await safeStorage.isAsyncEncryptionAvailable())) {
        console.warn(
          '[secrets] El cifrado del sistema no está disponible; no se puede leer la clave'
        )
        return null
      }
      const { result } = await safeStorage.decryptStringAsync(encrypted)
      return result
    },
    async has() {
      return (await read()) !== null
    },
    async set(key) {
      const clean = key.trim()
      if (!isPlausibleKey(clean)) throw new Error('La clave no tiene un formato válido')
      if (!(await safeStorage.isAsyncEncryptionAvailable())) {
        // Sin cifrado del sistema es preferible NO guardar la clave a guardarla en claro.
        throw new Error('Este equipo no permite cifrar la clave, así que no la guardo')
      }
      const encrypted = await safeStorage.encryptStringAsync(clean)
      await mkdir(dirname(file), { recursive: true })
      const tmp = `${file}.tmp`
      await writeFile(tmp, encrypted)
      await rename(tmp, file)
    },
    async clear() {
      await rm(file, { force: true })
    }
  }
}

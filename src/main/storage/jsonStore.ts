import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ZodType } from 'zod'

/**
 * Almacén de un archivo JSON validado con Zod. Sin módulos nativos.
 * - Escritura atómica (archivo temporal + rename) para no dejar JSON a medias.
 * - Si el archivo está corrupto o no cumple el esquema, se aparta como `.corrupt` y se avisa
 *   por consola: nunca se descarta en silencio.
 */
export class JsonStore<T> {
  constructor(
    private readonly file: string,
    private readonly schema: ZodType<T>
  ) {}

  /** Devuelve el valor guardado o `null` si el archivo no existe. */
  async read(): Promise<T | null> {
    let raw: string
    try {
      raw = await readFile(this.file, 'utf8')
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
    try {
      return this.schema.parse(JSON.parse(raw))
    } catch (error) {
      const backup = `${this.file}.corrupt`
      console.warn(
        `[storage] ${this.file} no es válido (${describe(error)}); lo aparto en ${backup}`
      )
      await rename(this.file, backup)
      return null
    }
  }

  async write(value: T): Promise<T> {
    const valid = this.schema.parse(value)
    await mkdir(dirname(this.file), { recursive: true })
    const tmp = `${this.file}.tmp`
    await writeFile(tmp, JSON.stringify(valid, null, 2), 'utf8')
    await rename(tmp, this.file)
    return valid
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message.split('\n')[0] : String(error)
}

import { app } from 'electron'
import { join } from 'node:path'
import type { AppConfig } from '../shared/analysis'
import type { ApiKeyStore } from './secrets/apiKeyStore'

/**
 * Configuración de entorno. En desarrollo se carga el `.env` de la raíz del proyecto desde el
 * código (nunca se lee ni se muestra su contenido). La app instalada NO incluye `.env`: allí la
 * clave se guarda cifrada desde Ajustes.
 */
export function loadEnvironment(): void {
  if (app.isPackaged) return
  try {
    process.loadEnvFile(join(app.getAppPath(), '.env'))
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : ''
    if (code !== 'ENOENT') console.warn('[config] No pude cargar el archivo .env', code)
  }
}

export interface RuntimeConfig extends AppConfig {
  modelFast: string | undefined
  modelVision: string | undefined
}

/**
 * Se calcula UNA vez al arrancar: cambiar entre demo y real requiere reiniciar la app.
 * - Si `DEMO_MODE` está definido, manda: solo «false» desactiva el demo.
 * - Si no está definido (app instalada), hay modo real únicamente cuando ya hay una clave guardada.
 */
export async function resolveConfig(keys: ApiKeyStore): Promise<RuntimeConfig> {
  const flag = process.env['DEMO_MODE']?.trim().toLowerCase()
  const hasStoredKey = await keys.has()
  const demoMode = flag === undefined || flag === '' ? !hasStoredKey : flag !== 'false'
  return {
    demoMode,
    hasKey: hasStoredKey || Boolean(process.env['GEMINI_API_KEY']?.trim()),
    packaged: app.isPackaged,
    modelFast: process.env['MODEL_FAST']?.trim() || undefined,
    modelVision: process.env['MODEL_VISION']?.trim() || undefined
  }
}

/** Clave activa: la guardada (cifrada) manda; en desarrollo se acepta la del .env. */
export async function activeApiKey(keys: ApiKeyStore): Promise<string | null> {
  const stored = await keys.get()
  if (stored) return stored
  if (app.isPackaged) return null
  return process.env['GEMINI_API_KEY']?.trim() || null
}

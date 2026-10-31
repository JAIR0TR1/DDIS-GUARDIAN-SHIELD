import { app } from 'electron'
import { join } from 'node:path'
import type { AppConfig } from '../shared/analysis'

/**
 * Configuración de entorno. En desarrollo se carga el `.env` de la raíz del proyecto desde el
 * código (nunca se lee ni se muestra su contenido). La app instalada NO incluye `.env`: allí la
 * clave se guarda cifrada desde Ajustes (fase 4) y, sin clave, se usa el modo demo.
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

export function getConfig(): AppConfig {
  // Por defecto, modo demo: seguro y sin red. Solo "false" lo desactiva.
  const demoMode = process.env['DEMO_MODE']?.trim().toLowerCase() !== 'false'
  return { demoMode }
}

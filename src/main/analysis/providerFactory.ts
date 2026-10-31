import type { RuntimeConfig } from '../config'
import { activeApiKey } from '../config'
import type { ApiKeyStore } from '../secrets/apiKeyStore'
import type { ThreatProvider } from './analyzeThreat'
import { demoProvider } from './demoProvider'
import { createGeminiProvider } from './geminiProvider'

export interface ProviderChoice {
  provider: ThreatProvider | null
  /** Aviso cuando no hay proveedor (p. ej. falta la clave). */
  notice?: string
}

/** Elige el proveedor en cada análisis, para que guardar o borrar la clave se note al instante. */
export function createProviderResolver(
  config: RuntimeConfig,
  keys: ApiKeyStore
): () => Promise<ProviderChoice> {
  return async () => {
    if (config.demoMode) return { provider: demoProvider }
    const apiKey = await activeApiKey(keys)
    if (!apiKey) {
      return {
        provider: null,
        notice:
          'Falta la clave de Gemini, así que usé solo las reglas locales. Agrégala en Ajustes.'
      }
    }
    return { provider: createGeminiProvider({ apiKey, model: config.modelFast }) }
  }
}

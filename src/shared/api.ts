import type { AnalysisOutcome, AnalyzeInput, AppConfig } from './analysis'
import type { HistoryEntry } from './history'
import type { Creature, Profile, Settings } from './models'

/** Contrato tipado de lo que el preload expone al renderer como `window.guardian`. */
export interface GuardianApi {
  window: {
    minimize: () => void
    toggleMaximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    /** Devuelve una función para dejar de escuchar. */
    onMaximizedChange: (listener: (maximized: boolean) => void) => () => void
  }
  data: {
    /** `null` si aún no hay perfil (primer arranque). */
    getProfile: () => Promise<Profile | null>
    saveProfile: (profile: Profile) => Promise<Profile>
    getSettings: () => Promise<Settings>
    saveSettings: (settings: Settings) => Promise<Settings>
    getCreature: () => Promise<Creature>
    saveCreature: (creature: Creature) => Promise<Creature>
    getHistory: () => Promise<HistoryEntry[]>
    clearHistory: () => Promise<void>
  }
  analysis: {
    /** Analiza un texto. Rechaza con un mensaje claro si la entrada no es válida. */
    run: (input: AnalyzeInput) => Promise<AnalysisOutcome>
  }
  config: {
    get: () => Promise<AppConfig>
  }
}

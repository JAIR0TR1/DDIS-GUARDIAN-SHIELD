import type { AlertPayload, NavigateRequest, ShortcutChange, WatcherEvent } from './alert'
import type { AiTestResult, AnalysisOutcome, AnalyzeInput, AppConfig } from './analysis'
import type { HistoryEntry } from './history'
import type { AnalyzeImageInput, ImageAnalysisResponse } from './image'
import type { Creature, Profile, Settings } from './models'
import type { ThreatResult } from './threat'

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
    /** Avisa cuando algo cambió en segundo plano (atajo, vigilante). Devuelve cómo dejar de escuchar. */
    onChanged: (listener: () => void) => () => void
  }
  alert: {
    onShow: (listener: (payload: AlertPayload) => void) => () => void
    /** La ventana flotante avisa que ya puede recibir contenido. */
    ready: () => void
    dismiss: () => void
    /** Abre la ventana principal en el historial, en esa entrada. */
    openDetail: (entryId: string) => void
  }
  watcher: {
    /** Qué hizo el vigilante con lo último copiado (nunca incluye el contenido). */
    onEvent: (listener: (event: WatcherEvent) => void) => () => void
  }
  nav: {
    onGo: (listener: (request: NavigateRequest) => void) => () => void
  }
  shortcut: {
    /** Valida, registra y guarda un atajo global nuevo. */
    set: (shortcut: string) => Promise<ShortcutChange>
  }
  analysis: {
    /** Analiza un texto. Rechaza con un mensaje claro si la entrada no es válida. */
    run: (input: AnalyzeInput) => Promise<AnalysisOutcome>
    /** Analiza una captura de pantalla. Si no se puede, devuelve un mensaje amable (no lanza). */
    runImage: (input: AnalyzeImageInput) => Promise<ImageAnalysisResponse>
    /** Primer vistazo con las reglas locales (sin IA, sin guardar nada). */
    peek: (text: string) => Promise<ThreatResult>
  }
  config: {
    get: () => Promise<AppConfig>
  }
  ai: {
    /** Guarda la clave cifrada. La clave nunca vuelve al renderer. */
    saveKey: (key: string) => Promise<void>
    clearKey: () => Promise<void>
    test: () => Promise<AiTestResult>
  }
  app: {
    /** Reinicia la app (solo en la versión instalada). */
    relaunch: () => Promise<void>
  }
}

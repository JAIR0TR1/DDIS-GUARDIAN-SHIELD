import type { HistoryEntry } from './history'

/** Lo que el proceso principal le pide mostrar a la ventana flotante de alerta. */
export type AlertPayload =
  | { kind: 'scanning'; passive: boolean }
  | {
      kind: 'result'
      entry: HistoryEntry
      xpGained: number
      /** `true` si la alerta vino del vigilante del portapapeles (no la pidió el usuario). */
      passive: boolean
      notice?: string
    }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

/** Pedido de navegación del proceso principal a la ventana principal. */
export interface NavigateRequest {
  section: 'inicio' | 'analizar' | 'historial' | 'criatura' | 'ajustes'
  /** Entrada del historial a seleccionar. */
  entryId?: string
}

export interface ShortcutChange {
  ok: boolean
  /** Frase lista para mostrar. */
  message: string
  /** Atajo vigente tras el cambio (en formato visible, p. ej. «Ctrl+Shift+G»). */
  shortcut: string
}

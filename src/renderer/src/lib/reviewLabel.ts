import type { HistoryEntry } from '@shared/history'

/** Etiqueta honesta de quién revisó el mensaje (la IA de demostración está simulada). */
export function reviewLabel(entry: Pick<HistoryEntry, 'usedAI' | 'provider'>): string {
  if (!entry.usedAI) return 'Revisado en tu equipo'
  return entry.provider === 'demo' ? 'IA simulada (modo demo)' : 'Revisado con IA'
}

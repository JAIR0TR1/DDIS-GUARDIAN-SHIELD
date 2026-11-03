import type { HistoryEntry } from '../../shared/history'

/**
 * Reglas puras de sincronización (sin red ni Electron, para poder probarlas).
 *  - Historial: se unen ambos lados por id; nunca se pierde un análisis.
 *  - Perfil, criatura y ajustes: gana la nube si tiene datos (es lo que el usuario usó por
 *    última vez en cualquier equipo); si la nube está vacía, se sube lo local.
 *  - Si hubo cambios locales que no se pudieron subir (sin internet), primero se suben.
 */

export const MAX_HISTORY = 500

export function mergeHistory(
  local: readonly HistoryEntry[],
  remote: readonly HistoryEntry[]
): HistoryEntry[] {
  const byId = new Map<string, HistoryEntry>()
  for (const entry of [...remote, ...local]) byId.set(entry.id, entry)
  return [...byId.values()]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, MAX_HISTORY)
}

export type StateDirection = 'pull' | 'push' | 'none'

export function stateDirection(options: {
  remoteHasState: boolean
  localHasState: boolean
  localPending: boolean
}): StateDirection {
  if (options.localPending && options.localHasState) return 'push'
  if (options.remoteHasState) return 'pull'
  if (options.localHasState) return 'push'
  return 'none'
}

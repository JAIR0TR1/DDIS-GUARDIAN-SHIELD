import type { HistoryEntry } from '@shared/history'
import type { Translate } from '@shared/i18n'

/** Etiqueta honesta de quién revisó el mensaje (la IA de demostración está simulada). */
export function reviewLabel(
  entry: Pick<HistoryEntry, 'usedAI' | 'provider'>,
  t: Translate
): string {
  if (!entry.usedAI) return t('review.local')
  return entry.provider === 'demo' ? t('review.demo') : t('review.ai')
}

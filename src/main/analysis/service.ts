import { createHash, randomUUID } from 'node:crypto'
import { LruCache } from '../../domain/cache'
import { addXp, XP_BY_VERDICT } from '../../domain/xp'
import { fold } from '../../domain/text'
import { excerpt } from '../../shared/safeText'
import { analyzeInputSchema, type AnalysisOutcome } from '../../shared/analysis'
import type { HistoryEntry } from '../../shared/history'
import type { AppData } from '../storage/appData'
import { analyzeThreat, type AnalyzeOutput, type ThreatProvider } from './analyzeThreat'

const ONE_HOUR = 60 * 60 * 1000

export interface AnalysisService {
  run: (input: unknown) => Promise<AnalysisOutcome>
}

/** Clave de caché: mismo contenido (sin importar mayúsculas ni tildes) y mismos umbrales. */
export function cacheKey(text: string, safeBelow: number, dangerAbove: number): string {
  const normalized = fold(text).replace(/\s+/g, ' ').trim()
  return createHash('sha256').update(`${safeBelow}|${dangerAbove}|${normalized}`).digest('hex')
}

/**
 * Orquesta un análisis completo: reglas → IA (si es ambiguo) → caché → historial → XP.
 * El proveedor se pide en cada análisis para que el cambio de clave en Ajustes se note al instante.
 */
export function createAnalysisService(
  data: AppData,
  getProvider: () => ThreatProvider | null
): AnalysisService {
  const cache = new LruCache<AnalyzeOutput>(200, ONE_HOUR)

  return {
    async run(rawInput) {
      const input = analyzeInputSchema.parse(rawInput)
      const settings = await data.getSettings()
      const { safeBelow, dangerAbove } = settings.thresholds
      const key = cacheKey(input.text, safeBelow, dangerAbove)

      const cached = cache.get(key)
      const output =
        cached ??
        (await analyzeThreat(input, {
          thresholds: settings.thresholds,
          provider: getProvider()
        }))
      if (!cached && !output.notice) cache.set(key, output)

      const entry: HistoryEntry = {
        id: randomUUID(),
        at: new Date().toISOString(),
        source: input.source,
        excerpt: excerpt(input.text, 200),
        result: output.result,
        usedAI: output.usedAI,
        provider: output.provider
      }
      await data.addHistory(entry)

      // Repetir el mismo mensaje no suma XP otra vez (evita «granjear» puntos).
      const creature = await data.getCreature()
      const xpGained = cached ? 0 : XP_BY_VERDICT[output.result.verdict]
      const gain = addXp({ level: creature.level, xp: creature.xp }, xpGained)
      const updated = await data.saveCreature({ ...creature, ...gain.progress })

      return {
        entry,
        text: input.text,
        creature: updated,
        xpGained,
        levelsGained: gain.levelsGained,
        fromCache: cached !== undefined,
        notice: cached
          ? 'Ya había revisado este mensaje, así que no suma XP otra vez.'
          : output.notice
      }
    }
  }
}

import { createHash, randomUUID } from 'node:crypto'
import { LruCache } from '../../domain/cache'
import { addXp, XP_BY_VERDICT } from '../../domain/xp'
import { fold } from '../../domain/text'
import { analyzeLocal } from '../../domain/rules'
import { toThreatResult } from '../../domain/explain'
import type { ThreatResult } from '../../shared/threat'
import { excerpt } from '../../shared/safeText'
import { analyzeInputSchema, type AnalysisOutcome } from '../../shared/analysis'
import type { HistoryEntry } from '../../shared/history'
import type { AppData } from '../storage/appData'
import { analyzeThreat, type AnalyzeOutput, type ThreatProvider } from './analyzeThreat'

const ONE_HOUR = 60 * 60 * 1000

export interface RunOptions {
  /** `false`: solo reglas locales, sin consultar a la IA (p. ej. el vigilante del portapapeles). */
  useAI?: boolean
}

export interface AnalysisService {
  run: (input: unknown, options?: RunOptions) => Promise<AnalysisOutcome>
  /** Mira un texto con las reglas locales SIN guardar nada (ni historial ni XP). */
  peek: (text: string) => Promise<ThreatResult>
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
  getProvider: () => Promise<{ provider: ThreatProvider | null; notice?: string }>
): AnalysisService {
  const cache = new LruCache<AnalyzeOutput>(200, ONE_HOUR)

  return {
    async peek(text) {
      const settings = await data.getSettings()
      return toThreatResult(analyzeLocal(text, settings.thresholds))
    },

    async run(rawInput, options = {}) {
      const input = analyzeInputSchema.parse(rawInput)
      const settings = await data.getSettings()
      const { safeBelow, dangerAbove } = settings.thresholds
      const key = cacheKey(input.text, safeBelow, dangerAbove)
      const useAI = options.useAI !== false

      const cached = cache.get(key)
      const choice = cached || !useAI ? null : await getProvider()
      const output =
        cached ??
        (await analyzeThreat(input, {
          thresholds: settings.thresholds,
          provider: choice?.provider ?? null,
          noProviderNotice: choice?.notice
        }))
      // Un resultado sin IA no se guarda en la caché: si luego se pide con IA, debe consultarla.
      if (!cached && !output.notice && useAI) cache.set(key, output)

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

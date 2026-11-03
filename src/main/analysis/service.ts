import { createHash, randomUUID } from 'node:crypto'
import { LruCache } from '../../domain/cache'
import { addXp, XP_BY_VERDICT } from '../../domain/xp'
import { fold } from '../../domain/text'
import { analyzeLocal } from '../../domain/rules'
import { guardScore, guardVerdict, toThreatResult } from '../../domain/explain'
import type { ThreatResult } from '../../shared/threat'
import { excerpt } from '../../shared/safeText'
import { analyzeInputSchema, type AnalysisOutcome } from '../../shared/analysis'
import { analyzeImageInputSchema, visionResultSchema } from '../../shared/image'
import type { HistoryEntry, InputSource } from '../../shared/history'
import type { AppData } from '../storage/appData'
import { analyzeThreat, mergeSpans, type AnalyzeOutput, type ThreatProvider } from './analyzeThreat'
import { ProviderError } from './providerError'

const ONE_HOUR = 60 * 60 * 1000

export interface RunOptions {
  /** `false`: solo reglas locales, sin consultar a la IA (p. ej. el vigilante del portapapeles). */
  useAI?: boolean
}

export interface AnalysisService {
  run: (input: unknown, options?: RunOptions) => Promise<AnalysisOutcome>
  /** Analiza una captura de pantalla con el modelo de visión. Lanza ProviderError si no se puede. */
  /** Analiza una captura: un resultado por cada mensaje que contenga. */
  runImage: (input: unknown) => Promise<AnalysisOutcome[]>
  /** Mira un texto con las reglas locales SIN guardar nada (ni historial ni XP). */
  peek: (text: string) => Promise<ThreatResult>
}

/** Clave de caché: mismo contenido (sin importar mayúsculas ni tildes), umbrales e idioma. */
export function cacheKey(
  text: string,
  safeBelow: number,
  dangerAbove: number,
  language = 'es'
): string {
  const normalized = fold(text).replace(/\s+/g, ' ').trim()
  return createHash('sha256')
    .update(`${safeBelow}|${dangerAbove}|${language}|${normalized}`)
    .digest('hex')
}

const imageKey = (data: string): string => createHash('sha256').update(data).digest('hex')

type ProviderChoice = { provider: ThreatProvider | null; notice?: string }

interface Finish {
  source: InputSource
  /** Texto que se muestra y resalta (en una captura, lo que la IA transcribió). */
  text: string
  output: AnalyzeOutput & { demo?: boolean }
  cached: boolean
}

/**
 * Orquesta un análisis completo: reglas → IA (si es ambiguo) → caché → historial → XP.
 * El proveedor se pide en cada análisis para que el cambio de clave en Ajustes se note al instante.
 */
export function createAnalysisService(
  data: AppData,
  getProvider: () => Promise<ProviderChoice>
): AnalysisService {
  const cache = new LruCache<AnalyzeOutput>(200, ONE_HOUR)
  const imageCache = new LruCache<ImageOutput[]>(50, ONE_HOUR)

  /** Guarda en el historial, suma XP (una sola vez por contenido) y arma la respuesta. */
  async function finish({ source, text, output, cached }: Finish): Promise<AnalysisOutcome> {
    const entry: HistoryEntry = {
      id: randomUUID(),
      at: new Date().toISOString(),
      source,
      excerpt: excerpt(text, 200),
      result: output.result,
      usedAI: output.usedAI,
      provider: output.provider
    }
    await data.addHistory(entry)

    // Repetir el mismo contenido no suma XP otra vez (evita «granjear» puntos).
    const creature = await data.getCreature()
    const xpGained = cached ? 0 : XP_BY_VERDICT[output.result.verdict]
    const gain = addXp({ level: creature.level, xp: creature.xp }, xpGained)
    const updated = await data.saveCreature({ ...creature, ...gain.progress })

    return {
      entry,
      text,
      creature: updated,
      xpGained,
      levelsGained: gain.levelsGained,
      fromCache: cached,
      notice: cached ? 'Ya había revisado esto, así que no suma XP otra vez.' : output.notice
    }
  }

  return {
    async peek(text) {
      const settings = await data.getSettings()
      return toThreatResult(analyzeLocal(text, settings.thresholds))
    },

    async run(rawInput, options = {}) {
      const input = analyzeInputSchema.parse(rawInput)
      const settings = await data.getSettings()
      const { safeBelow, dangerAbove } = settings.thresholds
      const key = cacheKey(input.text, safeBelow, dangerAbove, settings.language)
      const useAI = options.useAI !== false

      const cached = cache.get(key)
      const choice = cached || !useAI ? null : await getProvider()
      const output =
        cached ??
        (await analyzeThreat(input, {
          thresholds: settings.thresholds,
          provider: choice?.provider ?? null,
          noProviderNotice: choice?.notice,
          language: settings.language
        }))
      // Un resultado sin IA no se guarda en la caché: si luego se pide con IA, debe consultarla.
      if (!cached && !output.notice && useAI) cache.set(key, output)

      return finish({
        source: input.source,
        text: input.text,
        output,
        cached: cached !== undefined
      })
    },

    async runImage(rawInput) {
      const input = analyzeImageInputSchema.parse(rawInput)
      const settings = await data.getSettings()
      const key = imageKey(input.data)

      const hit = imageCache.get(key)
      if (hit) {
        const outcomes: AnalysisOutcome[] = []
        for (const output of hit) {
          outcomes.push(
            await finish({
              source: 'image',
              text: output.extractedText || NO_TEXT,
              output,
              cached: true
            })
          )
        }
        return outcomes
      }

      // Las capturas SIEMPRE necesitan IA (hay que leerlas): sin proveedor no hay plan B.
      const choice = await getProvider()
      const provider = choice.provider
      if (!provider?.refineImage) {
        throw new ProviderError(
          'Sin proveedor de imágenes',
          choice.notice ?? 'Para analizar capturas necesito la IA. Agrega tu clave en Ajustes.'
        )
      }

      let raw: unknown
      try {
        raw = await provider.refineImage({ ...input, language: settings.language })
      } catch (error) {
        // Los mensajes de texto caen a las reglas locales; una captura no tiene plan B: se dice así.
        if (error instanceof ProviderError) {
          throw new ProviderError(
            error.message,
            error.userMessage.replace(/\s*Usé las reglas locales\.?/, ' Inténtalo en un momento.')
          )
        }
        throw error
      }
      const parsed = visionResultSchema.safeParse(raw)
      if (!parsed.success) {
        // Solo la ruta del campo y el motivo: nunca el contenido de la captura.
        console.warn(
          '[vision] Salida inválida:',
          parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`)
        )
        throw new ProviderError(
          'Salida de visión inválida',
          'La IA respondió algo que no pude leer. Inténtalo de nuevo.'
        )
      }
      const demo = provider.name === 'demo'
      // Cada mensaje de la captura se revisa por separado: las reglas locales leen su transcripción
      // y la IA no puede bajar un «peligroso».
      const outputs: ImageOutput[] = parsed.data.messages.map(({ extractedText, ...ai }) => {
        const local = analyzeLocal(extractedText, settings.thresholds)
        const localResult = toThreatResult(local)
        return {
          extractedText,
          demo,
          usedAI: true,
          provider: provider.name,
          notice: demo
            ? 'Modo demo: este resultado es un ejemplo, no leí tu imagen. Con la IA real sí la leo.'
            : undefined,
          result: {
            ...ai,
            verdict: guardVerdict(local.verdict, ai.verdict),
            score: guardScore(local, ai.score),
            signals:
              ai.signals.length > 0
                ? mergeSpans(ai.signals, localResult.signals)
                : localResult.signals
          }
        }
      })
      if (!demo) imageCache.set(key, outputs)
      const outcomes: AnalysisOutcome[] = []
      for (const output of outputs) {
        outcomes.push(
          await finish({
            source: 'image',
            text: output.extractedText || NO_TEXT,
            output,
            cached: false
          })
        )
      }
      return outcomes
    }
  }
}

const NO_TEXT = '(No pude leer texto en la captura)'

/** Resultado de un mensaje de una captura, con su transcripción. */
type ImageOutput = AnalyzeOutput & { extractedText: string; demo: boolean }

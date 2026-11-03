import { analyzeLocal, type LocalAnalysis, type Thresholds } from '../../domain/rules'
import { guardScore, guardVerdict, toThreatResult } from '../../domain/explain'
import { maskSensitive } from '../../domain/mask'
import { threatResultSchema, type ThreatResult } from '../../shared/threat'
import { userMessageOf } from './providerError'
import type { Language } from '../../shared/i18n'

/** Lo que recibe un proveedor de IA para casos ambiguos. */
export interface ProviderInput {
  /** Texto YA enmascarado (sin tarjetas, claves ni códigos). */
  text: string
  source: 'text' | 'link' | 'image'
  local: LocalAnalysis
  /** Idioma en que la IA debe escribir etiquetas, consejo y voz de Nilo (por defecto español). */
  language?: Language
}

/**
 * Proveedor de IA intercambiable (Gemini, demo, un backend futuro). Devuelve un resultado
 * estructurado SIN validar: `analyzeThreat` lo valida con Zod y lo contrasta con las reglas.
 */
export interface ImageProviderInput {
  /** Tipo de imagen (PNG, JPEG o WEBP). */
  mimeType: string
  /** Contenido en base64, sin el prefijo «data:». */
  data: string
  /** Idioma en que la IA debe escribir su respuesta (por defecto español). */
  language?: Language
}

export interface ThreatProvider {
  readonly name: string
  refine: (input: ProviderInput) => Promise<unknown>
  /** Analiza una captura. Opcional: no todos los proveedores ven imágenes. */
  refineImage?: (input: ImageProviderInput) => Promise<unknown>
}

export interface AnalyzeDeps {
  thresholds: Thresholds
  /** `null` = sin IA (solo reglas locales). */
  provider: ThreatProvider | null
  /** Aviso a mostrar cuando el caso era ambiguo pero no hay proveedor (p. ej. falta la clave). */
  noProviderNotice?: string
  /** Idioma de la interfaz: la IA escribe su respuesta en él. */
  language?: Language
}

export interface AnalyzeOutput {
  result: ThreatResult
  usedAI: boolean
  /** Nombre del proveedor que dio la segunda opinión (solo si `usedAI`). */
  provider?: string
  /** Aviso amable cuando se cayó al plan B. */
  notice?: string
}

/**
 * Punto único de análisis. Cambiar de proveedor o pasar a un backend no toca la interfaz.
 *  1. Reglas locales (siempre, sobre el texto original, que no sale del equipo).
 *  2. Fuera de la zona ambigua se responde sin IA (ahorra cuota y privacidad).
 *  3. En la zona ambigua se envía al proveedor el texto ENMASCARADO; su salida se valida con Zod.
 *  4. La IA nunca baja un «peligroso» de las reglas locales.
 *  5. Si la IA falla o responde algo inválido, se usa el resultado de las reglas con un aviso.
 */
export async function analyzeThreat(
  input: Omit<ProviderInput, 'local'>,
  deps: AnalyzeDeps
): Promise<AnalyzeOutput> {
  const local = analyzeLocal(input.text, deps.thresholds)
  const localResult = toThreatResult(local)
  if (!local.needsAI) return { result: localResult, usedAI: false }
  if (!deps.provider) {
    return { result: localResult, usedAI: false, notice: deps.noProviderNotice }
  }

  try {
    const raw = await deps.provider.refine({
      ...input,
      text: maskSensitive(input.text).text,
      local,
      language: deps.language
    })
    const parsed = threatResultSchema.safeParse(raw)
    if (!parsed.success) {
      console.warn(
        `[analysis] ${deps.provider.name} devolvió una salida inválida`,
        parsed.error.issues[0]
      )
      return {
        result: localResult,
        usedAI: false,
        notice: 'La IA respondió algo raro, así que usé solo las reglas locales.'
      }
    }
    const ai = parsed.data
    return {
      usedAI: true,
      provider: deps.provider.name,
      result: {
        ...ai,
        verdict: guardVerdict(local.verdict, ai.verdict),
        score: guardScore(local, ai.score),
        // Las posiciones de resaltado las calculan siempre las reglas locales.
        signals:
          ai.signals.length > 0 ? mergeSpans(ai.signals, localResult.signals) : localResult.signals
      }
    }
  } catch (error) {
    // Se registra solo el mensaje técnico; nunca la petición, que lleva la clave.
    console.warn(
      `[analysis] ${deps.provider.name} falló:`,
      error instanceof Error ? error.message : error
    )
    return { result: localResult, usedAI: false, notice: userMessageOf(error) }
  }
}

/** Las señales de la IA no traen posiciones: se reutilizan las de las reglas si coincide el tipo. */
export function mergeSpans(
  ai: ThreatResult['signals'],
  local: ThreatResult['signals']
): ThreatResult['signals'] {
  return ai.map((signal) => {
    const match = local.find((l) => l.kind === signal.kind && l.spans && l.spans.length > 0)
    return match && !signal.spans ? { ...signal, spans: match.spans } : signal
  })
}

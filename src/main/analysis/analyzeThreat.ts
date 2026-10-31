import { analyzeLocal, type LocalAnalysis, type Thresholds } from '../../domain/rules'
import { guardScore, guardVerdict, toThreatResult } from '../../domain/explain'
import { threatResultSchema, type ThreatResult } from '../../shared/threat'

/** Lo que recibe un proveedor de IA para casos ambiguos. */
export interface ProviderInput {
  text: string
  source: 'text' | 'link' | 'image'
  local: LocalAnalysis
}

/**
 * Proveedor de IA intercambiable (Gemini, demo, un backend futuro). Devuelve un resultado
 * estructurado SIN validar: `analyzeThreat` lo valida con Zod y lo contrasta con las reglas.
 */
export interface ThreatProvider {
  readonly name: string
  refine: (input: ProviderInput) => Promise<unknown>
}

export interface AnalyzeDeps {
  thresholds: Thresholds
  /** `null` = sin IA (solo reglas locales). */
  provider: ThreatProvider | null
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
 *  1. Reglas locales (siempre). Fuera de la zona ambigua se responde sin IA.
 *  2. En la zona ambigua se consulta al proveedor; su salida se valida con Zod.
 *  3. La IA nunca baja un «peligroso» de las reglas locales.
 *  4. Si la IA falla o responde algo inválido, se usa el resultado de las reglas.
 */
export async function analyzeThreat(
  input: Omit<ProviderInput, 'local'>,
  deps: AnalyzeDeps
): Promise<AnalyzeOutput> {
  const local = analyzeLocal(input.text, deps.thresholds)
  const localResult = toThreatResult(local)
  if (!local.needsAI) return { result: localResult, usedAI: false }
  if (!deps.provider) return { result: localResult, usedAI: false }

  try {
    const raw = await deps.provider.refine({ ...input, local })
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
    const verdict = guardVerdict(local.verdict, ai.verdict)
    return {
      usedAI: true,
      provider: deps.provider.name,
      result: {
        ...ai,
        verdict,
        score: guardScore(local, ai.score),
        // Las posiciones de resaltado las calculan siempre las reglas locales.
        signals: ai.signals.length > 0 ? ai.signals : localResult.signals
      }
    }
  } catch (error) {
    console.warn(`[analysis] ${deps.provider.name} falló`, error)
    return {
      result: localResult,
      usedAI: false,
      notice: 'No pude consultar a la IA. Usé las reglas locales.'
    }
  }
}

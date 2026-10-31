import { analyzeLocal } from '../../domain/rules'
import { threatResultSchema } from '../../shared/threat'
import type { AiTestResult } from '../../shared/analysis'
import { createGeminiProvider } from './geminiProvider'
import { userMessageOf } from './providerError'

/** Mensaje inofensivo y fijo: probar la conexión nunca envía contenido del usuario. */
const SAMPLE = 'Hola, ¿cómo vas? Te confirmo la reunión de mañana a las 3 p. m.'

/**
 * Prueba de punta a punta: clave, red, modelo y formato de la respuesta (validada con Zod).
 * El mensaje que devuelve es seguro de mostrar: no incluye la clave ni datos técnicos.
 */
export async function testGemini(apiKey: string, model: string | undefined): Promise<AiTestResult> {
  const provider = createGeminiProvider({ apiKey, model })
  try {
    const raw = await provider.refine({ text: SAMPLE, source: 'text', local: analyzeLocal(SAMPLE) })
    const parsed = threatResultSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        message: 'La clave funciona, pero la IA respondió en un formato inesperado.'
      }
    }
    return { ok: true, message: 'Conexión con Gemini correcta. La IA está lista.' }
  } catch (error) {
    return { ok: false, message: userMessageOf(error) }
  }
}

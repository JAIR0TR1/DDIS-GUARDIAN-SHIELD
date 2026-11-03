import type { ThreatProvider, ProviderInput } from './analyzeThreat'

/** Texto que «lee» el modo demo en cualquier captura: un ejemplo claro de estafa. */
export const DEMO_IMAGE_TEXT = 'Ganaste un premio. Confirma tu clave en bit.ly/premio-nequi'
export const DEMO_IMAGE_TEXT_SAFE =
  'Hola, te recuerdo que mañana tenemos reunión del grupo a las 3 p. m. en la biblioteca.'

/**
 * Proveedor de demostración: no usa red ni clave. Responde de forma determinista a los
 * casos ambiguos para que la sustentación funcione sin internet.
 */
export const demoProvider: ThreatProvider = {
  name: 'demo',
  async refine({ local }: ProviderInput) {
    const top = local.hits[0]
    return {
      verdict: 'sospechoso',
      score: local.score,
      signals: local.hits.slice(0, 6).map((h) => ({
        id: h.id,
        kind: h.kind,
        label: h.label,
        severity: h.severity,
        spans: h.spans.slice(0, 8)
      })),
      recommendedAction:
        'No des datos ni hagas clic hasta verificar por el canal oficial de la empresa o persona.',
      creatureMessage: top
        ? 'Hmm, algo no me cuadra. Verifica antes de responder.'
        : 'Se ve normal, pero verifica si te piden algo.'
    }
  },

  /**
   * En modo demo NO se lee la imagen (no hay IA): se devuelve un ejemplo fijo y la interfaz lo
   * avisa. Así el flujo de capturas se puede mostrar sin internet.
   */
  async refineImage() {
    // Una captura de ejemplo con DOS mensajes, para mostrar el análisis por separado.
    return {
      messages: [
        {
          verdict: 'peligroso',
          score: 90,
          signals: [],
          recommendedAction:
            'Bórralo y no respondas. Si dudas, llama al número oficial de tu banco.',
          creatureMessage: 'No hagas clic. Te pide tu clave y ese link no es oficial.',
          extractedText: DEMO_IMAGE_TEXT
        },
        {
          verdict: 'seguro',
          score: 5,
          signals: [],
          recommendedAction:
            'No hace falta hacer nada. Igual, desconfía si alguien te pide claves.',
          creatureMessage: 'Todo en orden. Este mensaje se ve limpio.',
          extractedText: DEMO_IMAGE_TEXT_SAFE
        }
      ]
    }
  }
}

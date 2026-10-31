import type { ProviderInput, ThreatProvider } from './analyzeThreat'

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
  }
}

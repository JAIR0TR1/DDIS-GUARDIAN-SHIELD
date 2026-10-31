import type { SignalKind, ThreatResult, Verdict } from '../shared/threat'
import type { LocalAnalysis } from './rules'

/** Voz de Nilo y consejo concreto según la señal más fuerte. Dominio puro. */
const BY_KIND: Partial<Record<SignalKind, { message: string; action: string }>> = {
  'pide-clave': {
    message: 'No hagas clic. Te pide tu clave o un código y eso nunca es normal.',
    action:
      'No compartas claves ni códigos con nadie. Si dudas, llama al número oficial que está en tu tarjeta.'
  },
  'suplanta-marca': {
    message: 'Ese mensaje se hace pasar por una marca, pero el link no es oficial.',
    action: 'No abras el link. Entra escribiendo tú mismo la dirección oficial o usa la app.'
  },
  premio: {
    message: 'Nadie regala premios por mensaje. Es un gancho.',
    action: 'Bórralo. Un premio de verdad no te pide datos ni pagos.'
  },
  paquete: {
    message: 'Ese «paquete retenido» huele a engaño.',
    action: 'Revisa tu envío solo en la página o app oficial de la transportadora.'
  },
  comprobante: {
    message: 'Ojo con ese comprobante: puede traer un virus o un cobro falso.',
    action: 'No abras archivos ni links. Verifica el pago directamente en la app de tu banco.'
  },
  empleo: {
    message: 'Un empleo de verdad no te cobra para empezar.',
    action: 'No pagues inscripciones. Verifica la empresa por sus canales oficiales.'
  },
  soporte: {
    message: 'Ningún soporte te escribe primero pidiendo entrar a tu equipo.',
    action: 'No instales programas ni des acceso remoto. Cuelga y contacta tú a la empresa.'
  },
  'cambio-numero': {
    message: 'Antes de enviar plata, confirma que de verdad es tu familiar.',
    action: 'Llámalo a su número de siempre o pregúntale algo que solo él sabría.'
  },
  dinero: {
    message: 'Si te piden pagar antes de recibir, es estafa.',
    action: 'No deposites nada por adelantado. Verifica la entidad en la Superfinanciera.'
  }
}

const FALLBACK = {
  message: 'No hagas clic. Esto huele a estafa.',
  action: 'Bórralo y no respondas. Si dudas, verifica por el canal oficial.'
}

export interface Explanation {
  creatureMessage: string
  recommendedAction: string
}

export function explain(verdict: Verdict, local: LocalAnalysis): Explanation {
  if (verdict === 'seguro') {
    return {
      creatureMessage: 'Todo en orden. Este mensaje se ve limpio.',
      recommendedAction: 'No hace falta hacer nada. Igual, desconfía si alguien te pide claves.'
    }
  }
  const top = local.hits.find((h) => BY_KIND[h.kind]) ?? local.hits[0]
  const base = (top && BY_KIND[top.kind]) ?? FALLBACK
  if (verdict === 'peligroso') {
    return { creatureMessage: base.message, recommendedAction: base.action }
  }
  return {
    creatureMessage: 'Hmm, algo no me cuadra. Verifica antes de responder.',
    recommendedAction: `${base.action} Mientras tanto, no des datos ni hagas clic.`
  }
}

/** Convierte el análisis local en el resultado estructurado que ve la interfaz. */
export function toThreatResult(local: LocalAnalysis): ThreatResult {
  const { creatureMessage, recommendedAction } = explain(local.verdict, local)
  return {
    verdict: local.verdict,
    score: local.score,
    signals: local.hits.slice(0, 8).map((h) => ({
      id: h.id,
      kind: h.kind,
      label: h.label,
      severity: h.severity,
      spans: h.spans.slice(0, 8).map(([a, b]) => [a, b] as [number, number])
    })),
    recommendedAction,
    creatureMessage
  }
}

/**
 * Regla de seguridad: la IA nunca puede bajar un veredicto que las reglas locales ya
 * marcaron como peligroso. Solo puede confirmarlo o subirlo.
 */
export function guardVerdict(local: Verdict, ai: Verdict): Verdict {
  return local === 'peligroso' ? 'peligroso' : ai
}

/** El puntaje final tampoco puede quedar por debajo del local cuando el local ya era peligroso. */
export function guardScore(local: LocalAnalysis, aiScore: number): number {
  return local.verdict === 'peligroso' ? Math.max(local.score, aiScore) : aiScore
}

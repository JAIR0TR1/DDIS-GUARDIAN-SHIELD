import type { Severity, SignalKind, ThreatResult, Verdict } from '../shared/threat'

/**
 * Gestos de Nilo según el CONTEXTO de lo analizado. Dominio puro: aquí se decide QUÉ gesto toca;
 * cómo se mueve el modelo 3D lo resuelve la interfaz.
 *
 *  - celebrar: todo está bien (brazos arriba y saltito).
 *  - pensar:   algo dudoso (mano en la barbilla y cabeza ladeada).
 *  - alto:     peligro con presión o urgencia (mano al frente: «¡alto!»).
 *  - proteger: te piden claves o suplantan una marca (brazos cruzados: «no des tus datos»).
 *  - negar:    cebos de dinero o regalos (mueve la cabeza: «no te lo creas»).
 *  - llamar:   alguien dice ser un familiar con otro número (mano al oído: «llámalo»).
 *  - leer:     está leyendo lo que acabas de pegar (se inclina y mira de lado a lado).
 */
export const GESTURES = [
  'ninguno',
  'celebrar',
  'pensar',
  'alto',
  'proteger',
  'negar',
  'llamar',
  'leer'
] as const
export type Gesture = (typeof GESTURES)[number]

const SEVERITY_RANK: Record<Severity, number> = { baja: 0, media: 1, alta: 2 }

/** Qué gesto corresponde a cada tipo de señal cuando el veredicto es peligroso. */
const GESTURE_BY_KIND: Record<SignalKind, Gesture> = {
  'pide-clave': 'proteger',
  'suplanta-marca': 'proteger',
  soporte: 'proteger',
  'dominio-sospechoso': 'proteger',
  'link-acortado': 'proteger',
  premio: 'negar',
  paquete: 'negar',
  empleo: 'negar',
  dinero: 'negar',
  comprobante: 'negar',
  'cambio-numero': 'llamar',
  urgencia: 'alto',
  otro: 'alto'
}

/** La señal más grave (a igual gravedad, la primera: las reglas ya las ordenan por peso). */
function dominantKind(signals: ThreatResult['signals']): SignalKind | null {
  let best: ThreatResult['signals'][number] | null = null
  for (const signal of signals) {
    if (best === null || SEVERITY_RANK[signal.severity] > SEVERITY_RANK[best.severity])
      best = signal
  }
  return best?.kind ?? null
}

export function gestureFor(result: Pick<ThreatResult, 'verdict' | 'signals'>): Gesture {
  if (result.verdict === 'seguro') return 'celebrar'
  if (result.verdict === 'sospechoso') return 'pensar'
  const kind = dominantKind(result.signals)
  return kind === null ? 'alto' : GESTURE_BY_KIND[kind]
}

export type Mood = 'reposo' | 'escaneando' | 'alerta' | 'feliz'

export interface PreReaction {
  mood: Mood
  /** Lo que Nilo dice mientras lee, ANTES de que el usuario pida el análisis completo. */
  bubble: string
}

/**
 * Primer vistazo de Nilo a lo que se acaba de pegar (con las reglas locales, sin IA ni costo).
 * Es una reacción, no un veredicto: siempre invita a analizar para ver el resultado completo.
 */
export function preReaction(verdict: Verdict): PreReaction {
  switch (verdict) {
    case 'peligroso':
      return {
        mood: 'alerta',
        bubble: 'Uy… esto no me gusta nada. Dale a Analizar y te cuento por qué.'
      }
    case 'sospechoso':
      return {
        mood: 'escaneando',
        bubble: 'Mmm, tiene cosas raras. Analízalo para ver qué encontré.'
      }
    case 'seguro':
      return { mood: 'reposo', bubble: 'A primera vista se ve normal. Igual puedes analizarlo.' }
  }
}

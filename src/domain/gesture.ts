import type { SignalKind, ThreatResult, Verdict } from '../shared/threat'

/**
 * Contexto de Nilo: QUÉ gesto hace y QUÉ objeto muestra según lo analizado. Dominio puro: aquí
 * se decide; cómo se mueve y se dibuja lo resuelve la interfaz 3D.
 *
 * Una estafa tiene una «historia» (el gancho: un regalo, un paquete, un empleo, dinero fácil, un
 * falso familiar, un comprobante) y un «pedido» (qué te exigen: tu clave, acceso a tu equipo, o
 * se hacen pasar por una marca). La historia manda: es lo que distingue una estafa de otra;
 * casi todas suplantan una marca o piden una clave, y eso no las diferencia.
 */

/** Gestos del cuerpo. */
export const GESTURES = [
  'ninguno',
  'celebrar', // todo bien: brazos arriba y saltito
  'pensar', // dudoso: cabeza ladeada, mano en la barbilla
  'alto', // «¡alto!»: mano arriba y un paso atrás
  'proteger', // burbuja de escudo y brazos arriba: «cuida tus datos»
  'negar', // mueve el cuerpo de lado a lado: «no te lo creas»
  'llamar', // mano junto a la cabeza: «llámalo»
  'leer' // se inclina a leer lo que acabas de pegar
] as const
export type Gesture = (typeof GESTURES)[number]

/** Objeto que flota sobre la cabeza de Nilo y dice de qué trata el mensaje. */
export const PROPS = [
  'ninguno',
  'regalo', // premios y subsidios
  'paquete', // envíos retenidos
  'maletin', // ofertas de empleo
  'moneda', // dinero fácil, préstamos, inversiones
  'telefono', // «cambié de número»
  'llave', // te piden la clave o acceso a tu equipo
  'banco', // se hacen pasar por una marca o un banco
  'documento', // comprobantes falsos
  'check', // todo bien
  'interrogacion' // dudoso, sin un tema claro
] as const
export type Prop = (typeof PROPS)[number]

export interface Context {
  gesture: Gesture
  prop: Prop
  /**
   * Qué tan marcado es el gesto: 1 = peligro (gesto completo), menos = dudoso (gesto suave, para
   * que no se confunda un «puede ser» con un «es una estafa»).
   */
  intensity: number
}

/** Intensidad de los gestos cuando el mensaje es solo dudoso. */
export const DOUBTFUL_INTENSITY = 0.65

/** La historia de la estafa, en orden de prioridad. */
const STORY: readonly Entry[] = [
  { kind: 'cambio-numero', gesture: 'llamar', prop: 'telefono' },
  { kind: 'comprobante', gesture: 'alto', prop: 'documento' },
  { kind: 'paquete', gesture: 'alto', prop: 'paquete' },
  { kind: 'empleo', gesture: 'negar', prop: 'maletin' },
  { kind: 'dinero', gesture: 'proteger', prop: 'moneda' },
  { kind: 'premio', gesture: 'negar', prop: 'regalo' }
]

/** Lo que te piden, si no hay una historia más específica. */
const ASK: readonly Entry[] = [
  { kind: 'pide-clave', gesture: 'proteger', prop: 'llave' },
  { kind: 'soporte', gesture: 'proteger', prop: 'llave' },
  { kind: 'suplanta-marca', gesture: 'proteger', prop: 'banco' }
]

type Entry = { kind: SignalKind; gesture: Gesture; prop: Prop }

function firstPresent(table: readonly Entry[], kinds: ReadonlySet<SignalKind>): Entry | null {
  return table.find((entry) => kinds.has(entry.kind)) ?? null
}

/**
 * El gesto y el objeto que corresponden a un resultado.
 *  - seguro: celebrar con un check.
 *  - dudoso: el gesto de SU historia (un premio dudoso «niega», un paquete dudoso «frena»), pero
 *    suave; sin una historia clara, «pensar» con un signo de interrogación.
 *  - peligroso: el gesto de su historia, completo.
 */
export function contextFor(result: Pick<ThreatResult, 'verdict' | 'signals'>): Context {
  if (result.verdict === 'seguro') return { gesture: 'celebrar', prop: 'check', intensity: 1 }

  const kinds = new Set(result.signals.map((s) => s.kind))
  const match = firstPresent(STORY, kinds) ?? firstPresent(ASK, kinds)

  if (result.verdict === 'sospechoso') {
    return match
      ? { gesture: match.gesture, prop: match.prop, intensity: DOUBTFUL_INTENSITY }
      : { gesture: 'pensar', prop: 'interrogacion', intensity: DOUBTFUL_INTENSITY }
  }
  return match
    ? { gesture: match.gesture, prop: match.prop, intensity: 1 }
    : { gesture: 'alto', prop: 'ninguno', intensity: 1 }
}

export function gestureFor(result: Pick<ThreatResult, 'verdict' | 'signals'>): Gesture {
  return contextFor(result).gesture
}

export function propFor(result: Pick<ThreatResult, 'verdict' | 'signals'>): Prop {
  return contextFor(result).prop
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

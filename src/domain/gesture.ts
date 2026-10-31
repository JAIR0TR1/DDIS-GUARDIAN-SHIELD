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
}

/** La historia de la estafa, en orden de prioridad. */
const STORY: ReadonlyArray<{ kind: SignalKind } & Context> = [
  { kind: 'cambio-numero', gesture: 'llamar', prop: 'telefono' },
  { kind: 'comprobante', gesture: 'alto', prop: 'documento' },
  { kind: 'paquete', gesture: 'alto', prop: 'paquete' },
  { kind: 'empleo', gesture: 'negar', prop: 'maletin' },
  { kind: 'dinero', gesture: 'proteger', prop: 'moneda' },
  { kind: 'premio', gesture: 'negar', prop: 'regalo' }
]

/** Lo que te piden, si no hay una historia más específica. */
const ASK: ReadonlyArray<{ kind: SignalKind } & Context> = [
  { kind: 'pide-clave', gesture: 'proteger', prop: 'llave' },
  { kind: 'soporte', gesture: 'proteger', prop: 'llave' },
  { kind: 'suplanta-marca', gesture: 'proteger', prop: 'banco' }
]

function firstPresent(
  table: ReadonlyArray<{ kind: SignalKind } & Context>,
  kinds: ReadonlySet<SignalKind>
): Context | null {
  const found = table.find((entry) => kinds.has(entry.kind))
  return found ? { gesture: found.gesture, prop: found.prop } : null
}

/** El gesto y el objeto que corresponden a un resultado. */
export function contextFor(result: Pick<ThreatResult, 'verdict' | 'signals'>): Context {
  if (result.verdict === 'seguro') return { gesture: 'celebrar', prop: 'check' }

  const kinds = new Set(result.signals.map((s) => s.kind))
  const story = firstPresent(STORY, kinds)
  const ask = firstPresent(ASK, kinds)

  if (result.verdict === 'sospechoso') {
    // Dudoso: siempre «pensar», pero el objeto sigue diciendo de qué parece tratarse.
    return { gesture: 'pensar', prop: story?.prop ?? ask?.prop ?? 'interrogacion' }
  }
  return story ?? ask ?? { gesture: 'alto', prop: 'ninguno' }
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

/**
 * Arena del Guardián: minijuego para aprender a reconocer estafas. Dominio puro y determinista
 * (el azar se inyecta), así se puede probar sin interfaz.
 */

export interface ArenaSample {
  id: string
  text: string
  /** `true` si el mensaje es una estafa. */
  isScam: boolean
}

export const ROUNDS = 8
export const MAX_HEARTS = 3
export const XP_PER_HIT = 5
/** Bono por encadenar aciertos. */
export const STREAK_BONUS = 10
export const STREAK_FOR_BONUS = 4
/** Tope por partida: jugar enseña, pero no reemplaza analizar mensajes reales. */
export const MAX_GAME_XP = XP_PER_HIT * ROUNDS + STREAK_BONUS

export interface ArenaState {
  rounds: readonly ArenaSample[]
  /** Índice de la ronda actual. */
  index: number
  hearts: number
  hits: number
  streak: number
  bestStreak: number
  finished: boolean
}

/** Baraja (Fisher-Yates) con un generador inyectable: devuelve enteros en [0, max). */
function shuffle<T>(items: readonly T[], random: (max: number) => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = random(i + 1)
    const tmp = out[i]
    out[i] = out[j] as T
    out[j] = tmp as T
  }
  return out
}

/** Elige las rondas: mitad estafas y mitad mensajes seguros, en orden aleatorio. */
export function buildRounds(
  samples: readonly ArenaSample[],
  random: (max: number) => number = (max) => Math.floor(Math.random() * max)
): ArenaSample[] {
  const scams = shuffle(
    samples.filter((s) => s.isScam),
    random
  )
  const safe = shuffle(
    samples.filter((s) => !s.isScam),
    random
  )
  const half = Math.floor(ROUNDS / 2)
  return shuffle([...scams.slice(0, ROUNDS - half), ...safe.slice(0, half)], random)
}

export function startGame(rounds: readonly ArenaSample[]): ArenaState {
  return {
    rounds,
    index: 0,
    hearts: MAX_HEARTS,
    hits: 0,
    streak: 0,
    bestStreak: 0,
    finished: rounds.length === 0
  }
}

export interface AnswerResult {
  state: ArenaState
  correct: boolean
}

/** Registra la respuesta de la ronda actual (sin avanzar: eso lo hace `nextRound`). */
export function answer(state: ArenaState, saysScam: boolean): AnswerResult {
  const current = state.rounds[state.index]
  if (state.finished || !current) return { state, correct: false }
  const correct = current.isScam === saysScam
  const streak = correct ? state.streak + 1 : 0
  const hearts = correct ? state.hearts : state.hearts - 1
  return {
    correct,
    state: {
      ...state,
      hits: state.hits + (correct ? 1 : 0),
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      hearts,
      finished: hearts <= 0
    }
  }
}

/** Pasa a la siguiente ronda; la partida termina al acabar las rondas o los corazones. */
export function nextRound(state: ArenaState): ArenaState {
  if (state.finished) return state
  const index = state.index + 1
  return { ...state, index, finished: index >= state.rounds.length }
}

/** Experiencia que gana Nilo con la partida (con tope). */
export function gameXp(state: Pick<ArenaState, 'hits' | 'bestStreak'>): number {
  const bonus = state.bestStreak >= STREAK_FOR_BONUS ? STREAK_BONUS : 0
  return Math.min(MAX_GAME_XP, state.hits * XP_PER_HIT + bonus)
}

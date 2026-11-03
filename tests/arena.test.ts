import { describe, expect, it } from 'vitest'
import {
  answer,
  buildRounds,
  gameXp,
  MAX_GAME_XP,
  MAX_HEARTS,
  nextRound,
  ROUNDS,
  startGame,
  type ArenaSample
} from '../src/domain/arena'
import { villainFor, VILLAINS } from '../src/domain/villains'
import { analyzeLocal } from '../src/domain/rules'
import { toThreatResult } from '../src/domain/explain'
import corpusData from '../data/corpus.json'

interface CorpusItem {
  id: string
  label: string
  text: string
}
const samples: ArenaSample[] = (corpusData as CorpusItem[]).map((c) => ({
  id: c.id,
  text: c.text,
  isScam: c.label === 'estafa'
}))

describe('buildRounds', () => {
  it('arma 8 rondas, mitad estafas y mitad seguros, sin repetir', () => {
    const rounds = buildRounds(samples)
    expect(rounds).toHaveLength(ROUNDS)
    expect(rounds.filter((r) => r.isScam)).toHaveLength(ROUNDS / 2)
    expect(new Set(rounds.map((r) => r.id)).size).toBe(ROUNDS)
  })

  it('cambia el orden según el azar', () => {
    const a = buildRounds(samples, () => 0).map((r) => r.id)
    const b = buildRounds(samples, (max) => max - 1).map((r) => r.id)
    expect(a).not.toEqual(b)
  })
})

describe('una partida', () => {
  const rounds = buildRounds(samples, () => 0)

  it('acertar suma aciertos y racha; fallar quita un corazón y corta la racha', () => {
    let state = startGame(rounds)
    const first = rounds[0]
    let r = answer(state, first.isScam)
    expect(r.correct).toBe(true)
    expect(r.state.hits).toBe(1)
    expect(r.state.streak).toBe(1)
    state = nextRound(r.state)
    r = answer(state, !rounds[1].isScam)
    expect(r.correct).toBe(false)
    expect(r.state.hearts).toBe(MAX_HEARTS - 1)
    expect(r.state.streak).toBe(0)
    expect(r.state.bestStreak).toBe(1)
  })

  it('termina al perder los tres corazones', () => {
    let state = startGame(rounds)
    for (let i = 0; i < MAX_HEARTS; i++) {
      state = answer(state, !rounds[state.index].isScam).state
      state = nextRound(state)
    }
    expect(state.finished).toBe(true)
  })

  it('termina al jugar todas las rondas', () => {
    let state = startGame(rounds)
    for (const round of rounds) state = nextRound(answer(state, round.isScam).state)
    expect(state.finished).toBe(true)
    expect(state.hits).toBe(ROUNDS)
  })
})

describe('gameXp', () => {
  it('5 por acierto, bono por racha de 4 y tope por partida', () => {
    expect(gameXp({ hits: 3, bestStreak: 2 })).toBe(15)
    expect(gameXp({ hits: 4, bestStreak: 4 })).toBe(30)
    expect(gameXp({ hits: 99, bestStreak: 99 })).toBe(MAX_GAME_XP)
  })
})

describe('villanos', () => {
  const resultOf = (id: string): ReturnType<typeof toThreatResult> => {
    const sample = samples.find((s) => s.id === id)
    if (!sample) throw new Error(id)
    return toThreatResult(analyzeLocal(sample.text))
  }

  it('cada estafa del corpus tiene su villano', () => {
    expect(villainFor(resultOf('e02'))).toBe('premio')
    expect(villainFor(resultOf('e03'))).toBe('paquete')
    expect(villainFor(resultOf('e04'))).toBe('familiar')
    expect(villainFor(resultOf('e06'))).toBe('empleo')
  })

  it('las estafas del corpus muestran al menos 5 villanos distintos', () => {
    const villains = samples.filter((s) => s.isScam).map((s) => villainFor(resultOf(s.id)))
    expect(new Set(villains).size).toBeGreaterThanOrEqual(5)
  })

  it('sin señales es «El Impostor»; el catálogo no se repite', () => {
    expect(villainFor({ signals: [] })).toBe('impostor')
    expect(new Set(VILLAINS).size).toBe(VILLAINS.length)
  })
})

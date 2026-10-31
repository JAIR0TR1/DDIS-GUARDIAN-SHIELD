/** Sistema de XP y niveles. Dominio puro: sin React ni Electron. */

/** XP necesaria para pasar del nivel `level` al siguiente (nivel 3 → 400, como en el mockup B). */
export function xpToNext(level: number): number {
  return 100 * (level + 1)
}

export interface Progress {
  level: number
  /** XP acumulada dentro del nivel actual. */
  xp: number
}

export interface XpGain {
  progress: Progress
  gained: number
  levelsGained: number
}

/** Cantidad de XP por veredicto: detectar una amenaza vale más que confirmar un mensaje limpio. */
export const XP_BY_VERDICT = { seguro: 10, sospechoso: 20, peligroso: 30 } as const

export function addXp(current: Progress, amount: number): XpGain {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`La XP a sumar debe ser un número no negativo, recibí ${amount}`)
  }
  let { level, xp } = current
  xp += amount
  let levelsGained = 0
  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level)
    level += 1
    levelsGained += 1
  }
  return { progress: { level, xp }, gained: amount, levelsGained }
}

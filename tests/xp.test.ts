import { describe, expect, it } from 'vitest'
import { addXp, xpToNext, XP_BY_VERDICT } from '../src/domain/xp'

describe('xpToNext', () => {
  it('coincide con el mockup: nivel 3 necesita 400', () => {
    expect(xpToNext(3)).toBe(400)
  })
  it('crece con el nivel', () => {
    expect(xpToNext(1)).toBe(200)
    expect(xpToNext(2)).toBe(300)
  })
})

describe('addXp', () => {
  it('suma sin subir de nivel', () => {
    const r = addXp({ level: 1, xp: 0 }, XP_BY_VERDICT.peligroso)
    expect(r.progress).toEqual({ level: 1, xp: 30 })
    expect(r.levelsGained).toBe(0)
  })

  it('sube de nivel y conserva el sobrante', () => {
    const r = addXp({ level: 1, xp: 190 }, 30)
    expect(r.progress).toEqual({ level: 2, xp: 20 })
    expect(r.levelsGained).toBe(1)
  })

  it('puede subir varios niveles de una vez', () => {
    const r = addXp({ level: 1, xp: 0 }, 200 + 300 + 5)
    expect(r.progress).toEqual({ level: 3, xp: 5 })
    expect(r.levelsGained).toBe(2)
  })

  it('rechaza cantidades inválidas', () => {
    expect(() => addXp({ level: 1, xp: 0 }, -1)).toThrow(RangeError)
    expect(() => addXp({ level: 1, xp: 0 }, Number.NaN)).toThrow(RangeError)
  })
})

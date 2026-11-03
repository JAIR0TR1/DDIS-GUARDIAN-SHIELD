import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SKIN,
  isSkinUnlocked,
  nextSkin,
  SKIN_CATALOG,
  SKINS,
  usableSkin
} from '../src/domain/skins'
import { creatureSchema } from '../src/shared/models'
import template from '../data/creature.json'

describe('apariencias de Nilo', () => {
  it('se desbloquean por nivel, una por nivel del 1 al 5', () => {
    expect(SKINS.map((id) => SKIN_CATALOG[id].unlockLevel)).toEqual([1, 2, 3, 4, 5])
    expect(isSkinUnlocked('fuego', 3)).toBe(false)
    expect(isSkinUnlocked('fuego', 4)).toBe(true)
  })

  it('una apariencia bloqueada se usa como la clásica', () => {
    expect(usableSkin('aurora', 2)).toBe(DEFAULT_SKIN)
    expect(usableSkin('medianoche', 2)).toBe('medianoche')
    expect(usableSkin(undefined, 9)).toBe(DEFAULT_SKIN)
  })

  it('indica la siguiente por desbloquear', () => {
    expect(nextSkin(1)?.id).toBe('medianoche')
    expect(nextSkin(5)).toBeNull()
  })

  it('los datos guardados antes de las apariencias siguen siendo válidos (clásica por defecto)', () => {
    expect(creatureSchema.parse(template).skin).toBe(DEFAULT_SKIN)
  })

  it('todas las paletas son colores hexadecimales', () => {
    for (const id of SKINS) {
      for (const color of Object.values(SKIN_CATALOG[id].palette)) {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      }
    }
  })
})

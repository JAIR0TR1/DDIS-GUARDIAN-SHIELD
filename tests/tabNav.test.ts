import { describe, expect, it } from 'vitest'
import { nextTabIndex } from '../src/domain/tabNav'

describe('nextTabIndex', () => {
  it('avanza y retrocede con las flechas', () => {
    expect(nextTabIndex('ArrowRight', 0, 3)).toBe(1)
    expect(nextTabIndex('ArrowLeft', 2, 3)).toBe(1)
  })

  it('da la vuelta en los extremos', () => {
    expect(nextTabIndex('ArrowRight', 2, 3)).toBe(0)
    expect(nextTabIndex('ArrowLeft', 0, 3)).toBe(2)
  })

  it('Inicio y Fin saltan al primero y al último', () => {
    expect(nextTabIndex('Home', 2, 4)).toBe(0)
    expect(nextTabIndex('End', 0, 4)).toBe(3)
  })

  it('con dos pestañas alterna entre ambas (como en una captura con dos mensajes)', () => {
    expect(nextTabIndex('ArrowRight', 0, 2)).toBe(1)
    expect(nextTabIndex('ArrowRight', 1, 2)).toBe(0)
  })

  it('ignora otras teclas y listas vacías', () => {
    expect(nextTabIndex('Enter', 0, 3)).toBeNull()
    expect(nextTabIndex('a', 1, 3)).toBeNull()
    expect(nextTabIndex('ArrowRight', 0, 0)).toBeNull()
  })
})

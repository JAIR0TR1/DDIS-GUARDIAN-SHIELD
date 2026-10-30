import { describe, expect, it } from 'vitest'
import { excerpt, neutralizeLinks } from '../src/shared/safeText'

describe('neutralizeLinks', () => {
  it('neutraliza el punto del dominio y el esquema', () => {
    expect(neutralizeLinks('Confirma en https://bit.ly/3xYz ya')).toBe(
      'Confirma en hxxps://bit[.]ly/3xYz ya'
    )
  })

  it('neutraliza dominios sin esquema', () => {
    expect(neutralizeLinks('entra a nequi-premios.com/ganador')).toBe(
      'entra a nequi-premios[.]com/ganador'
    )
  })

  it('no toca números ni texto normal', () => {
    expect(neutralizeLinks('Pagaste 3.500 pesos, nada raro')).toBe('Pagaste 3.500 pesos, nada raro')
  })

  it('conserva el resto del mensaje', () => {
    const out = neutralizeLinks('Hola, mira www.ejemplo.com.co/ruta?x=1 gracias')
    expect(out).toContain('www[.]ejemplo[.]com[.]co/ruta?x=1')
    expect(out.startsWith('Hola, mira ')).toBe(true)
  })

  it('no se bloquea con texto hostil muy largo', () => {
    const hostile = 'a.'.repeat(5000) + '!'
    const start = performance.now()
    neutralizeLinks(hostile)
    expect(performance.now() - start).toBeLessThan(500)
  })
})

describe('excerpt', () => {
  it('recorta y colapsa espacios', () => {
    expect(excerpt('  hola   mundo  ', 50)).toBe('hola mundo')
    expect(excerpt('x'.repeat(200), 20)).toHaveLength(20)
  })
})

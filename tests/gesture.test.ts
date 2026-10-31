import { describe, expect, it } from 'vitest'
import { gestureFor, preReaction, GESTURES } from '../src/domain/gesture'
import { analyzeLocal } from '../src/domain/rules'
import { toThreatResult } from '../src/domain/explain'
import corpusData from '../data/corpus.json'
import type { Signal, SignalKind } from '../src/shared/threat'

const signal = (kind: SignalKind, severity: Signal['severity'] = 'alta'): Signal => ({
  id: kind,
  kind,
  label: kind,
  severity
})

describe('gestureFor: el gesto depende del contexto', () => {
  it('seguro → celebrar', () => {
    expect(gestureFor({ verdict: 'seguro', signals: [] })).toBe('celebrar')
  })

  it('sospechoso → pensar, sin importar las señales', () => {
    expect(gestureFor({ verdict: 'sospechoso', signals: [signal('premio')] })).toBe('pensar')
  })

  it.each<[SignalKind, string]>([
    ['pide-clave', 'proteger'],
    ['suplanta-marca', 'proteger'],
    ['soporte', 'proteger'],
    ['premio', 'negar'],
    ['paquete', 'negar'],
    ['empleo', 'negar'],
    ['dinero', 'negar'],
    ['comprobante', 'negar'],
    ['cambio-numero', 'llamar'],
    ['urgencia', 'alto']
  ])('peligroso con %s → %s', (kind, expected) => {
    expect(gestureFor({ verdict: 'peligroso', signals: [signal(kind)] })).toBe(expected)
  })

  it('peligroso sin señales → alto', () => {
    expect(gestureFor({ verdict: 'peligroso', signals: [] })).toBe('alto')
  })

  it('manda la señal más grave, no la primera', () => {
    const signals = [
      signal('urgencia', 'baja'),
      signal('pide-clave', 'alta'),
      signal('premio', 'media')
    ]
    expect(gestureFor({ verdict: 'peligroso', signals })).toBe('proteger')
  })

  it('a igual gravedad manda la primera (las reglas ya ordenan por peso)', () => {
    const signals = [signal('premio', 'alta'), signal('pide-clave', 'alta')]
    expect(gestureFor({ verdict: 'peligroso', signals })).toBe('negar')
  })

  it('todos los gestos posibles están definidos', () => {
    expect(GESTURES).toContain('leer')
    expect(new Set(GESTURES).size).toBe(GESTURES.length)
  })
})

describe('gestos sobre el corpus real de mensajes', () => {
  interface Sample {
    id: string
    text: string
  }
  const gestureOf = (id: string): string => {
    const sample = (corpusData as Sample[]).find((s) => s.id === id)
    if (!sample) throw new Error(`No existe ${id}`)
    return gestureFor(toThreatResult(analyzeLocal(sample.text)))
  }

  it('el banco que pide la clave → proteger', () => {
    expect(gestureOf('e01')).toBe('proteger')
  })
  it('el premio con link acortado y clave → proteger (lo más grave es pedir la clave)', () => {
    expect(gestureOf('e02')).toBe('proteger')
  })
  it('«cambié de número» y pide plata → llamar', () => {
    expect(gestureOf('e04')).toBe('llamar')
  })
  it('un mensaje legítimo → celebrar', () => {
    expect(gestureOf('l01')).toBe('celebrar')
    expect(gestureOf('l03')).toBe('celebrar')
  })
})

describe('preReaction (primer vistazo mientras se pega)', () => {
  it('cada veredicto tiene su ánimo y una frase que invita a analizar', () => {
    expect(preReaction('peligroso').mood).toBe('alerta')
    expect(preReaction('sospechoso').mood).toBe('escaneando')
    expect(preReaction('seguro').mood).toBe('reposo')
    for (const v of ['peligroso', 'sospechoso', 'seguro'] as const) {
      expect(preReaction(v).bubble).toMatch(/anal[ií]z/i)
    }
  })
})

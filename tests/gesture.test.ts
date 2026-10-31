import { describe, expect, it } from 'vitest'
import {
  contextFor,
  gestureFor,
  GESTURES,
  preReaction,
  PROPS,
  propFor
} from '../src/domain/gesture'
import { analyzeLocal } from '../src/domain/rules'
import { toThreatResult } from '../src/domain/explain'
import corpusData from '../data/corpus.json'
import type { Signal, SignalKind, Verdict } from '../src/shared/threat'

const signal = (kind: SignalKind, severity: Signal['severity'] = 'alta'): Signal => ({
  id: kind,
  kind,
  label: kind,
  severity
})
const result = (verdict: Verdict, ...kinds: SignalKind[]): Parameters<typeof contextFor>[0] => ({
  verdict,
  signals: kinds.map((k) => signal(k))
})

describe('contextFor: el gesto y el objeto dependen de la HISTORIA de la estafa', () => {
  it('seguro → celebrar con un check', () => {
    expect(contextFor(result('seguro'))).toEqual({ gesture: 'celebrar', prop: 'check' })
  })

  it('sospechoso → siempre pensar, pero el objeto dice de qué parece tratarse', () => {
    expect(contextFor(result('sospechoso'))).toEqual({ gesture: 'pensar', prop: 'interrogacion' })
    expect(contextFor(result('sospechoso', 'dinero'))).toEqual({
      gesture: 'pensar',
      prop: 'moneda'
    })
    expect(contextFor(result('sospechoso', 'pide-clave'))).toEqual({
      gesture: 'pensar',
      prop: 'llave'
    })
  })

  it.each<[SignalKind, string, string]>([
    ['cambio-numero', 'llamar', 'telefono'],
    ['comprobante', 'alto', 'documento'],
    ['paquete', 'alto', 'paquete'],
    ['empleo', 'negar', 'maletin'],
    ['dinero', 'proteger', 'moneda'],
    ['premio', 'negar', 'regalo']
  ])('historia %s → %s con %s', (kind, gesture, prop) => {
    expect(contextFor(result('peligroso', kind))).toEqual({ gesture, prop })
  })

  it.each<[SignalKind, string]>([
    ['pide-clave', 'llave'],
    ['soporte', 'llave'],
    ['suplanta-marca', 'banco']
  ])('sin historia, el pedido %s → proteger con %s', (kind, prop) => {
    expect(contextFor(result('peligroso', kind))).toEqual({ gesture: 'proteger', prop })
  })

  it('la HISTORIA manda sobre el pedido: un premio que pide la clave sigue siendo un premio', () => {
    expect(contextFor(result('peligroso', 'suplanta-marca', 'pide-clave', 'premio'))).toEqual({
      gesture: 'negar',
      prop: 'regalo'
    })
  })

  it('un paquete que suplanta una transportadora es un paquete', () => {
    expect(
      contextFor(result('peligroso', 'suplanta-marca', 'paquete', 'dominio-sospechoso'))
    ).toEqual({ gesture: 'alto', prop: 'paquete' })
  })

  it('entre dos historias gana la de mayor prioridad (el falso familiar antes que el premio)', () => {
    expect(contextFor(result('peligroso', 'premio', 'cambio-numero')).gesture).toBe('llamar')
  })

  it('peligroso solo con señales genéricas (urgencia, link) → alto, sin objeto', () => {
    expect(contextFor(result('peligroso', 'urgencia', 'link-acortado'))).toEqual({
      gesture: 'alto',
      prop: 'ninguno'
    })
    expect(contextFor(result('peligroso'))).toEqual({ gesture: 'alto', prop: 'ninguno' })
  })

  it('gestureFor y propFor son atajos de contextFor', () => {
    const r = result('peligroso', 'empleo')
    expect(gestureFor(r)).toBe('negar')
    expect(propFor(r)).toBe('maletin')
  })

  it('los catálogos no tienen repetidos', () => {
    expect(new Set(GESTURES).size).toBe(GESTURES.length)
    expect(new Set(PROPS).size).toBe(PROPS.length)
  })
})

describe('contexto sobre el corpus real: hay variedad y es el correcto', () => {
  interface Sample {
    id: string
    label: string
    text: string
  }
  const samples = corpusData as Sample[]
  const ctx = (id: string): { gesture: string; prop: string } => {
    const sample = samples.find((s) => s.id === id)
    if (!sample) throw new Error(`No existe ${id}`)
    return contextFor(toThreatResult(analyzeLocal(sample.text)))
  }

  it('el banco que pide la clave → proteger con el banco o la llave', () => {
    expect(ctx('e01').gesture).toBe('proteger')
  })
  it('el premio de Nequi → regalo, aunque pida la clave', () => {
    expect(ctx('e02')).toEqual({ gesture: 'negar', prop: 'regalo' })
  })
  it('el paquete de Servientrega → paquete', () => {
    expect(ctx('e03')).toEqual({ gesture: 'alto', prop: 'paquete' })
  })
  it('el falso familiar → teléfono', () => {
    expect(ctx('e04')).toEqual({ gesture: 'llamar', prop: 'telefono' })
  })
  it('el empleo que cobra → maletín', () => {
    expect(ctx('e06')).toEqual({ gesture: 'negar', prop: 'maletin' })
  })
  it('el préstamo con pago adelantado → moneda', () => {
    expect(ctx('e10')).toEqual({ gesture: 'proteger', prop: 'moneda' })
  })

  it('las 14 estafas peligrosas usan al menos 4 gestos y 5 objetos distintos', () => {
    const dangerous = samples
      .filter((s) => s.label === 'estafa')
      .map((s) => ({ s, r: toThreatResult(analyzeLocal(s.text)) }))
      .filter(({ r }) => r.verdict === 'peligroso')
      .map(({ r }) => contextFor(r))
    expect(new Set(dangerous.map((c) => c.gesture)).size).toBeGreaterThanOrEqual(4)
    expect(new Set(dangerous.map((c) => c.prop)).size).toBeGreaterThanOrEqual(5)
  })

  it('ningún gesto acapara más de la mitad de las estafas peligrosas', () => {
    const dangerous = samples
      .filter((s) => s.label === 'estafa')
      .map((s) => toThreatResult(analyzeLocal(s.text)))
      .filter((r) => r.verdict === 'peligroso')
      .map((r) => contextFor(r).gesture)
    const counts = new Map<string, number>()
    for (const g of dangerous) counts.set(g, (counts.get(g) ?? 0) + 1)
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(Math.ceil(dangerous.length / 2))
  })

  it('un mensaje legítimo → celebrar con check', () => {
    expect(ctx('l01')).toEqual({ gesture: 'celebrar', prop: 'check' })
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

import { describe, expect, it } from 'vitest'
import {
  contextFor,
  DOUBTFUL_INTENSITY,
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
    expect(contextFor(result('seguro'))).toEqual({
      gesture: 'celebrar',
      prop: 'check',
      intensity: 1
    })
  })

  it('sospechoso sin una historia clara → pensar con un signo de interrogación, suave', () => {
    expect(contextFor(result('sospechoso'))).toEqual({
      gesture: 'pensar',
      prop: 'interrogacion',
      intensity: DOUBTFUL_INTENSITY
    })
  })

  it('sospechoso CON historia → el gesto de su historia, pero suave', () => {
    expect(contextFor(result('sospechoso', 'premio'))).toEqual({
      gesture: 'negar',
      prop: 'regalo',
      intensity: DOUBTFUL_INTENSITY
    })
    expect(contextFor(result('sospechoso', 'paquete'))).toEqual({
      gesture: 'alto',
      prop: 'paquete',
      intensity: DOUBTFUL_INTENSITY
    })
    expect(contextFor(result('sospechoso', 'pide-clave')).gesture).toBe('proteger')
  })

  it('el gesto suave de lo dudoso es menos marcado que el de peligro', () => {
    const doubtful = contextFor(result('sospechoso', 'premio'))
    const danger = contextFor(result('peligroso', 'premio'))
    expect(doubtful.gesture).toBe(danger.gesture)
    expect(doubtful.prop).toBe(danger.prop)
    expect(doubtful.intensity).toBeLessThan(danger.intensity)
  })

  it.each<[SignalKind, string, string]>([
    ['cambio-numero', 'llamar', 'telefono'],
    ['comprobante', 'alto', 'documento'],
    ['paquete', 'alto', 'paquete'],
    ['empleo', 'negar', 'maletin'],
    ['dinero', 'proteger', 'moneda'],
    ['premio', 'negar', 'regalo']
  ])('peligroso con historia %s → %s con %s (gesto completo)', (kind, gesture, prop) => {
    expect(contextFor(result('peligroso', kind))).toEqual({ gesture, prop, intensity: 1 })
  })

  it.each<[SignalKind, string]>([
    ['pide-clave', 'llave'],
    ['soporte', 'llave'],
    ['suplanta-marca', 'banco']
  ])('sin historia, el pedido %s → proteger con %s', (kind, prop) => {
    expect(contextFor(result('peligroso', kind))).toEqual({
      gesture: 'proteger',
      prop,
      intensity: 1
    })
  })

  it('la HISTORIA manda sobre el pedido: un premio que pide la clave sigue siendo un premio', () => {
    expect(contextFor(result('peligroso', 'suplanta-marca', 'pide-clave', 'premio'))).toMatchObject(
      { gesture: 'negar', prop: 'regalo' }
    )
  })

  it('un paquete que suplanta una transportadora es un paquete', () => {
    expect(
      contextFor(result('peligroso', 'suplanta-marca', 'paquete', 'dominio-sospechoso'))
    ).toMatchObject({ gesture: 'alto', prop: 'paquete' })
  })

  it('entre dos historias gana la de mayor prioridad (el falso familiar antes que el premio)', () => {
    expect(contextFor(result('peligroso', 'premio', 'cambio-numero')).gesture).toBe('llamar')
  })

  it('peligroso solo con señales genéricas (urgencia, link) → alto, sin objeto', () => {
    expect(contextFor(result('peligroso', 'urgencia', 'link-acortado'))).toEqual({
      gesture: 'alto',
      prop: 'ninguno',
      intensity: 1
    })
    expect(contextFor(result('peligroso'))).toMatchObject({ gesture: 'alto', prop: 'ninguno' })
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
  const resultOf = (id: string): ReturnType<typeof toThreatResult> => {
    const sample = samples.find((s) => s.id === id)
    if (!sample) throw new Error(`No existe ${id}`)
    return toThreatResult(analyzeLocal(sample.text))
  }
  const ctx = (id: string): ReturnType<typeof contextFor> => contextFor(resultOf(id))

  it('el banco que pide la clave → proteger', () => {
    expect(ctx('e01').gesture).toBe('proteger')
  })
  it('el premio de Nequi → regalo, aunque pida la clave', () => {
    expect(ctx('e02')).toMatchObject({ gesture: 'negar', prop: 'regalo' })
  })
  it('el paquete de Servientrega → paquete', () => {
    expect(ctx('e03')).toMatchObject({ gesture: 'alto', prop: 'paquete' })
  })
  it('el falso familiar → teléfono', () => {
    expect(ctx('e04')).toMatchObject({ gesture: 'llamar', prop: 'telefono' })
  })
  it('el empleo que cobra → maletín', () => {
    expect(ctx('e06')).toMatchObject({ gesture: 'negar', prop: 'maletin' })
  })
  it('el préstamo con pago adelantado → moneda', () => {
    expect(ctx('e10')).toMatchObject({ gesture: 'proteger', prop: 'moneda' })
  })
  it('la inversión dudosa → moneda, con gesto suave (no «pensar» genérico)', () => {
    expect(resultOf('e15').verdict).toBe('sospechoso')
    expect(ctx('e15')).toEqual({
      gesture: 'proteger',
      prop: 'moneda',
      intensity: DOUBTFUL_INTENSITY
    })
  })

  const dangerousScams = (): Array<ReturnType<typeof contextFor>> =>
    samples
      .filter((s) => s.label === 'estafa')
      .map((s) => toThreatResult(analyzeLocal(s.text)))
      .filter((r) => r.verdict === 'peligroso')
      .map((r) => contextFor(r))

  it('las estafas peligrosas usan al menos 4 gestos y 5 objetos distintos', () => {
    const all = dangerousScams()
    expect(new Set(all.map((c) => c.gesture)).size).toBeGreaterThanOrEqual(4)
    expect(new Set(all.map((c) => c.prop)).size).toBeGreaterThanOrEqual(5)
  })

  it('ningún gesto acapara más de la mitad de las estafas peligrosas', () => {
    const all = dangerousScams()
    const counts = new Map<string, number>()
    for (const c of all) counts.set(c.gesture, (counts.get(c.gesture) ?? 0) + 1)
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(Math.ceil(all.length / 2))
  })

  it('un mensaje legítimo → celebrar con check', () => {
    expect(ctx('l01')).toEqual({ gesture: 'celebrar', prop: 'check', intensity: 1 })
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

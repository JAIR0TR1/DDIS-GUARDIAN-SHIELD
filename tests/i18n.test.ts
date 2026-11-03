import { describe, expect, it } from 'vitest'
import { createTranslator } from '../src/shared/i18n'
import { en } from '../src/shared/i18n/en'
import { es } from '../src/shared/i18n/es'
import { localizeText } from '../src/shared/i18n/localize'
import { analyzeLocal } from '../src/domain/rules'
import { toThreatResult } from '../src/domain/explain'
import corpusData from '../data/corpus.json'

const tEs = createTranslator('es')
const tEn = createTranslator('en')

describe('diccionarios', () => {
  it('inglés y español tienen exactamente las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
  })

  it('ningún texto está vacío', () => {
    for (const dictionary of [es, en]) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim().length, key).toBeGreaterThan(0)
      }
    }
  })

  it('los dos idiomas usan los mismos marcadores {nombre}', () => {
    const markers = (text: string): string[] => (text.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(markers(en[key]), key).toEqual(markers(es[key]))
    }
  })
})

describe('createTranslator', () => {
  it('reemplaza los valores', () => {
    expect(tEn('session.hello', { name: 'Ana' })).toBe('Hello, Ana')
    expect(tEs('session.hello', { name: 'Ana' })).toBe('Hola, Ana')
  })

  it('deja visible el marcador si falta el valor', () => {
    expect(tEn('session.hello')).toBe('Hello, {name}')
  })
})

describe('localizeText: los textos del análisis se traducen al mostrarlos', () => {
  it('en español no cambia nada', () => {
    expect(localizeText('Link acortado', tEs)).toBe('Link acortado')
  })

  it('traduce frases con el nombre de una marca', () => {
    expect(localizeText('Dice ser Nequi y te pide datos', tEn)).toBe(
      'Claims to be Nequi and asks for your data'
    )
    expect(localizeText('Link que imita a Bancolombia', tEn)).toBe('Link that imitates Bancolombia')
  })

  it('traduce el consejo de lo dudoso aunque lleve la frase final pegada', () => {
    const doubtful =
      'No abras el link. Entra escribiendo tú mismo la dirección oficial o usa la app. Mientras tanto, no des datos ni hagas clic.'
    const out = localizeText(doubtful, tEn)
    expect(out).toContain("Don't open the link.")
    expect(out).toContain('Meanwhile, do not give data or click.')
  })

  it('deja tal cual un texto desconocido (por ejemplo, el que escribió la IA)', () => {
    expect(localizeText('Texto que escribió la IA', tEn)).toBe('Texto que escribió la IA')
  })
})

describe('cobertura sobre el corpus real', () => {
  interface Sample {
    id: string
    text: string
  }
  const results = (corpusData as Sample[]).map((s) => ({
    id: s.id,
    result: toThreatResult(analyzeLocal(s.text))
  }))
  const isTranslated = (text: string): boolean => localizeText(text, tEn) !== text

  it('toda señal, mensaje de Nilo y acción de las reglas locales tiene traducción', () => {
    const missing = new Set<string>()
    for (const { result } of results) {
      for (const signal of result.signals)
        if (!isTranslated(signal.label)) missing.add(signal.label)
      if (!isTranslated(result.creatureMessage)) missing.add(result.creatureMessage)
      if (!isTranslated(result.recommendedAction)) missing.add(result.recommendedAction)
    }
    expect([...missing]).toEqual([])
  })
})

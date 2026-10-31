import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import corpusData from '../data/corpus.json'
import { analyzeLocal } from '../src/domain/rules'

interface Sample {
  id: string
  label: 'estafa' | 'legitimo'
  text: string
}
const corpus = corpusData as Sample[]
const scams = corpus.filter((s) => s.label === 'estafa')
const legit = corpus.filter((s) => s.label === 'legitimo')

/**
 * Métricas de las reglas locales sobre el corpus.
 * - Falso negativo duro: una estafa que las reglas dan por segura (< 30).
 * - Falso positivo duro: un mensaje legítimo que las reglas dan por peligroso (> 70).
 * - Zona de IA (30-70): no es error, se consulta a la IA.
 */
describe('corpus de 30 mensajes en español de Colombia', () => {
  const results = corpus.map((s) => ({ ...s, ...analyzeLocal(s.text) }))

  it('tiene 15 estafas y 15 mensajes legítimos', () => {
    expect(scams).toHaveLength(15)
    expect(legit).toHaveLength(15)
  })

  it('genera el informe de métricas en docs/corpus-report.md', () => {
    const count = (label: Sample['label'], verdict: string): number =>
      results.filter((r) => r.label === label && r.verdict === verdict).length
    const rows = results.map(
      (r) =>
        `| ${r.id} | ${r.label} | ${r.score} | ${r.verdict} | ${r.hits.map((h) => h.id).join(', ') || '—'} |`
    )
    const report = [
      '# Informe del corpus (generado por `npm test`)',
      '',
      `- Estafas: ${count('estafa', 'peligroso')} peligrosas, ${count('estafa', 'sospechoso')} en zona de IA, ${count('estafa', 'seguro')} falsos negativos duros.`,
      `- Legítimos: ${count('legitimo', 'seguro')} seguros, ${count('legitimo', 'sospechoso')} en zona de IA, ${count('legitimo', 'peligroso')} falsos positivos duros.`,
      '',
      '| id | tipo | puntaje | veredicto local | reglas activadas |',
      '|---|---|---|---|---|',
      ...rows,
      ''
    ].join('\n')
    writeFileSync(join(__dirname, '..', 'docs', 'corpus-report.md'), report, 'utf8')
    expect(rows).toHaveLength(30)
  })

  it('ninguna estafa queda como segura (0 falsos negativos duros)', () => {
    const missed = results.filter((r) => r.label === 'estafa' && r.verdict === 'seguro')
    expect(missed.map((r) => `${r.id}:${r.score}`)).toEqual([])
  })

  it('ningún mensaje legítimo queda como peligroso (0 falsos positivos duros)', () => {
    const wrong = results.filter((r) => r.label === 'legitimo' && r.verdict === 'peligroso')
    expect(wrong.map((r) => `${r.id}:${r.score}`)).toEqual([])
  })

  it('todos los mensajes legítimos se resuelven sin molestar a la IA', () => {
    const doubtful = results.filter((r) => r.label === 'legitimo' && r.verdict !== 'seguro')
    expect(doubtful.map((r) => `${r.id}:${r.score}`)).toEqual([])
  })

  it('al menos 12 de 15 estafas se resuelven como peligrosas sin IA', () => {
    const dangerous = results.filter((r) => r.label === 'estafa' && r.verdict === 'peligroso')
    expect(dangerous.length).toBeGreaterThanOrEqual(12)
  })
})

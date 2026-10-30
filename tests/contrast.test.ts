import { describe, expect, it } from 'vitest'
import { colors } from '../src/design/tokens'
import { blend, contrastRatio, hexToRgb } from '../src/design/contrast'

const AA = 4.5

/**
 * Regla de diseño: bajo un panel de vidrio, la malla de gradientes nunca supera el 14 % de
 * intensidad de cian. Ese es el punto más claro posible detrás del texto.
 */
export const MESH_MAX_ALPHA_UNDER_PANELS = 0.14
const brightestMesh = blend(hexToRgb('#22D3EE'), hexToRgb(colors.bg), MESH_MAX_ALPHA_UNDER_PANELS)
const glassWorst = blend({ r: 255, g: 255, b: 255 }, brightestMesh, 0.1)
const glassTypical = blend({ r: 255, g: 255, b: 255 }, hexToRgb(colors.bgRaised), 0.07)

const textOnBg = [
  'text',
  'textMuted',
  'textSubtle',
  'accent',
  'accentStrong',
  'safe',
  'warn',
  'danger',
  'dangerText'
] as const
const textOnGlass = ['text', 'textMuted', 'accent', 'accentStrong', 'safe', 'warn', 'dangerText'] as const

describe('contraste AA de los tokens', () => {
  it.each(textOnBg)('%s sobre el fondo base', (name) => {
    expect(contrastRatio(hexToRgb(colors[name]), hexToRgb(colors.bg))).toBeGreaterThanOrEqual(AA)
  })

  it.each(textOnGlass)('%s sobre vidrio típico', (name) => {
    expect(contrastRatio(hexToRgb(colors[name]), glassTypical)).toBeGreaterThanOrEqual(AA)
  })

  it.each(textOnGlass)('%s sobre vidrio en el peor caso de la malla', (name) => {
    expect(contrastRatio(hexToRgb(colors[name]), glassWorst)).toBeGreaterThanOrEqual(AA)
  })

  it('el texto del botón primario sobre cian cumple AA', () => {
    expect(contrastRatio(hexToRgb(colors.accentInk), hexToRgb(colors.accent))).toBeGreaterThanOrEqual(AA)
  })

  it('los iconos de semáforo cumplen 3:1 sobre vidrio (elementos gráficos)', () => {
    for (const name of ['safe', 'warn', 'danger'] as const) {
      expect(contrastRatio(hexToRgb(colors[name]), glassWorst)).toBeGreaterThanOrEqual(3)
    }
  })
})

/** Espejo en TypeScript de tokens.css, para dominio, pruebas y SVG. */
export const colors = {
  bg: '#05070D',
  bgRaised: '#0B0F19',
  text: '#E6EAF2',
  textMuted: '#A9B2C5',
  textSubtle: '#8791A6',
  accent: '#22D3EE',
  accentStrong: '#67E8F9',
  accentInk: '#04222A',
  violet: '#8B5CF6',
  safe: '#34D399',
  warn: '#FBBF24',
  danger: '#F43F5E',
  dangerText: '#FF8A9C'
} as const

export const rarityColors = {
  comun: '#9CA3AF',
  rara: '#3B82F6',
  epica: '#A855F7',
  legendaria: '#F59E0B'
} as const

export type Rarity = keyof typeof rarityColors

/** Color del halo de la criatura según el estado del sistema. */
export const haloColors = {
  activo: colors.accent,
  duda: colors.warn,
  amenaza: colors.danger,
  dormida: '#6B7280'
} as const

export type HaloState = keyof typeof haloColors

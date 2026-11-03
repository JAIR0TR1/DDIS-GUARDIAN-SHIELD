import { z } from 'zod'
import { DEFAULT_LANGUAGE, LANGUAGES } from './i18n/types'
import { DEFAULT_SKIN, SKINS } from '../domain/skins'

/** Perfil LOCAL: sin cuenta ni contraseña. */
export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Escribe cómo te llamas').max(24, 'Máximo 24 caracteres'),
  createdAt: z.string(),
  onboardingDone: z.boolean(),
  /** Permiso opt-in del vigilante de portapapeles (P1). */
  vigilante: z.boolean()
})
export type Profile = z.infer<typeof profileSchema>

export const thresholdsSchema = z
  .object({
    /** Por debajo: seguro sin llamar a la IA. */
    safeBelow: z.number().int().min(1).max(60),
    /** Por encima: peligroso sin llamar a la IA. */
    dangerAbove: z.number().int().min(40).max(99)
  })
  .refine((t) => t.safeBelow < t.dangerAbove, {
    message: 'El umbral seguro debe ser menor que el peligroso'
  })

export const THEMES = ['dark', 'light', 'system'] as const
export const themeSchema = z.enum(THEMES)
export type Theme = z.infer<typeof themeSchema>

export const settingsSchema = z.object({
  /** Idioma de la interfaz. */
  language: z.enum(LANGUAGES).default(DEFAULT_LANGUAGE),
  /** Apariencia de la interfaz; «system» sigue el modo de Windows. */
  theme: themeSchema.default('dark'),
  reduceMotion: z.boolean().default(false),
  /** El vigilante confirma con un aviso breve cuando lo copiado está bien (no solo si es peligroso). */
  notifySafe: z.boolean().default(true),
  shortcut: z.string().min(1).max(40).default('Ctrl+Shift+G'),
  thresholds: thresholdsSchema.default({ safeBelow: 30, dangerAbove: 70 })
})
export type Settings = z.infer<typeof settingsSchema>

export const RARITIES = ['comun', 'rara', 'epica', 'legendaria'] as const
export const raritySchema = z.enum(RARITIES)

export const PHRASE_SITUATIONS = [
  'bienvenida',
  'reposo',
  'seguro',
  'sospechoso',
  'peligroso',
  'subirNivel'
] as const
export type PhraseSituation = (typeof PHRASE_SITUATIONS)[number]

export const creatureSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  rarity: raritySchema,
  attack: z.number().int().min(0).max(999),
  defense: z.number().int().min(0).max(999),
  /** XP acumulada dentro del nivel actual. */
  xp: z.number().int().min(0),
  level: z.number().int().min(1).max(99),
  /** Apariencia elegida (se desbloquean por nivel). */
  skin: z.enum(SKINS).default(DEFAULT_SKIN),
  personality: z.string().min(1),
  phrases: z.record(z.string(), z.array(z.string().min(1)).min(1))
})
export type Creature = z.infer<typeof creatureSchema>

export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({})

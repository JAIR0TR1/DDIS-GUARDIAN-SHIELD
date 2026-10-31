import { z } from 'zod'
import { historyEntrySchema, inputSourceSchema } from './history'
import { creatureSchema } from './models'

export const MAX_TEXT_LENGTH = 5000

/** Lo que el renderer envía a analizar. Se valida otra vez en main. */
export const analyzeInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Pega un mensaje primero')
    .max(MAX_TEXT_LENGTH, 'El mensaje es muy largo'),
  source: inputSourceSchema
})
export type AnalyzeInput = z.infer<typeof analyzeInputSchema>

/** Resultado completo de un análisis: entrada de historial, XP y criatura ya actualizada. */
export const analysisOutcomeSchema = z.object({
  entry: historyEntrySchema,
  /** Texto completo analizado (solo para mostrarlo con resaltado; no se guarda en el historial). */
  text: z.string(),
  creature: creatureSchema,
  xpGained: z.number().int().min(0),
  levelsGained: z.number().int().min(0),
  fromCache: z.boolean(),
  /** Aviso amable cuando se usó un plan B (p. ej. sin red: solo reglas locales). */
  notice: z.string().optional()
})
export type AnalysisOutcome = z.infer<typeof analysisOutcomeSchema>

export interface AppConfig {
  /** `true`: respuestas de ejemplo, sin internet ni clave. */
  demoMode: boolean
}

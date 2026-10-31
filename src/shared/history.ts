import { z } from 'zod'
import { threatResultSchema } from './threat'

export const INPUT_SOURCES = ['text', 'link', 'image'] as const
export const inputSourceSchema = z.enum(INPUT_SOURCES)
export type InputSource = z.infer<typeof inputSourceSchema>

/** Una entrada del historial local. */
export const historyEntrySchema = z.object({
  id: z.string().min(1),
  /** ISO 8601. */
  at: z.string(),
  source: inputSourceSchema,
  /** Fragmento del mensaje (ya recortado). El texto completo no se guarda. */
  excerpt: z.string().max(200),
  result: threatResultSchema,
  /** `true` si el veredicto final se apoyó en la IA. */
  usedAI: z.boolean(),
  /** Quién dio la segunda opinión cuando `usedAI` es true (p. ej. "demo" o "gemini"). */
  provider: z.string().max(24).optional()
})
export type HistoryEntry = z.infer<typeof historyEntrySchema>

export const historySchema = z.array(historyEntrySchema).max(500)

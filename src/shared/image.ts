import { z } from 'zod'
import { threatResultSchema } from './threat'
import type { AnalysisOutcome } from './analysis'

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
/** Límite de tamaño de la captura (la API admite hasta 20 MB; 4 MB basta para una pantalla). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/** Captura que envía la interfaz. Se valida otra vez en el proceso principal. */
export const analyzeImageInputSchema = z.object({
  mimeType: z.enum(IMAGE_TYPES),
  /** Contenido en base64, sin el prefijo «data:». */
  data: z.base64().max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 8)
})
export type AnalyzeImageInput = z.infer<typeof analyzeImageInputSchema>

/** ¿Se puede analizar este archivo? Devuelve un mensaje amable si no, o `null` si está bien. */
export function checkImageFile(file: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Ese archivo no es una captura válida. Usa una imagen PNG, JPG o WEBP.'
  }
  if (file.size === 0) return 'La imagen está vacía.'
  if (file.size > MAX_IMAGE_BYTES) {
    return `La imagen pesa más de ${MAX_IMAGE_BYTES / (1024 * 1024)} MB. Prueba con una captura más pequeña.`
  }
  return null
}

/** Una captura puede traer varios mensajes (p. ej. dos chats): se analizan por separado. */
export const MAX_IMAGE_MESSAGES = 5

/** Un mensaje de la captura: su transcripción y su análisis. */
export const visionMessageSchema = threatResultSchema.extend({
  extractedText: z.string().max(3000)
})

/** Lo que devuelve el modelo de visión: uno o más mensajes, en el orden en que aparecen. */
export const visionResultSchema = z.object({
  messages: z.array(visionMessageSchema).min(1).max(MAX_IMAGE_MESSAGES)
})

/** Respuesta del análisis de una captura: un resultado por mensaje, o un mensaje amable. */
export type ImageAnalysisResponse =
  { ok: true; outcomes: AnalysisOutcome[] } | { ok: false; message: string }

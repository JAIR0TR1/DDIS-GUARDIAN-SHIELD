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

/** Lo que devuelve el modelo de visión: el resultado más la transcripción de la captura. */
export const visionResultSchema = threatResultSchema.extend({
  extractedText: z.string().max(3000)
})

/** Respuesta del análisis de una captura: o un resultado, o un mensaje amable para mostrar. */
export type ImageAnalysisResponse =
  { ok: true; outcome: AnalysisOutcome } | { ok: false; message: string }

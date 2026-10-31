import { z } from 'zod'

export const VERDICTS = ['seguro', 'sospechoso', 'peligroso'] as const
export const verdictSchema = z.enum(VERDICTS)
export type Verdict = z.infer<typeof verdictSchema>

export const SEVERITIES = ['baja', 'media', 'alta'] as const
export const severitySchema = z.enum(SEVERITIES)
export type Severity = z.infer<typeof severitySchema>

/** Iconos disponibles para las señales (nombre de Lucide mapeado en el renderer). */
export const SIGNAL_KINDS = [
  'link-acortado',
  'urgencia',
  'pide-clave',
  'suplanta-marca',
  'dominio-sospechoso',
  'premio',
  'comprobante',
  'paquete',
  'empleo',
  'soporte',
  'cambio-numero',
  'dinero',
  'otro'
] as const
export const signalKindSchema = z.enum(SIGNAL_KINDS)
export type SignalKind = z.infer<typeof signalKindSchema>

export const signalSchema = z.object({
  id: z.string().min(1).max(60),
  kind: signalKindSchema,
  label: z.string().min(1).max(80),
  severity: severitySchema,
  /** Posiciones [inicio, fin) en el texto original, para resaltarlo. Solo las reglas locales las dan. */
  spans: z
    .array(z.tuple([z.number().int().min(0), z.number().int().min(0)]))
    .max(8)
    .optional()
})
export type Signal = z.infer<typeof signalSchema>

/** Resultado estructurado de un análisis (el contrato de analyzeThreat). */
export const threatResultSchema = z.object({
  verdict: verdictSchema,
  score: z.number().int().min(0).max(100),
  signals: z.array(signalSchema).max(12),
  recommendedAction: z.string().min(1).max(240),
  creatureMessage: z.string().min(1).max(200)
})
export type ThreatResult = z.infer<typeof threatResultSchema>

import type { SignalKind, ThreatResult } from '../shared/threat'

/**
 * Identidad de cada tipo de estafa: un «villano» con nombre, color y forma de delatarse.
 * Dominio puro: los textos viven en los diccionarios (`villain.<id>.*`) y los iconos en la
 * interfaz. El mismo villano se usa en la Arena y puede usarse en cualquier pantalla.
 */
export const VILLAINS = [
  'familiar',
  'comprobante',
  'paquete',
  'empleo',
  'dinero',
  'premio',
  'soporte',
  'banco',
  'impostor'
] as const
export type VillainId = (typeof VILLAINS)[number]

/** Color propio de cada villano (borde, brillo e icono). */
export const VILLAIN_COLORS: Record<VillainId, string> = {
  familiar: '#A855F7',
  comprobante: '#F97316',
  paquete: '#F59E0B',
  empleo: '#3B82F6',
  dinero: '#EAB308',
  premio: '#EC4899',
  soporte: '#06B6D4',
  banco: '#F43F5E',
  impostor: '#94A3B8'
}

/** Qué señal identifica a cada villano, en orden de prioridad (la historia antes que el pedido). */
const BY_KIND: ReadonlyArray<[SignalKind, VillainId]> = [
  ['cambio-numero', 'familiar'],
  ['comprobante', 'comprobante'],
  ['paquete', 'paquete'],
  ['empleo', 'empleo'],
  ['dinero', 'dinero'],
  ['premio', 'premio'],
  ['soporte', 'soporte'],
  ['pide-clave', 'banco'],
  ['suplanta-marca', 'banco']
]

/** El villano detrás de un resultado; `impostor` si no hay una historia clara. */
export function villainFor(result: Pick<ThreatResult, 'signals'>): VillainId {
  const kinds = new Set(result.signals.map((s) => s.kind))
  return BY_KIND.find(([kind]) => kinds.has(kind))?.[1] ?? 'impostor'
}

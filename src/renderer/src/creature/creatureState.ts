import type { HaloState } from '@design/tokens'

export type CreatureState = 'reposo' | 'escaneando' | 'alerta' | 'feliz'

/** Halo que corresponde por defecto a cada estado de la criatura. */
export const defaultHalo: Record<CreatureState, HaloState> = {
  reposo: 'activo',
  escaneando: 'activo',
  alerta: 'amenaza',
  feliz: 'activo'
}

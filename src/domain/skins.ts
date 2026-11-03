import type { Rarity } from '../design/tokens'

/**
 * Apariencias de Nilo. Se desbloquean subiendo de nivel (analizando mensajes o jugando la
 * Arena). Dominio puro: solo colores y reglas; el modelo 3D los aplica.
 */
export const SKINS = ['clasico', 'medianoche', 'esmeralda', 'fuego', 'aurora'] as const
export type SkinId = (typeof SKINS)[number]

export interface SkinPalette {
  body: string
  cap: string
  brim: string
  eyes: string
  shield: string
  chain: string
  chainGlow: string
}

export interface Skin {
  id: SkinId
  unlockLevel: number
  rarity: Rarity
  palette: SkinPalette
}

export const SKIN_CATALOG: Record<SkinId, Skin> = {
  clasico: {
    id: 'clasico',
    unlockLevel: 1,
    rarity: 'comun',
    palette: {
      body: '#1B3560',
      cap: '#5B21B6',
      brim: '#19B8D1',
      eyes: '#5EEAF8',
      shield: '#8B5CF6',
      chain: '#F4C95D',
      chainGlow: '#7A5410'
    }
  },
  medianoche: {
    id: 'medianoche',
    unlockLevel: 2,
    rarity: 'rara',
    palette: {
      body: '#1F2433',
      cap: '#0F172A',
      brim: '#22D3EE',
      eyes: '#67E8F9',
      shield: '#22D3EE',
      chain: '#E5E7EB',
      chainGlow: '#374151'
    }
  },
  esmeralda: {
    id: 'esmeralda',
    unlockLevel: 3,
    rarity: 'rara',
    palette: {
      body: '#0F3D3A',
      cap: '#047857',
      brim: '#FBBF24',
      eyes: '#6EE7B7',
      shield: '#10B981',
      chain: '#F4C95D',
      chainGlow: '#7A5410'
    }
  },
  fuego: {
    id: 'fuego',
    unlockLevel: 4,
    rarity: 'epica',
    palette: {
      body: '#3B1220',
      cap: '#B91C1C',
      brim: '#F97316',
      eyes: '#FDBA74',
      shield: '#F43F5E',
      chain: '#F4C95D',
      chainGlow: '#7A5410'
    }
  },
  aurora: {
    id: 'aurora',
    unlockLevel: 5,
    rarity: 'legendaria',
    palette: {
      body: '#2E1065',
      cap: '#F59E0B',
      brim: '#FDE68A',
      eyes: '#FDE68A',
      shield: '#F59E0B',
      chain: '#FDE68A',
      chainGlow: '#92400E'
    }
  }
}

export const DEFAULT_SKIN: SkinId = 'clasico'

export function isSkinUnlocked(skin: SkinId, level: number): boolean {
  return level >= SKIN_CATALOG[skin].unlockLevel
}

/** La apariencia que se puede usar: si está bloqueada para ese nivel, la clásica. */
export function usableSkin(skin: SkinId | undefined, level: number): SkinId {
  return skin && isSkinUnlocked(skin, level) ? skin : DEFAULT_SKIN
}

/** La siguiente apariencia por desbloquear (para motivar a subir de nivel), o `null`. */
export function nextSkin(level: number): Skin | null {
  return SKINS.map((id) => SKIN_CATALOG[id]).find((s) => s.unlockLevel > level) ?? null
}

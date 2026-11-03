import { createContext, useContext } from 'react'
import { DEFAULT_SKIN, type SkinId } from '@domain/skins'

/** Apariencia de Nilo que usa toda la interfaz (la de la criatura del usuario). */
export const SkinContext = createContext<SkinId>(DEFAULT_SKIN)

export function useSkin(): SkinId {
  return useContext(SkinContext)
}

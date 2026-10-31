import { createContext, useContext } from 'react'

/** `true` si hay que reducir el movimiento (ajuste de la app o preferencia del sistema). */
export const ReducedMotionContext = createContext(false)

export function useReducedMotionPref(): boolean {
  return useContext(ReducedMotionContext)
}

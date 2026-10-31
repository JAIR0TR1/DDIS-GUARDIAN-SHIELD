import type { Creature, Profile, Settings } from './models'

/** Contrato tipado de lo que el preload expone al renderer como `window.guardian`. */
export interface GuardianApi {
  window: {
    minimize: () => void
    toggleMaximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    /** Devuelve una función para dejar de escuchar. */
    onMaximizedChange: (listener: (maximized: boolean) => void) => () => void
  }
  data: {
    /** `null` si aún no hay perfil (primer arranque). */
    getProfile: () => Promise<Profile | null>
    saveProfile: (profile: Profile) => Promise<Profile>
    getSettings: () => Promise<Settings>
    saveSettings: (settings: Settings) => Promise<Settings>
    getCreature: () => Promise<Creature>
    saveCreature: (creature: Creature) => Promise<Creature>
  }
}

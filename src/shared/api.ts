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
}

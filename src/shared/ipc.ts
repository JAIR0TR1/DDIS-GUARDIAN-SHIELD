/** Canales IPC entre renderer y main. Única fuente de verdad. */
export const IPC = {
  window: {
    minimize: 'window:minimize',
    toggleMaximize: 'window:toggle-maximize',
    close: 'window:close',
    isMaximized: 'window:is-maximized',
    maximizedChanged: 'window:maximized-changed'
  },
  data: {
    getProfile: 'data:get-profile',
    saveProfile: 'data:save-profile',
    getSettings: 'data:get-settings',
    saveSettings: 'data:save-settings',
    getCreature: 'data:get-creature',
    saveCreature: 'data:save-creature',
    getHistory: 'data:get-history',
    clearHistory: 'data:clear-history',
    /** Evento: el historial, el perfil o la criatura cambiaron en segundo plano. */
    changed: 'data:changed'
  },
  alert: {
    /** Evento: mostrar contenido en la ventana flotante. */
    show: 'alert:show',
    ready: 'alert:ready',
    dismiss: 'alert:dismiss',
    openDetail: 'alert:open-detail'
  },
  watcher: {
    /** Evento: el vigilante revisó (o descartó) algo copiado. */
    event: 'watcher:event'
  },
  nav: {
    /** Evento: la ventana principal debe ir a una sección. */
    go: 'nav:go'
  },
  shortcut: {
    set: 'shortcut:set'
  },
  analysis: {
    run: 'analysis:run',
    runImage: 'analysis:run-image',
    /** Primer vistazo con reglas locales: no guarda nada ni usa la IA. */
    peek: 'analysis:peek'
  },
  config: {
    get: 'config:get'
  },
  ai: {
    saveKey: 'ai:save-key',
    clearKey: 'ai:clear-key',
    test: 'ai:test'
  },
  app: {
    relaunch: 'app:relaunch'
  }
} as const

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
    saveCreature: 'data:save-creature'
  }
} as const

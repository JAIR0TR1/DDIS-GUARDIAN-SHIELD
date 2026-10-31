import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerWindowControls } from './windowControls'
import { registerDataIpc } from './dataIpc'
import { createAppData } from './storage/appData'
import { createAnalysisService } from './analysis/service'
import { createProviderResolver } from './analysis/providerFactory'
import { createApiKeyStore } from './secrets/apiKeyStore'
import { loadEnvironment, resolveConfig } from './config'
import { createGuardianController } from './guardianController'
import { runAlertTest } from './devAlertTest'
import { prepareAlertWindow, registerAlertReady } from './windows/alertWindow'
import { createMainWindow, showMainWindow } from './windows/mainWindow'

const APP_ID = 'com.escudoguardian.app'

// Solo desarrollo: GUARDIAN_DATA_DIR aísla TODOS los datos (JSON y caché de Chromium) para poder
// ejecutar pruebas y capturas sin chocar con otra copia de la app abierta.
const devDataDir = process.env['GUARDIAN_DATA_DIR']
if (!app.isPackaged && devDataDir) app.setPath('userData', devDataDir)

// Una sola copia a la vez: abrirla de nuevo trae la existente al frente (útil con la bandeja).
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })

  void app.whenReady().then(async () => {
    electronApp.setAppUserModelId(APP_ID)

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerWindowControls()
    registerAlertReady()
    loadEnvironment()
    const data = createAppData()
    const keys = createApiKeyStore(join(app.getPath('userData'), 'gemini.key.bin'))
    // Demo o real se decide una sola vez al arrancar (cambiarlo requiere reiniciar).
    const config = await resolveConfig(keys)
    const analysis = createAnalysisService(data, createProviderResolver(config, keys))
    const controller = createGuardianController({ data, analysis })
    registerDataIpc({ data, analysis, keys, config, controller })

    createMainWindow(() => controller.shouldHideOnClose())
    prepareAlertWindow()
    await controller.init()
    void runAlertTest(controller)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0)
        createMainWindow(() => controller.shouldHideOnClose())
    })
    app.on('will-quit', () => controller.dispose())
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

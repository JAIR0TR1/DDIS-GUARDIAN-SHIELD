import { app, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../build/icon.png?asset'
import { registerWindowControls } from './windowControls'
import { runDevScreenshots } from './devScreenshot'
import { registerDataIpc } from './dataIpc'
import { createAppData } from './storage/appData'
import { createAnalysisService } from './analysis/service'
import { createProviderResolver } from './analysis/providerFactory'
import { createApiKeyStore } from './secrets/apiKeyStore'
import { loadEnvironment, resolveConfig } from './config'

const APP_ID = 'com.escudoguardian.app'

// Solo desarrollo: GUARDIAN_DATA_DIR aísla TODOS los datos (JSON y caché de Chromium) para poder
// ejecutar pruebas y capturas sin chocar con otra copia de la app abierta.
const devDataDir = process.env['GUARDIAN_DATA_DIR']
if (!app.isPackaged && devDataDir) app.setPath('userData', devDataDir)
const BACKGROUND = '#05070D'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: BACKGROUND,
    title: 'Escudo Guardián',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  // Los enlaces nunca se abren dentro de la app ni automáticamente.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL()
    if (url !== current) {
      event.preventDefault()
      if (/^https:\/\//i.test(url)) void shell.openExternal(url)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  runDevScreenshots(mainWindow)
  return mainWindow
}

void app.whenReady().then(async () => {
  electronApp.setAppUserModelId(APP_ID)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerWindowControls()
  loadEnvironment()
  const data = createAppData()
  const keys = createApiKeyStore(join(app.getPath('userData'), 'gemini.key.bin'))
  // Demo o real se decide una sola vez al arrancar (cambiarlo requiere reiniciar).
  const config = await resolveConfig(keys)
  const analysis = createAnalysisService(data, createProviderResolver(config, keys))
  registerDataIpc({ data, analysis, keys, config })
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

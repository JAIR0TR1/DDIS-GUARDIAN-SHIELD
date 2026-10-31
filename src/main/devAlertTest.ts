import { app, clipboard } from 'electron'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { GuardianController } from './guardianController'
import type { AppData } from './storage/appData'
import { trayIconFor } from './tray'
import { getAlertWindow } from './windows/alertWindow'
import { getMainWindow } from './windows/mainWindow'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * SOLO DESARROLLO. Si GUARDIAN_WATCHER_TEST está definida (y el perfil tiene el vigilante activo),
 * copia textos distintos al portapapeles real y comprueba qué hace el vigilante con cada uno.
 */
export async function runWatcherTest(data: AppData): Promise<void> {
  if (!process.env['GUARDIAN_WATCHER_TEST'] || app.isPackaged) return
  const log = (name: string, ok: boolean): void =>
    console.log(`[watcher-test] ${name}: ${ok ? 'OK' : 'FALLÓ'}`)
  const scam = 'Ganaste un premio. Confirma tu clave en bit.ly/premio-nequi'
  try {
    await sleep(6000)
    // 1) Una contraseña: ni alerta ni historial.
    clipboard.writeText('P@ssw0rd-Segura9')
    await sleep(2200)
    log('una contraseña NO dispara alerta', getAlertWindow()?.isVisible() !== true)
    log('una contraseña NO se guarda', (await data.getHistory()).length === 0)

    // 2) Un mensaje legítimo: confirmación breve («todo en orden»), pero sin guardarse.
    clipboard.writeText('Recordatorio: mañana tienes clase a las 8 en el salón 204.')
    await sleep(2200)
    const safeAlert = getAlertWindow()
    log('un mensaje legítimo muestra «todo en orden»', safeAlert?.isVisible() === true)
    log('la confirmación NO roba el foco', safeAlert?.isFocused() === false)
    log('un mensaje legítimo NO se guarda', (await data.getHistory()).length === 0)
    if (safeAlert) {
      const image = await safeAlert.webContents.capturePage()
      const dir = process.env['GUARDIAN_SHOTS_DIR'] ?? join(app.getAppPath(), '.screenshots')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'watcher-safe.png'), image.toPNG())
    }

    // 3) Una estafa: alerta sin robar el foco, notificación e historial.
    clipboard.writeText(scam)
    await sleep(2800)
    const alert = getAlertWindow()
    log('una estafa muestra la alerta', alert?.isVisible() === true)
    log('la alerta NO roba el foco al usuario', alert?.isFocused() === false)
    const history = await data.getHistory()
    log('la estafa queda en el historial', history.length === 1)
    log('el vigilante NO usó la IA', history[0]?.usedAI === false)
    if (alert) {
      const image = await alert.webContents.capturePage()
      const dir = process.env['GUARDIAN_SHOTS_DIR'] ?? join(app.getAppPath(), '.screenshots')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'watcher-alert.png'), image.toPNG())
    }

    // 4) El mismo texto otra vez: no se duplica.
    clipboard.writeText('otra cosa sin importancia para cambiar el portapapeles')
    await sleep(1500)
    clipboard.writeText(scam)
    await sleep(2500)
    log('copiar lo mismo otra vez no rompe nada', (await data.getHistory()).length >= 1)
  } catch (error) {
    console.error('[watcher-test] Error inesperado', error)
  } finally {
    app.quit()
  }
}

/**
 * SOLO DESARROLLO. Si GUARDIAN_ALERT_TEST trae un texto, simula de punta a punta el flujo del
 * atajo global: copiar → atajo → alerta flotante → Enter (detalle) y Esc (descartar), guarda capturas
 * en GUARDIAN_SHOTS_DIR e imprime el resultado de cada comprobación.
 */
export async function runAlertTest(controller: GuardianController): Promise<void> {
  const text = process.env['GUARDIAN_ALERT_TEST']
  if (!text || app.isPackaged) return
  const dir = process.env['GUARDIAN_SHOTS_DIR'] ?? join(app.getAppPath(), '.screenshots')
  mkdirSync(dir, { recursive: true })
  const log = (name: string, ok: boolean): void =>
    console.log(`[alert-test] ${name}: ${ok ? 'OK' : 'FALLÓ'}`)
  const shoot = async (name: string, which: 'alert' | 'main'): Promise<void> => {
    const win = which === 'alert' ? getAlertWindow() : getMainWindow()
    if (!win) return
    const image = await win.webContents.capturePage()
    writeFileSync(join(dir, `${name}.png`), image.toPNG())
  }

  try {
    // 0) Iconos de la bandeja de cada estado (ampliados para poder verlos).
    for (const state of ['activo', 'duda', 'amenaza', 'dormida'] as const) {
      const big = trayIconFor(state).resize({ width: 192, height: 192, quality: 'best' })
      writeFileSync(join(dir, `tray-${state}.png`), big.toPNG())
    }
    log('iconos de bandeja generados', true)

    await sleep(5000) // deja que la ventana principal cargue y entre a la sesión

    // 1) Atajo con algo copiado: aparece la alerta con el resultado.
    clipboard.writeText(text)
    await controller.analyzeClipboard()
    await sleep(2200)
    const alert = getAlertWindow()
    log('la alerta flotante está visible', alert?.isVisible() === true)
    log('la alerta está siempre encima', alert?.isAlwaysOnTop() === true)
    await shoot('alert-result', 'alert')

    // 2) Enter: abre el detalle en la ventana principal y esconde la alerta.
    alert?.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' })
    await sleep(1800)
    log('Enter oculta la alerta', getAlertWindow()?.isVisible() === false)
    log('Enter trae la ventana principal', getMainWindow()?.isVisible() === true)
    await shoot('alert-detail', 'main')

    // 3) Esc: descarta la alerta sin abrir nada.
    await controller.analyzeClipboard()
    await sleep(2000)
    log('la alerta vuelve a aparecer', getAlertWindow()?.isVisible() === true)
    getAlertWindow()?.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
    await sleep(800)
    log('Esc descarta la alerta', getAlertWindow()?.isVisible() === false)

    // 4) Portapapeles vacío: avisa con claridad.
    clipboard.clear()
    await controller.analyzeClipboard()
    await sleep(1500)
    log('portapapeles vacío muestra aviso', getAlertWindow()?.isVisible() === true)
    await shoot('alert-empty', 'alert')
  } catch (error) {
    console.error('[alert-test] Error inesperado', error)
  } finally {
    app.quit()
  }
}

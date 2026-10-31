import { app, type BrowserWindow } from 'electron'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface Shot {
  /** Nombre del archivo (sin extensión). */
  name: string
  /** Milisegundos a esperar antes de capturar. */
  wait: number
  /** JavaScript opcional a ejecutar en la página antes de esperar (clics, cambios de ruta). */
  js?: string
  /** Captura solo este rectángulo de la ventana (en píxeles de la página). */
  rect?: { x: number; y: number; width: number; height: number }
  /** Redimensiona la ventana antes de capturar. */
  size?: [number, number]
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * SOLO DESARROLLO. Si GUARDIAN_SHOTS contiene un JSON con una lista de capturas, la app las toma
 * con capturePage (únicamente el contenido de la ventana, nunca el escritorio) y se cierra.
 * Las imágenes se guardan en GUARDIAN_SHOTS_DIR (por defecto .screenshots/).
 */
export function runDevScreenshots(win: BrowserWindow): void {
  const raw = process.env['GUARDIAN_SHOTS']
  if (!raw || app.isPackaged) return

  let shots: Shot[]
  try {
    shots = JSON.parse(raw) as Shot[]
  } catch (error) {
    console.error('GUARDIAN_SHOTS no es un JSON válido', error)
    app.quit()
    return
  }

  const dir = process.env['GUARDIAN_SHOTS_DIR'] ?? join(app.getAppPath(), '.screenshots')
  mkdirSync(dir, { recursive: true })

  win.webContents.once('did-finish-load', () => {
    void (async () => {
      try {
        await sleep(600)
        for (const shot of shots) {
          if (shot.size) win.setSize(shot.size[0], shot.size[1])
          if (shot.js) {
            const result: unknown = await win.webContents.executeJavaScript(shot.js)
            // Si el script devuelve un valor (p. ej. una medición), se imprime para poder leerlo.
            if (result !== undefined) console.log(`[shot:${shot.name}]`, JSON.stringify(result))
          }
          await sleep(shot.wait)
          const image = await win.webContents.capturePage(shot.rect)
          writeFileSync(join(dir, `${shot.name}.png`), image.toPNG())
        }
      } catch (error) {
        console.error('Error al capturar pantallas', error)
      } finally {
        app.quit()
      }
    })()
  })
}

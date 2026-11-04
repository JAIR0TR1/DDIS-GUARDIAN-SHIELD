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
  /**
   * Teclas reales que se envían a la ventana ANTES del js (p. ej. ["Tab", "Shift+Tab", "Enter"]),
   * para probar el recorrido con teclado como lo haría una persona.
   */
  keys?: string[]
  /** No guarda imagen: útil para pasos intermedios del recorrido con teclado. */
  skipImage?: boolean
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

type Modifier = 'shift' | 'control' | 'alt'
const MODIFIERS: Record<string, Modifier> = { Shift: 'shift', Ctrl: 'control', Alt: 'alt' }

/** Envía una tecla real (con modificadores tipo "Shift+Tab") a la ventana. */
async function sendKey(win: BrowserWindow, combo: string): Promise<void> {
  const parts = combo.split('+')
  const keyCode = parts.pop() ?? combo
  const modifiers = parts.map((part) => MODIFIERS[part]).filter((m): m is Modifier => !!m)
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
  // Las teclas imprimibles necesitan además el evento 'char' para escribir texto, y Enter también:
  // Chromium activa los botones con ese evento.
  if (keyCode.length === 1) win.webContents.sendInputEvent({ type: 'char', keyCode, modifiers })
  if (keyCode === 'Enter')
    win.webContents.sendInputEvent({ type: 'char', keyCode: '\r', modifiers })
  await sleep(30)
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
}

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
          for (const key of shot.keys ?? []) {
            await sendKey(win, key)
            await sleep(120)
          }
          if (shot.js) {
            const result: unknown = await win.webContents.executeJavaScript(shot.js)
            // Si el script devuelve un valor (p. ej. una medición), se imprime para poder leerlo.
            if (result !== undefined) console.log(`[shot:${shot.name}]`, JSON.stringify(result))
          }
          await sleep(shot.wait)
          if (shot.skipImage) continue
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

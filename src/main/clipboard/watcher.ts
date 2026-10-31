import { createHash } from 'node:crypto'

export interface WatcherOptions {
  /** Lee el texto actual del portapapeles. */
  read: () => Promise<string>
  /** Se llama con cada texto NUEVO (nunca repetido). */
  onText: (text: string) => Promise<void> | void
  /** Cada cuánto se revisa (ms). Electron no avisa cambios del portapapeles: se sondea. */
  intervalMs?: number
}

export interface ClipboardWatcher {
  start: () => Promise<void>
  stop: () => void
  isRunning: () => boolean
}

const digest = (text: string): string => createHash('sha1').update(text).digest('hex')

/**
 * Vigilante del portapapeles con sondeo ligero (700-1000 ms).
 * - Al activarse NO analiza lo que ya estaba copiado: solo lo que se copie después.
 * - Ignora el contenido repetido.
 * - Guarda solo una huella (hash) del último texto, no el texto.
 * - Nunca se superponen dos revisiones.
 */
export function createClipboardWatcher(options: WatcherOptions): ClipboardWatcher {
  const interval = options.intervalMs ?? 900
  let timer: NodeJS.Timeout | null = null
  let lastHash = ''
  let busy = false

  async function poll(): Promise<void> {
    if (busy) return
    busy = true
    try {
      const text = await options.read()
      if (!text) {
        lastHash = ''
        return
      }
      const hash = digest(text)
      if (hash === lastHash) return
      lastHash = hash
      await options.onText(text)
    } catch (error) {
      // Un fallo puntual (portapapeles ocupado por otra app) no debe detener la vigilancia.
      console.warn(
        '[portapapeles] No pude leerlo esta vez',
        error instanceof Error ? error.message : error
      )
    } finally {
      busy = false
    }
  }

  return {
    async start() {
      if (timer) return
      // Lo que ya estaba copiado al activar el vigilante se ignora.
      try {
        const current = await options.read()
        lastHash = current ? digest(current) : ''
      } catch {
        lastHash = ''
      }
      timer = setInterval(() => void poll(), interval)
    },
    stop() {
      if (timer) clearInterval(timer)
      timer = null
      lastHash = ''
    },
    isRunning: () => timer !== null
  }
}

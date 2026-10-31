import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClipboardWatcher, type ClipboardWatcher } from '../src/main/clipboard/watcher'

describe('createClipboardWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(initial: string): {
    watcher: ClipboardWatcher
    seen: string[]
    copy: (t: string) => void
  } {
    let clip = initial
    const seen: string[] = []
    const watcher = createClipboardWatcher({
      read: async () => clip,
      onText: (t) => void seen.push(t),
      intervalMs: 900
    })
    return {
      watcher,
      seen,
      copy: (t: string) => {
        clip = t
      }
    }
  }

  it('ignora lo que ya estaba copiado al activarse', async () => {
    const { watcher, seen } = setup('algo copiado antes de activar')
    await watcher.start()
    await vi.advanceTimersByTimeAsync(3000)
    expect(seen).toEqual([])
    watcher.stop()
  })

  it('avisa de cada texto nuevo', async () => {
    const { watcher, seen, copy } = setup('inicial')
    await watcher.start()
    copy('primer mensaje nuevo')
    await vi.advanceTimersByTimeAsync(1000)
    copy('segundo mensaje nuevo')
    await vi.advanceTimersByTimeAsync(1000)
    expect(seen).toEqual(['primer mensaje nuevo', 'segundo mensaje nuevo'])
    watcher.stop()
  })

  it('no repite el mismo contenido', async () => {
    const { watcher, seen, copy } = setup('inicial')
    await watcher.start()
    copy('mensaje repetido')
    await vi.advanceTimersByTimeAsync(5000)
    expect(seen).toEqual(['mensaje repetido'])
    watcher.stop()
  })

  it('al detenerse deja de vigilar', async () => {
    const { watcher, seen, copy } = setup('inicial')
    await watcher.start()
    watcher.stop()
    copy('mensaje tardío')
    await vi.advanceTimersByTimeAsync(5000)
    expect(seen).toEqual([])
    expect(watcher.isRunning()).toBe(false)
  })

  it('un fallo de lectura no detiene la vigilancia', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    let fail = false
    let clip = 'inicial'
    const seen: string[] = []
    const watcher = createClipboardWatcher({
      read: async () => {
        if (fail) throw new Error('portapapeles ocupado')
        return clip
      },
      onText: (t) => void seen.push(t)
    })
    await watcher.start()
    fail = true
    await vi.advanceTimersByTimeAsync(1000)
    fail = false
    clip = 'texto después del fallo'
    await vi.advanceTimersByTimeAsync(1000)
    expect(seen).toEqual(['texto después del fallo'])
    watcher.stop()
    vi.restoreAllMocks()
  })

  it('empezar dos veces no crea dos temporizadores', async () => {
    const { watcher, seen, copy } = setup('inicial')
    await watcher.start()
    await watcher.start()
    copy('un mensaje')
    await vi.advanceTimersByTimeAsync(1000)
    expect(seen).toEqual(['un mensaje'])
    watcher.stop()
  })
})

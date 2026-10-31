import { describe, expect, it } from 'vitest'
import { normalizeShortcut, shortcutFromKeyEvent } from '../src/domain/shortcut'

const press = (
  code: string,
  mods: Partial<{ ctrlKey: boolean; altKey: boolean; shiftKey: boolean }> = {}
): Parameters<typeof shortcutFromKeyEvent>[0] => ({
  key: code,
  code,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods
})

describe('shortcutFromKeyEvent', () => {
  it('arma el texto con los modificadores y la tecla física', () => {
    expect(shortcutFromKeyEvent(press('KeyG', { ctrlKey: true, shiftKey: true }))).toBe(
      'Ctrl+Shift+G'
    )
    expect(shortcutFromKeyEvent(press('Digit7', { altKey: true }))).toBe('Alt+7')
    expect(shortcutFromKeyEvent(press('F9', { ctrlKey: true }))).toBe('Ctrl+F9')
  })

  it('devuelve null mientras solo hay modificadores o teclas no permitidas', () => {
    expect(shortcutFromKeyEvent(press('ControlLeft', { ctrlKey: true }))).toBeNull()
    expect(shortcutFromKeyEvent(press('Escape', { ctrlKey: true }))).toBeNull()
    expect(shortcutFromKeyEvent(press('Enter', { ctrlKey: true }))).toBeNull()
  })

  it('lo que produce siempre es validado por normalizeShortcut', () => {
    const text = shortcutFromKeyEvent(press('KeyK', { ctrlKey: true, altKey: true }))
    expect(normalizeShortcut(text ?? '')).toMatchObject({ ok: true })
  })
})

describe('normalizeShortcut', () => {
  it('traduce el atajo por defecto al formato de Electron', () => {
    expect(normalizeShortcut('Ctrl+Shift+G')).toEqual({
      ok: true,
      display: 'Ctrl+Shift+G',
      accelerator: 'CommandOrControl+Shift+G'
    })
  })

  it('ordena los modificadores y acepta minúsculas y alias', () => {
    expect(normalizeShortcut('shift+control+alt+k')).toMatchObject({
      ok: true,
      display: 'Ctrl+Alt+Shift+K'
    })
  })

  it('acepta teclas de función y números', () => {
    expect(normalizeShortcut('Ctrl+F9')).toMatchObject({ ok: true, display: 'Ctrl+F9' })
    expect(normalizeShortcut('Alt+7')).toMatchObject({ ok: true, display: 'Alt+7' })
  })

  it('rechaza una tecla sola o sin modificador útil', () => {
    expect(normalizeShortcut('G')).toMatchObject({ ok: false })
    expect(normalizeShortcut('Shift+G')).toMatchObject({ ok: false })
  })

  it('rechaza combinaciones con dos teclas principales o sin tecla', () => {
    expect(normalizeShortcut('Ctrl+G+H')).toMatchObject({ ok: false })
    expect(normalizeShortcut('Ctrl+Shift')).toMatchObject({ ok: false })
  })

  it('rechaza teclas no permitidas', () => {
    expect(normalizeShortcut('Ctrl+Escape')).toMatchObject({ ok: false })
    expect(normalizeShortcut('Ctrl+F13')).toMatchObject({ ok: false })
  })

  it('rechaza texto vacío', () => {
    expect(normalizeShortcut('')).toMatchObject({ ok: false })
  })
})

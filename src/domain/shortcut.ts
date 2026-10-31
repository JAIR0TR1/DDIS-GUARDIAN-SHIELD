/**
 * Atajos de teclado globales. Dominio puro: valida lo que escribe el usuario y lo traduce al
 * formato de Electron («CommandOrControl+Shift+G»).
 */

export type ShortcutResult =
  { ok: true; display: string; accelerator: string } | { ok: false; reason: string }

const MODIFIER_ALIASES: Record<string, 'Ctrl' | 'Alt' | 'Shift'> = {
  ctrl: 'Ctrl',
  control: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift'
}

const ORDER = ['Ctrl', 'Alt', 'Shift'] as const

/** Teclas permitidas: una letra o dígito, o F1 a F12. */
function normalizeKey(raw: string): string | null {
  const key = raw.trim().toUpperCase()
  if (/^[A-Z0-9]$/.test(key)) return key
  if (/^F([1-9]|1[0-2])$/.test(key)) return key
  return null
}

/** Lo mínimo que necesitamos de un evento de teclado (así el dominio no depende del DOM). */
export interface KeyLike {
  key: string
  code: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
}

/**
 * Convierte una pulsación en texto como «Ctrl+Shift+G». Devuelve `null` mientras solo se
 * mantienen modificadores, o si la tecla no está permitida. Usa `code` (posición física de la
 * tecla) para que funcione igual con cualquier distribución del teclado.
 */
export function shortcutFromKeyEvent(e: KeyLike): string | null {
  let key: string | null = null
  if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3)
  else if (/^Digit[0-9]$/.test(e.code)) key = e.code.slice(5)
  else if (/^F([1-9]|1[0-2])$/.test(e.code)) key = e.code
  if (key === null) return null
  const modifiers = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift'].filter(
    (m): m is string => typeof m === 'string'
  )
  return [...modifiers, key].join('+')
}

export function normalizeShortcut(input: string): ShortcutResult {
  const parts = input
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length < 2) {
    return {
      ok: false,
      reason: 'Combina al menos una tecla modificadora (Ctrl o Alt) con una letra.'
    }
  }

  const modifiers = new Set<'Ctrl' | 'Alt' | 'Shift'>()
  let key: string | null = null
  for (const part of parts) {
    const modifier = MODIFIER_ALIASES[part.toLowerCase()]
    if (modifier) {
      modifiers.add(modifier)
      continue
    }
    if (key !== null)
      return { ok: false, reason: 'Solo puede haber una tecla además de los modificadores.' }
    key = normalizeKey(part)
    if (key === null)
      return {
        ok: false,
        reason: `La tecla «${part}» no se puede usar. Elige una letra, un número o F1 a F12.`
      }
  }

  if (key === null) return { ok: false, reason: 'Falta la tecla principal (por ejemplo, G).' }
  // Solo con Shift se interferiría al escribir mayúsculas: se exige Ctrl o Alt.
  if (!modifiers.has('Ctrl') && !modifiers.has('Alt')) {
    return { ok: false, reason: 'Incluye Ctrl o Alt para no interferir cuando escribes.' }
  }

  const ordered = ORDER.filter((m) => modifiers.has(m))
  return {
    ok: true,
    display: [...ordered, key].join('+'),
    accelerator: [...ordered.map((m) => (m === 'Ctrl' ? 'CommandOrControl' : m)), key].join('+')
  }
}

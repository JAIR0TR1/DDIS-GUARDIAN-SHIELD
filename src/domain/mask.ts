/**
 * Enmascara datos sensibles ANTES de enviar un texto a la IA: números de tarjeta, claves,
 * contraseñas, PIN, CVV y códigos de verificación. Dominio puro.
 *
 * No intenta ser perfecto: reduce lo que sale del equipo. Las reglas locales siempre ven el
 * texto original (nunca sale de la computadora).
 */

export interface MaskResult {
  text: string
  /** Cuántos fragmentos se taparon. */
  masked: number
}

const LABEL = String.raw`(?:clave|contrase[nñ]a|password|pin|cvv|cvc|token|otp)`
const QUALIFIER = String.raw`(?:\s+(?:din[aá]mica|de\s+\p{L}+))?`

// Tarjeta: 13 a 19 dígitos, con espacios o guiones entre grupos.
const CARD = /(?<![\d-])(?:\d[ -]?){12,18}\d(?![\d-])/g
// «clave: abc123», «contraseña es Hola2026», «pin=4821»
const LABELLED = new RegExp(
  String.raw`\b(${LABEL}${QUALIFIER}\s*(?::|=|\bes\b|\bson\b)\s*)(\S{3,})`,
  'giu'
)
// «clave 4821», «PIN 123456»
const LABEL_THEN_NUMBER = new RegExp(String.raw`\b(${LABEL}${QUALIFIER}\s+)(\d{3,8})\b`, 'giu')
// «código de verificación 482193», «codigo: 4821»
const CODE = /\b(c[oó]digo(?:\s+de\s+\p{L}+)?\s*(?::|=|\bes\b)?\s*)(\d{4,8})\b/giu

export function maskSensitive(text: string): MaskResult {
  let masked = 0
  const hide = (tag: string) => (): string => {
    masked += 1
    return tag
  }
  const keepLabel =
    (tag: string) =>
    (_match: string, label: string): string => {
      masked += 1
      return `${label}${tag}`
    }

  const out = text
    .replace(CARD, hide('[TARJETA]'))
    .replace(LABELLED, keepLabel('[OCULTO]'))
    .replace(LABEL_THEN_NUMBER, keepLabel('[OCULTO]'))
    .replace(CODE, keepLabel('[CODIGO]'))
  return { text: out, masked }
}

/** Quita las marcas que delimitan el mensaje, para que el texto no pueda «cerrar» el bloque. */
export function stripDelimiters(text: string, markers: readonly string[]): string {
  return markers.reduce((acc, marker) => acc.split(marker).join(''), text)
}

import { maskSensitive } from './mask'
import { findLinks } from './text'

/**
 * Filtro del vigilante del portapapeles. Decide si lo copiado merece analizarse.
 * Regla de oro: ante la duda sobre si es un dato personal (contraseña, clave, tarjeta), NO se
 * analiza ni se guarda. Dominio puro.
 */

export type ClipboardDecision = { analyze: true } | { analyze: false; reason: string }

const MIN_LENGTH = 12
const MAX_LENGTH = 5000

/** Claves y tokens conocidos: nunca deben pasar por el analizador. */
const KNOWN_SECRETS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}\b/, // JWT
  /\bAIza[\w-]{20,}\b/, // Google
  /\bsk-[\w-]{20,}\b/, // OpenAI y similares
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, // GitHub
  /\bxox[abprs]-[\w-]{10,}\b/, // Slack
  /\bAKIA[0-9A-Z]{16}\b/ // AWS
]

/** ¿Parece un número de tarjeta (13 a 19 dígitos, con espacios o guiones)? */
function looksLikeCardNumber(text: string): boolean {
  const digits = text.replace(/[\s-]/g, '')
  return /^\d{13,19}$/.test(digits)
}

/** Una sola «palabra» que mezcla clases de caracteres es casi siempre una contraseña o un token. */
function looksLikePasswordToken(text: string): boolean {
  if (/\s/.test(text) || text.length < 8 || text.length > 200) return false
  if (findLinks(text).length > 0) return false // un link no es una contraseña
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(text)).length
  if (classes >= 3) return true
  if (/^[0-9a-f]{24,}$/i.test(text)) return true // hash o token hexadecimal
  return /^[A-Za-z0-9+/_-]{24,}={0,2}$/.test(text) // base64 / token largo
}

export function decideClipboard(raw: string): ClipboardDecision {
  const text = raw.trim()
  if (text.length < MIN_LENGTH) return { analyze: false, reason: 'muy corto' }
  if (text.length > MAX_LENGTH) return { analyze: false, reason: 'muy largo' }
  if (KNOWN_SECRETS.some((re) => re.test(text))) return { analyze: false, reason: 'clave o token' }
  if (looksLikeCardNumber(text)) return { analyze: false, reason: 'número de tarjeta' }
  if (looksLikePasswordToken(text)) return { analyze: false, reason: 'parece una contraseña' }

  // «clave: Hola2026» o «contraseña es …» en un texto corto: alguien copiando sus propios datos.
  if (text.length <= 80 && maskSensitive(text).masked > 0 && findLinks(text).length === 0) {
    return { analyze: false, reason: 'contiene datos sensibles' }
  }

  // Un mensaje de verdad tiene varias palabras, o es un link.
  const words = text.split(/\s+/).length
  if (words < 3 && findLinks(text).length === 0)
    return { analyze: false, reason: 'no parece un mensaje' }
  return { analyze: true }
}

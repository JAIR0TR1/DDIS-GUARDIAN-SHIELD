/**
 * Fuerza de una contraseña y sugerencia de una segura. Dominio puro (sin React ni red).
 * No pretende ser un estimador perfecto: penaliza lo típico (secuencias, repeticiones,
 * contraseñas comunes) y premia longitud y variedad, para guiar al usuario al registrarse.
 */

export type PasswordStrength = 'debil' | 'aceptable' | 'fuerte'

export type PasswordHint = 'length' | 'longer' | 'number' | 'symbol' | 'case' | 'common' | 'pattern'

export interface PasswordCheck {
  strength: PasswordStrength
  /** 0 a 4, para dibujar el medidor. */
  score: number
  /** Qué mejorar, en orden de importancia (como mucho dos). */
  hints: PasswordHint[]
}

const COMMON = [
  'password',
  'contraseña',
  'contrasena',
  'qwerty',
  'abc123',
  'iloveyou',
  'colombia',
  'admin',
  'welcome',
  'bienvenido',
  'nequi',
  'bancolombia'
]

const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']

/** ¿Tiene 4 o más caracteres seguidos de una secuencia (1234, abcd, qwer) en cualquier sentido? */
function hasSequence(lower: string): boolean {
  for (const seq of SEQUENCES) {
    const both = [seq, [...seq].reverse().join('')]
    for (const s of both) {
      for (let i = 0; i + 4 <= s.length; i++) if (lower.includes(s.slice(i, i + 4))) return true
    }
  }
  return false
}

export function checkPassword(password: string): PasswordCheck {
  const lower = password.toLowerCase()
  const hasLower = /[a-zñ]/.test(password)
  const hasUpper = /[A-ZÑ]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-zÑñ0-9]/.test(password)
  const repeated = /(.)\1{2,}/.test(password)
  const common = COMMON.some((word) => lower.includes(word))
  const pattern = hasSequence(lower) || repeated
  const classes = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (classes >= 3) score++
  if (classes === 4) score++
  if (common) score -= 2
  if (pattern) score -= 1
  score = Math.max(0, Math.min(4, score))

  const hints: PasswordHint[] = []
  if (password.length < 8) hints.push('length')
  if (common) hints.push('common')
  if (pattern) hints.push('pattern')
  if (!hasNumber) hints.push('number')
  if (!hasSymbol) hints.push('symbol')
  if (!(hasLower && hasUpper)) hints.push('case')
  if (password.length >= 8 && password.length < 12) hints.push('longer')

  const strength: PasswordStrength =
    password.length < 8 || score <= 1 ? 'debil' : score >= 3 ? 'fuerte' : 'aceptable'
  return { strength, score, hints: hints.slice(0, 2) }
}

const WORDS = [
  'Escudo',
  'Nilo',
  'Cometa',
  'Volcan',
  'Brisa',
  'Faro',
  'Orbita',
  'Jaguar',
  'Condor',
  'Lluvia',
  'Cumbre',
  'Rio',
  'Bosque',
  'Trueno',
  'Coral',
  'Aurora'
]
const SYMBOLS = '!#$%&*+-=?@'

/**
 * Contraseña fuerte y fácil de copiar: tres palabras, números y un símbolo
 * (p. ej. «Faro-Cometa-Jaguar47!»). `random` devuelve enteros en [0, max) y se inyecta para
 * poder probarlo; por defecto usa el generador criptográfico del sistema.
 */
export function suggestPassword(
  random: (max: number) => number = (max) => crypto.getRandomValues(new Uint32Array(1))[0] % max
): string {
  const word = (): string => WORDS[random(WORDS.length)] ?? 'Escudo'
  const digits = String(random(90) + 10)
  const symbol = SYMBOLS[random(SYMBOLS.length)] ?? '!'
  return `${word()}-${word()}-${word()}${digits}${symbol}`
}

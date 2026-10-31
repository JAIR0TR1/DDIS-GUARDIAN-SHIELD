/** Utilidades de texto para las reglas. Dominio puro. */

export type Span = readonly [start: number, end: number]

/**
 * Minúsculas y sin tildes, conservando la longitud: cada carácter se reemplaza por otro
 * (á → a, ñ → n). Así los índices del texto normalizado sirven sobre el texto original
 * para resaltar las señales detectadas.
 */
export function fold(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const decomposed = text[i].normalize('NFD')
    out += decomposed.length > 1 ? decomposed[0] : decomposed
  }
  out = out.toLowerCase()
  return out.length === text.length ? out : text.toLowerCase()
}

export interface FoundLink {
  /** Texto del link tal como aparece. */
  raw: string
  /** Dominio en minúsculas, sin esquema, usuario ni puerto. */
  host: string
  hasUserInfo: boolean
  span: Span
}

// Cuantificadores acotados: sin retroceso catastrófico con texto hostil.
const LINK =
  /\b(?:(?:https?|ftp):\/\/)?(?:[a-z0-9-]{1,63}\.){1,8}[a-z]{2,24}(?::\d{2,5})?(?:\/[^\s<>"']{0,300})?/gi
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?(?:\/[^\s<>"']{0,300})?/g

/** Palabras que parecen dominios pero no lo son ("Dr.Lopez", "S.A.S", extensiones de archivo). */
const NOT_A_HOST_TLD = new Set([
  'sas',
  'ltda',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'png',
  'jpg',
  'txt'
])

/**
 * Extensiones reconocidas. Un texto sin "http" ni "www" solo se considera link si termina en una
 * de ellas: así "Dr.Lopez" o "mañana.Nos" no cuentan como dominios.
 */
const KNOWN_TLDS = new Set([
  'com',
  'co',
  'net',
  'org',
  'edu',
  'gov',
  'info',
  'biz',
  'io',
  'me',
  'app',
  'dev',
  'ai',
  'ly',
  'gl',
  'is',
  'gd',
  'gy',
  'to',
  'cc',
  'ws',
  'tv',
  'us',
  'es',
  'mx',
  'ar',
  'cl',
  'pe',
  'ec',
  've',
  'br',
  'xyz',
  'top',
  'click',
  'site',
  'online',
  'icu',
  'live',
  'vip',
  'buzz',
  'work',
  'rest',
  'monster',
  'shop',
  'store',
  'link',
  'cloud',
  'tech',
  'pro'
])

function hostOf(raw: string): { host: string; hasUserInfo: boolean } {
  let rest = raw.replace(/^[a-z]+:\/\//i, '')
  const slash = rest.search(/[/?#]/)
  if (slash !== -1) rest = rest.slice(0, slash)
  const at = rest.lastIndexOf('@')
  const hasUserInfo = at !== -1
  if (hasUserInfo) rest = rest.slice(at + 1)
  return { host: rest.replace(/:\d+$/, '').toLowerCase(), hasUserInfo }
}

/** Encuentra links y direcciones IP en el texto original. */
export function findLinks(text: string): FoundLink[] {
  const found: FoundLink[] = []
  for (const re of [LINK, IPV4]) {
    for (const match of text.matchAll(re)) {
      const raw = match[0]
      const { host, hasUserInfo } = hostOf(raw)
      const tld = host.split('.').pop() ?? ''
      const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
      if (!isIp && (NOT_A_HOST_TLD.has(tld) || /^\d+$/.test(tld))) continue
      const explicit = /^(?:[a-z]+:\/\/|www\.)/i.test(raw)
      if (!isIp && !explicit && !KNOWN_TLDS.has(tld)) continue
      const start = match.index ?? 0
      if (found.some((f) => start < f.span[1] && f.span[0] < start + raw.length)) continue
      found.push({ raw, host, hasUserInfo, span: [start, start + raw.length] })
    }
  }
  return found.sort((a, b) => a.span[0] - b.span[0])
}

/** Todas las coincidencias de una expresión (con índices) sobre el texto normalizado. */
export function spansOf(re: RegExp, text: string, max = 4): Span[] {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
  const spans: Span[] = []
  for (const m of text.matchAll(new RegExp(re.source, flags))) {
    const start = m.index ?? 0
    spans.push([start, start + m[0].length])
    if (spans.length >= max) break
  }
  return spans
}

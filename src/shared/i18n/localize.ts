import { es, type MessageKey } from './es'
import type { Translate } from './index'

/**
 * Los textos que produce el análisis (señales, voz de Nilo, acciones y avisos) se generan y se
 * guardan en español. Para mostrarlos en otro idioma se reconocen por su texto exacto en español
 * (las claves `result.*`) y se traducen al mostrarlos; así el historial viejo también se traduce
 * y el motor de análisis no depende del idioma. Un texto desconocido (por ejemplo, el que escribió
 * la IA) se muestra tal cual.
 */

interface KnownText {
  key: MessageKey
  regex: RegExp
  names: string[]
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function buildKnown(): KnownText[] {
  return (Object.keys(es) as MessageKey[])
    .filter((key) => key.startsWith('result.'))
    .map((key) => {
      const names: string[] = []
      // «{marca}» se vuelve un grupo que captura el nombre variable.
      const pattern = escapeRegex(es[key]).replace(/\\\{(\w+)\\\}/g, (_marker, name: string) => {
        names.push(name)
        return '(.+?)'
      })
      return { key, regex: new RegExp(`^${pattern}$`), names }
    })
}

const KNOWN = buildKnown()

/** El consejo de lo dudoso termina con esta frase fija, pegada a otra conocida. */
const DOUBT_SUFFIX = ' Mientras tanto, no des datos ni hagas clic.'
const DOUBT_SUFFIX_KEY = KNOWN.find((k) => k.regex.test(DOUBT_SUFFIX.trim()))?.key

export function localizeText(text: string, t: Translate): string {
  if (DOUBT_SUFFIX_KEY && text.endsWith(DOUBT_SUFFIX)) {
    const head = text.slice(0, -DOUBT_SUFFIX.length)
    return `${localizeText(head, t)} ${t(DOUBT_SUFFIX_KEY)}`
  }
  for (const known of KNOWN) {
    const match = known.regex.exec(text)
    if (!match) continue
    const params: Record<string, string> = {}
    known.names.forEach((name, index) => {
      params[name] = match[index + 1] ?? ''
    })
    return t(known.key, params)
  }
  return text
}

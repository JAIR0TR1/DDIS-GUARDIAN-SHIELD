/**
 * Texto seguro para mostrar contenido NO confiable: los links nunca son clicables.
 * Se neutralizan reemplazando los puntos del dominio por "[.]" y "http" por "hxxp".
 * El texto se muestra siempre como texto plano (React lo escapa), nunca como HTML.
 */

// Cuantificadores acotados: evita retroceso catastrófico (ReDoS) con texto hostil muy largo.
const URL_LIKE =
  /\b(?:(?:https?|ftp):\/\/)?(?:[a-z0-9-]{1,63}\.){1,8}[a-z]{2,24}(?::\d{2,5})?(?:\/[^\s<>"']{0,300})?/gi

/** Dominios que parecen links pero son abreviaturas comunes o números ("3.5", "S.A."). */
function looksLikeRealLink(candidate: string): boolean {
  if (/^(?:https?|ftp):\/\//i.test(candidate)) return true
  const host = candidate.split('/')[0].toLowerCase()
  const tld = host.split('.').pop() ?? ''
  if (/^\d+$/.test(tld)) return false
  return tld.length >= 2
}

export function neutralizeLinks(text: string): string {
  return text.replace(URL_LIKE, (match) => {
    if (!looksLikeRealLink(match)) return match
    const schemeEnd = match.indexOf('://')
    const scheme = schemeEnd === -1 ? '' : match.slice(0, schemeEnd + 3)
    const afterScheme = match.slice(scheme.length)
    const hostEnd = afterScheme.search(/[/?#:]/)
    const host = hostEnd === -1 ? afterScheme : afterScheme.slice(0, hostEnd)
    const rest = hostEnd === -1 ? '' : afterScheme.slice(hostEnd)
    // "https://" → "hxxps://": ni siquiera el esquema queda reconocible como enlace.
    return `${scheme.replaceAll(/t/gi, 'x')}${host.replaceAll('.', '[.]')}${rest}`
  })
}

/** Recorta un fragmento para historial y tarjetas. */
export function excerpt(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}
